import pandas as pd
import numpy as np 
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from keras.models import Sequential
from keras.layers import Dense
from keras.callbacks import EarlyStopping

import glob
import matplotlib.pyplot as plt
import seaborn as sns
from imblearn.over_sampling import SMOTE
from collections import Counter

# Load and combine the datasets
df = pd.read_csv('creditcard.csv')
x = df.drop('Class', axis=1)
y = df['Class']
X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)

#Preprocessing
#Create copies to avoid SettingWithCopyWarning
X_train = X_train.copy()
X_test = X_test.copy()

scaler = StandardScaler()
X_train['Amount'] = scaler.fit_transform(X_train['Amount'].values.reshape(-1,1))
X_test['Amount'] = scaler.transform(X_test['Amount'].values.reshape(-1,1))

X_train['Time'] = scaler.fit_transform(X_train['Time'].values.reshape(-1,1))
X_test['Time'] = scaler.transform(X_test['Time'].values.reshape(-1,1))

# Balancing the dataset using SMOTE
print(f"Original training set class distribution: {Counter(y_train)}")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
print(f"Resampled training set class distribution: {Counter(y_train_resampled)}")

X_train_final, X_val, y_train_final, y_val = train_test_split(X_train_resampled, y_train_resampled, test_size=0.2, random_state=42, stratify=y_train_resampled)

print(f"Training set class distribution: {Counter(y_train_final)}")
print(f"Validation set class distribution: {Counter(y_val)}")
print(f"Test set class distribution: {Counter(y_test)}")

# Build the model
model = Sequential()
model.add(Dense(30, activation='relu', input_shape=(X_train.shape[1],)))
model.add(Dense(15, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

#Model Compilation
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

#Early Stopping
early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

history = model.fit(X_train_final, y_train_final, epochs=50, batch_size=2048, validation_data=(X_val, y_val), callbacks=[early_stopping], verbose=1)

loss, accuracy = model.evaluate(X_test, y_test)
print(f"Loss: {loss}") 
print(f"Accuracy: {accuracy}")

y_pred = (model.predict(X_test) > 0.5).astype("int32")
print(classification_report(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(5,5))
sns.heatmap(cm, annot=True, fmt='d')
plt.title('Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.savefig('confusion_matrix.png')

# Calculate and print correct predictions
tn, fp, fn, tp = cm.ravel()
total_correct = tn + tp
total_samples = cm.sum()
print(f"Total correct predictions: {total_correct} out of {total_samples}")

# save the model
model.save('fraud_detection_model.h5')