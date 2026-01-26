const API_BASE_URL = 'http://localhost:8000'; // Backend URL

export const fetchDataSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data summary:", error);
    return null;
  }
};

export const postPrediction = async (transactionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error posting prediction:", error);
    return null;
  }
};

export const fetchTransactionList = async (skip = 0, limit = 50, filters = {}) => {
  try {
    const params = new URLSearchParams({ skip, limit });

    for (const key in filters) {
      if (
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ''
      ) {
        params.append(key, filters[key]);
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/api/transactions?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching transaction list:", error);
    return null;
  }
};

export const fetchTimeSeriesData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/time-series`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return null;
  }
};

export const fetchAmountDistributionData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/amount-distribution`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching amount distribution data:", error);
    return null;
  }
};

export const fetchFraudTimeSeriesData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/fraud-time-series`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching fraud time series data:", error);
    return null;
  }
};

export const fetchFraudAmountDistributionData = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/data/fraud-amount-distribution`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching fraud amount distribution data:", error);
    return null;
  }
};
