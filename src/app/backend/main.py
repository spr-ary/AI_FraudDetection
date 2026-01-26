import os
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import glob
from sklearn.preprocessing import StandardScaler

app =FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Define paths relative to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent

# MODEL_PATH = BACKEND_DIR / 'fraud_detection_model.h5'
MODEL_PATH = BACKEND_DIR / 'fraud_detection_model_with_early_stopping.h5'
DATA_GLOB_PATTERN = str(BACKEND_DIR / 'creditcard.csv')

#Global variables to store loaded data and model
fraud_detection_model = None
credit_card_data = None
scaler = None

def create_and_save_dummy_model():
    #Create a simple sequential model
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(30,)),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.save(MODEL_PATH)
    print(f"Dummy model created and saved to {MODEL_PATH}")
    
@app.on_event("startup")
async def load_resources():
    global fraud_detection_model, credit_card_data, scaler
    print("Loading AI model and data...")

    if not MODEL_PATH.exists():
        print(f"AI model not found at {MODEL_PATH}. Creating a dummy model.")
        create_and_save_dummy_model()   

    try:
        fraud_detection_model = tf.keras.models.load_model(MODEL_PATH)
        print(f"AI model loaded successfully from {MODEL_PATH}.")
    except Exception as e:
        print(f"Error loading AI model from {MODEL_PATH}: {e}")
        fraud_detection_model = None
        
    # Load credit card data
    if os.path.isfile(DATA_GLOB_PATTERN):
        try:
            credit_card_data = pd.read_csv(DATA_GLOB_PATTERN)
            print(f"Credit card data loaded successfully from {DATA_GLOB_PATTERN}")
            print(f"Total records: {len(credit_card_data)}")
        except Exception as e:
            print(f"Error loading credit card data from {DATA_GLOB_PATTERN}: {e}")
            credit_card_data = None
    else:
        all_files = glob.glob(DATA_GLOB_PATTERN)
        if all_files:
            try:
                # Read and concatenate all matching CSV files
                list_df = []
                for f in all_files:
                    df = pd.read_csv(f)
                    list_df.append(df)

                credit_card_data = pd.concat(list_df, ignore_index=True)
                print(f"Credit card data loaded successfully from {len(all_files)} files.")
                print(f"Total records: {len(credit_card_data)}")
            except Exception as e:
                print(f"Error loading credit card data from {DATA_GLOB_PATTERN}: {e}")
                credit_card_data = None
        else:
            print(f"No credit card data files found matching {DATA_GLOB_PATTERN}")

    # Initialize and fit the scaler
    if credit_card_data is not None:
        scaler = StandardScaler()
        scaler.fit(credit_card_data[['Time', 'Amount']])
        print("Scaler initialized and fitted successfully.")

@app.get("/")
async def root():
    return {"message": "Fraud Detection AI is running."}

@app.get("/api/data/summary")
async def get_data_summary():
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    # Assuming 'Class' column indicates fraud (1) or not (0)
    fraud_count = credit_card_data['Class'].sum()
    total_transactions = len(credit_card_data)
    non_fraud_count = total_transactions - fraud_count

    return {
        "total_transactions": total_transactions,
        "fraud_count": int(fraud_count),
        "non_fraud_count": int(non_fraud_count),
        "fraud_percentage": (fraud_count / total_transactions * 100)
        if total_transactions > 0 else 0
    }

@app.post("/api/predict")
async def predict_fraud(transaction_data: dict):
    if fraud_detection_model is None:
        raise HTTPException(status_code=500, detail="AI model not loaded.")
    if credit_card_data is None:
        raise HTTPException(
            status_code=500,
            detail="Credit card data not loaded, cannot get feature names."
        )
    if scaler is None:
        raise HTTPException(status_code=500, detail="Scaler not initialized.")

    feature_columns = [
        col for col in credit_card_data.columns if col not in ['Class']
    ]

    # Create a DataFrame from the input, ensuring all expected features are present
    input_df = pd.DataFrame([transaction_data])

    # Reindex to ensure all model features are present, filling missing with 0 or appropriate default
    # This is a simplified approach; a proper preprocessing pipeline should be used
    input_df = input_df.reindex(columns=feature_columns, fill_value=0)

    # Scale the 'Time' and 'Amount' features
    input_df[['Time', 'Amount']] = scaler.transform(input_df[['Time', 'Amount']])
    
    # Make prediction
    prediction = fraud_detection_model.predict(input_df)

    # Assuming binary classification, outputting probability of fraud
    fraud_probability = float(prediction[0][0])

    return {
        "fraud_probability": fraud_probability,
        "prediction": "Fraudulent" if fraud_probability > 0.5 else "Legitimate"
    }

