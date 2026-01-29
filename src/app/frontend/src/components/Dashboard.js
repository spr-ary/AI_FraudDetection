import React, { useEffect, useState } from 'react';
import { Row, Col, Container, Spinner } from 'react-bootstrap';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js';
import {
  fetchDataSummary,
  fetchTimeSeriesData,
  fetchAmountDistributionData,
  fetchFraudTimeSeriesData,
  fetchFraudAmountDistributionData,
} from '../api';
import './Dashboard.css';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [fraudTimeSeriesData, setFraudTimeSeriesData] = useState(null);
  const [amountDistributionData, setAmountDistributionData] = useState(null);
  const [fraudAmountDistributionData, setFraudAmountDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const summaryData = await fetchDataSummary();
        if (summaryData) setSummary(summaryData);

        const tsData = await fetchTimeSeriesData();
        if (tsData) setTimeSeriesData(tsData);

        const fraudTsData = await fetchFraudTimeSeriesData();
        if (fraudTsData) setFraudTimeSeriesData(fraudTsData);

        const amountData = await fetchAmountDistributionData();
        if (amountData) setAmountDistributionData(amountData);

        const fraudAmountData = await fetchFraudAmountDistributionData();
        if (fraudAmountData) setFraudAmountDistributionData(fraudAmountData);
      } catch (err) {
        setError('An error occurred while fetching dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  if (loading) {
    return (
      <Container className="dashboard-container mt-5">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" className="loading-spinner" />
          <p className="loading-text">Loading analytics...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="dashboard-container mt-5">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
        </div>
      </Container>
    );
  }

  if (!summary) {
    return (
      <Container className="dashboard-container mt-5">
        <div className="error-container">
          <p className="error-text">No summary data available.</p>
        </div>
      </Container>
    );
  }

  const fraudRate = ((summary.fraud_count / summary.total_transactions) * 100).toFixed(2);
  const legitimateRate = ((summary.non_fraud_count / summary.total_transactions) * 100).toFixed(2);

  const doughnutChartData = {
    labels: ['Legitimate', 'Fraudulent'],
    datasets: [
      {
        data: [summary.non_fraud_count, summary.fraud_count],
        backgroundColor: ['#059669', '#dc2626'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverBackgroundColor: ['#10b981', '#ef4444'],
        hoverBorderWidth: 3,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          color: '#64748b',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        padding: 10,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '70%',
  };

  const totalLineChartData = {
    labels: timeSeriesData ? timeSeriesData.labels.map((h) => `${h}:00`) : [],
    datasets: [
      {
        label: 'Total Transactions',
        data: timeSeriesData ? timeSeriesData.data : [],
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderColor: '#2563eb',
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const fraudLineChartData = {
    labels: fraudTimeSeriesData ? fraudTimeSeriesData.labels.map((h) => `${h}:00`) : [],
    datasets: [
      {
        label: 'Fraudulent Transactions',
        data: fraudTimeSeriesData ? fraudTimeSeriesData.data : [],
        fill: true,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        borderColor: '#dc2626',
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const nonFraudBarChartData = {
    labels: amountDistributionData ? amountDistributionData.labels : [],
    datasets: [
      {
        label: 'Legitimate Transactions',
        data: amountDistributionData ? amountDistributionData.data : [],
        backgroundColor: 'rgba(5, 150, 105, 0.85)',
        borderColor: '#059669',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#10b981',
        hoverBorderWidth: 2,
      },
    ],
  };

  const fraudBarChartData = {
    labels: fraudAmountDistributionData ? fraudAmountDistributionData.labels : [],
    datasets: [
      {
        label: 'Fraudulent Transactions',
        data: fraudAmountDistributionData ? fraudAmountDistributionData.data : [],
        backgroundColor: 'rgba(220, 38, 38, 0.85)',
        borderColor: '#dc2626',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#ef4444',
        hoverBorderWidth: 2,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        padding: 10,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: '#64748b', maxRotation: 0, padding: 6 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.5)', drawBorder: false },
        ticks: {
          font: { size: 10 },
          color: '#64748b',
          padding: 8,
          callback: function (value) {
            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
            return value;
          },
        },
        border: { display: false },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        padding: 10,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: '#64748b', maxRotation: 0, padding: 6 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.5)', drawBorder: false },
        ticks: { font: { size: 10 }, color: '#64748b', padding: 8 },
        border: { display: false },
      },
    },
  };

  return (
    <Container fluid className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="dashboard-title">Fraud Detection Dashboard</h1>
          </div>
          <div className="header-status">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="kpi-row">
        <Col lg={3} md={6} sm={12} className="kpi-col">
          <div className="kpi-card kpi-card-1">
            <div className="kpi-icon-container">
              <div className="kpi-icon kpi-icon-total">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Transactions</div>
              <div className="kpi-value">{summary.total_transactions.toLocaleString()}</div>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6} sm={12} className="kpi-col">
          <div className="kpi-card kpi-card-2">
            <div className="kpi-icon-container">
              <div className="kpi-icon kpi-icon-safe">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Non-Fraudulent</div>
              <div className="kpi-value">{summary.non_fraud_count.toLocaleString()}</div>
              <div className="kpi-percentage kpi-percentage-safe">{legitimateRate}%</div>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6} sm={12} className="kpi-col">
          <div className="kpi-card kpi-card-3">
            <div className="kpi-icon-container">
              <div className="kpi-icon kpi-icon-fraud">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Fraudulent</div>
              <div className="kpi-value">{summary.fraud_count.toLocaleString()}</div>
              <div className="kpi-percentage kpi-percentage-fraud">{fraudRate}%</div>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6} sm={12} className="kpi-col">
          <div className="kpi-card kpi-card-4">
            <div className="kpi-icon-container">
              <div className="kpi-icon kpi-icon-rate">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Fraud Rate</div>
              <div className="kpi-value">{fraudRate}%</div>
              <div className="kpi-badge">
                {parseFloat(fraudRate) < 1 ? 'Low Risk' : parseFloat(fraudRate) < 5 ? 'Medium Risk' : 'High Risk'}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="charts-row charts-row-top g-3">
        <Col lg={6} className="chart-col">
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title">Transaction Class Distribution</div>
            </div>
            <div className="chart-body chart-body-doughnut">
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
              <div className="doughnut-center-text">
                <div className="center-value">{summary.total_transactions.toLocaleString()}</div>
                <div className="center-label">Total</div>
              </div>
            </div>
          </div>
        </Col>

        <Col lg={6} className="chart-col">
          <div className="right-stack">
            <div className="chart-card chart-card-compact">
              <div className="chart-header">
                <h3 className="chart-title">Total Transactions Over Time</h3>
                <span className="chart-subtitle">Total per hour</span>
              </div>
              <div className="chart-body chart-body-line chart-body-line-compact">
                <Line data={totalLineChartData} options={lineOptions} />
              </div>
            </div>

            <div className="chart-card chart-card-compact">
              <div className="chart-header">
                <h3 className="chart-title">Fraudulent Transactions Over Time</h3>
                <span className="chart-subtitle">Fraud per hour</span>
              </div>
              <div className="chart-body chart-body-line chart-body-line-compact">
                <Line data={fraudLineChartData} options={lineOptions} />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Amount Distribution */}
      <Row className="charts-row">
        <Col lg={6} md={6} sm={12} className="chart-col">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Non-Fraudulent Transaction Amount Distribution</h3>
              <span className="chart-subtitle">Distribution by value range</span>
            </div>
            <div className="chart-body chart-body-bar">
              <Bar data={nonFraudBarChartData} options={barOptions} />
            </div>
          </div>
        </Col>

        <Col lg={6} md={6} sm={12} className="chart-col">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Fraudulent Transaction Amount Distribution</h3>
              <span className="chart-subtitle">Distribution by value range</span>
            </div>
            <div className="chart-body chart-body-bar">
              <Bar data={fraudBarChartData} options={barOptions} />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
