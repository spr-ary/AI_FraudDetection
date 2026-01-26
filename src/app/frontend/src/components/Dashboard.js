import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Container } from 'react-bootstrap';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { fetchDataSummary, fetchTimeSeriesData, fetchAmountDistributionData, fetchFraudTimeSeriesData, fetchFraudAmountDistributionData } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

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
                if (summaryData) {
                    setSummary(summaryData);
                }

                const tsData = await fetchTimeSeriesData();
                if (tsData) {
                    setTimeSeriesData(tsData);
                }

                const fraudTsData = await fetchFraudTimeSeriesData();
                if (fraudTsData) {
                    setFraudTimeSeriesData(fraudTsData);
                }

                const amountData = await fetchAmountDistributionData();
                if (amountData) {
                    setAmountDistributionData(amountData);
                }

                const fraudAmountData = await fetchFraudAmountDistributionData();
                if (fraudAmountData) {
                    setFraudAmountDistributionData(fraudAmountData);
                }
            } catch (err) {
                setError("An error occurred while fetching dashboard data.");
                console.error(err);
            } 
            finally {
                setLoading(false);
            }
        };
        getData();
    }, []);
    
    if (loading) return <Container className="mt-4"><p>Loading dashboard data...</p></Container>;
    if (error) return <Container className="mt-4"><p className="text-danger">{error}</p></Container>;
    if (!summary) return <Container className="mt-4"><p>No summary data available.</p></Container>;
    
    const pieChartData = {
        labels: ['Non-Fraudulent', 'Fraudulent'],
        datasets: [
            {
                data: [summary.non_fraud_count, summary.fraud_count],
                backgroundColor: ['#4CAF50', '#F44336'],
                hoverBackgroundColor: ['#66BB6A', '#E57373']
            }
        ]
    };

    const totalLineChartData = {
        labels: timeSeriesData ? timeSeriesData.labels.map(h => `${h}:00`) : [],
        datasets: [
            {
                label: 'Total Transactions per Hour',
                data: timeSeriesData ? timeSeriesData.data : [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const fraudLineChartData = {
        labels: fraudTimeSeriesData ? fraudTimeSeriesData.labels.map(h => `${h}:00`) : [],
        datasets: [
            {
                label: 'Fraudulent Transactions per Hour',
                data: fraudTimeSeriesData ? fraudTimeSeriesData.data : [],
                fill: false,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }
        ]
    };

    const nonFraudBarChartData = {
        labels: amountDistributionData ? amountDistributionData.labels : [],
        datasets: [
            {
                label: 'Non-Fraudulent Transactions',
                data: amountDistributionData && fraudAmountDistributionData ? 
                      amountDistributionData.data.map((total, index) => total - (fraudAmountDistributionData.data[index] || 0)) : [],
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }
        ]
    };

  const fraudBarChartData = {
    labels: fraudAmountDistributionData ? fraudAmountDistributionData.labels : [],
    datasets: [
        {
            label: 'Fraudulent Transactions',
            data: fraudAmountDistributionData ? fraudAmountDistributionData.data : [],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }
    ]
  };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Fraud Detection Dashboard</h2>
            <Row>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <Card.Title>Total Transactions</Card.Title>
                            <Card.Text className="h3">
                                {summary.total_transactions}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <Card.Title>Non-Fraudulent</Card.Title>
                            <Card.Text className="h3 text-success">
                                {summary.non_fraud_count}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <Card.Title>Fraudulent</Card.Title>
                            <Card.Text className="h3 text-danger">
                                {summary.fraud_count}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center">
                                Transaction Class Distribution
                            </Card.Title>
                            <div className="chart-container-400" style={{ margin: 'auto' }}>
                                <Pie data={pieChartData} options={{ maintainAspectRatio: false }}/>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Body>
                                    <Card.Title className="text-center">Total Transactions Over Time</Card.Title>
                                    <div className="chart-container-200">
                                        <Line data={totalLineChartData} options={{ maintainAspectRatio: false }}/>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={12}>&nbsp;</Col>
                        <Col md={12}>
                            <Card>
                                <Card.Body>
                                    <Card.Title className="text-center">
                                        Fraudulent Transactions Over Time
                                    </Card.Title>
                                    <div className="chart-container-200">
                                        <Line data={fraudLineChartData} options={{ maintainAspectRatio: false }}/>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center">
                                Non-Fraudulent Transaction Amount Distribution
                            </Card.Title>
                            <div className="chart-container-400">
                                <Bar data={nonFraudBarChartData} options={{ maintainAspectRatio: false }}/>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center">
                                Fraudulent Transaction Amount Distribution
                            </Card.Title>
                            <div className="chart-container-400">
                                <Bar data={fraudBarChartData} options={{ maintainAspectRatio: false }}/>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