@app.get("/api/transactions")
async def get_transactions(
    skip: int = 0,
    limit: int = 50,  # Default limit
    min_amount: float = None,
    max_amount: float = None,
    transaction_class: int = None,
    min_time: float = None,
    max_time: float = None,
):
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    filtered_data = credit_card_data.copy()

    # Apply filters
    if min_amount is not None:
        filtered_data = filtered_data[filtered_data['Amount'] >= min_amount]
    if max_amount is not None:
        filtered_data = filtered_data[filtered_data['Amount'] <= max_amount]
    if transaction_class is not None:
        filtered_data = filtered_data[filtered_data['Class'] == transaction_class]
    if min_time is not None:
        filtered_data = filtered_data[filtered_data['Time'] >= min_time]
    if max_time is not None:
        filtered_data = filtered_data[filtered_data['Time'] <= max_time]

    total_filtered_transactions = len(filtered_data)

    # Ensure skip and limit are valid
    if skip < 0:
        skip = 0
    if limit <= 0:
        limit = 50  # Ensure limit is at least 50

    # Get a slice of the data
    transactions_slice = filtered_data.iloc[skip: skip + limit]

    # Convert DataFrame slice to a list of dictionaries for JSON serialization
    return {
        "total": total_filtered_transactions,
        "transactions": transactions_slice.to_dict(orient="records")
    }


@app.get("/api/data/time-series")
async def get_data_time_series():
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    # Convert 'Time' from seconds to hours
    time_series_data = credit_card_data.copy()
    time_series_data['Hour'] = (
        time_series_data['Time']
        .apply(lambda x: (x / 3600) % 24)
        .round()
    )

    # Group by hour and count transactions
    transactions_by_hour = (
        time_series_data
        .groupby('Hour')
        .size()
        .reset_index(name='count')
    )

    # Sort by hour
    transactions_by_hour = transactions_by_hour.sort_values('Hour')

    return {
        "labels": transactions_by_hour['Hour'].tolist(),
        "data": transactions_by_hour['count'].tolist()
    }

@app.get("/api/data/amount-distribution")
async def get_amount_distribution():
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    # Define bins for transaction amounts
    bins = [0, 10, 50, 100, 500, 1000, 5000, 10000, 20000, 30000]
    labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins) - 1)]

    # Create a new column with amount bins
    amount_bins = pd.cut(
        credit_card_data['Amount'],
        bins=bins,
        labels=labels,
        right=False
    )

    # Count transactions in each bin
    distribution = amount_bins.value_counts().sort_index()

    return {
        "labels": distribution.index.tolist(),
        "data": distribution.values.tolist()
    }

@app.get("/api/data/fraud-time-series")
async def get_fraud_time_series():
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    fraud_data = credit_card_data[credit_card_data['Class'] == 1].copy()
    fraud_data['Hour'] = fraud_data['Time'].apply(lambda x: (x / 3600) % 24).round()

    fraud_transactions_by_hour = (
        fraud_data
        .groupby('Hour')
        .size()
        .reset_index(name='count')
    )
    fraud_transactions_by_hour = fraud_transactions_by_hour.sort_values('Hour')

    # Ensure all 24 hours are present, filling missing with 0
    all_hours = pd.DataFrame({'Hour': range(24)})
    fraud_transactions_by_hour = (pd.merge(all_hours, fraud_transactions_by_hour, on='Hour', how='left').fillna(0))
    fraud_transactions_by_hour['count'] = fraud_transactions_by_hour['count'].astype(int)

    return {
        "labels": fraud_transactions_by_hour['Hour'].tolist(),
        "data": fraud_transactions_by_hour['count'].tolist()
    }

@app.get("/api/data/fraud-amount-distribution")
async def get_fraud_amount_distribution():
    if credit_card_data is None:
        raise HTTPException(status_code=500, detail="Credit card data not loaded.")

    fraud_data = credit_card_data[credit_card_data['Class'] == 1].copy()

    bins = [0, 10, 50, 100, 500, 1000, 5000, 10000, 20000, 30000]
    labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins) - 1)]

    # Create a new column with amount bins for all data
    # This ensures that all possible bins are considered, even if no fraud in a bin
    all_amount_bins = pd.cut(
        credit_card_data['Amount'],
        bins=bins,
        labels=labels,
        right=False
    )

    # Now apply the same binning to fraudulent data
    fraud_amount_bins = pd.cut(
        fraud_data['Amount'],
        bins=bins,
        labels=labels,
        right=False
    )

    # Count fraudulent transactions in each bin
    fraud_distribution = (
        fraud_amount_bins
        .value_counts()
        .reindex(labels, fill_value=0)
    )

    return {
        "labels": fraud_distribution.index.tolist(),
        "data": fraud_distribution.values.tolist()
    }
