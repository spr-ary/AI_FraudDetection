import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, ProgressBar, Badge, ListGroup } from 'react-bootstrap';
import { postPrediction } from '../api';

const PredictionForm = () => {
    const [formData, setFormData] = useState({
        // Initialize with dummy values or empty strings for all expected features
        // These should match the features your model expects, excluding 'Class'
        // For example, if your model expects V1-V28, Amount, Time:
        Time: 0,
        Amount: 0,
        V1: 0, V2: 0, V3: 0, V4: 0, V5: 0, V6: 0, V7: 0, V8: 0, V9: 0, V10: 0,
        V11: 0, V12: 0, V13: 0, V14: 0, V15: 0, V16: 0, V17: 0, V18: 0, V19: 0, V20: 0,
        V21: 0, V22: 0, V23: 0, V24: 0, V25: 0, V26: 0, V27: 0, V28: 0,
    });

    const [predictionResult, setPredictionResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: parseFloat(value) || 0 // Convert to float, default to 0 if invalid
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPredictionResult(null);

        try {
            const result = await postPrediction(formData);
            if (result) {
                setPredictionResult(result);
            } else {
                setError("Failed to get prediction.");
            }
            } catch (err) {
                setError("An error occurred during prediction.");
                console.error(err);
            } finally {
                setLoading(false);
        }
    };

    // Helper to render form controls for V features
    const renderVFeatures = () => {
        const vFeatures = [];
        for (let i = 1; i <= 28; i++) {
            const vName = `V${i}`;
            vFeatures.push(
                <Col md={3} key={vName} className="mb-3">
                    <Form.Group controlId={`form${vName}`}>
                        <Form.Label>{vName}</Form.Label>
                        <Form.Control
                            type="number"
                            step="any"
                            name={vName}
                            value={formData[vName]}
                            onChange={handleChange}
                            placeholder={`Enter ${vName}`}
                        />
                    </Form.Group>
                </Col>
            );
        }
        return vFeatures;
    };

    const getRiskVariant = (riskLevel) => {
        if (riskLevel === "High") return "danger";
        if (riskLevel === "Medium") return "warning";
        return "success";
    };

    const probPercent = predictionResult ? (predictionResult.fraud_probability * 100) : 0;
    const confPercent = predictionResult ? (predictionResult.confidence * 100) : 0;

    const topFeatures = predictionResult?.top_features || [];
    const maxScore = topFeatures.length > 0 ? Math.max(...topFeatures.map(f => f.score)) : 1;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Predict Fraud</h2>
            <Card className="p-4">
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="formTime">
                                <Form.Label>Time (seconds since first transaction)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    name="Time"
                                    value={formData.Time}
                                    onChange={handleChange}
                                    placeholder="Enter Time"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="formAmount">
                                <Form.Label>Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    name="Amount"
                                    value={formData.Amount}
                                    onChange={handleChange}
                                    placeholder="Enter Amount"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        {renderVFeatures()}
                    </Row>

                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Predicting...' : 'Predict'}
                    </Button>
                </Form>

                {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

                {predictionResult && (
                    <Card className={`mt-4 p-3 ${predictionResult.prediction === 'Fraudulent' ? 'border-danger' : 'border-success'}`}>
                        <Card.Body>
                            <Card.Title className="text-center">Prediction Result</Card.Title>

                            <div className="text-center mb-2">
                                <Badge bg={getRiskVariant(predictionResult.risk_level)} className="px-3 py-2">
                                    Risk Level: {predictionResult.risk_level}
                                </Badge>
                            </div>

                            <p className="text-center h4 mb-2">
                                Status: <span className={predictionResult.prediction === 'Fraudulent' ? 'text-danger' : 'text-success'}>
                                    {predictionResult.prediction}
                                </span>
                            </p>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between">
                                    <span>Fraud Probability</span>
                                    <strong>{probPercent.toFixed(2)}%</strong>
                                </div>
                                <ProgressBar now={probPercent} />
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between">
                                    <span>Confidence</span>
                                    <strong>{confPercent.toFixed(2)}%</strong>
                                </div>
                                <ProgressBar now={confPercent} />
                                <small className="text-muted">
                                    Confidence is higher when the probability is far from 50%.
                                </small>
                            </div>

                            <div>
                                <h5 className="mb-2">Top Contributing Features (approx.)</h5>
                                {topFeatures.length === 0 ? (
                                    <small className="text-muted">No feature explanation available.</small>
                                ) : (
                                    <ListGroup>
                                        {topFeatures.map((f) => (
                                            <ListGroup.Item key={f.feature}>
                                                <div className="d-flex justify-content-between">
                                                    <strong>{f.feature}</strong>
                                                    <span className="text-muted">value: {Number(f.value).toFixed(4)}</span>
                                                </div>
                                                <ProgressBar now={(f.score / maxScore) * 100} />
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </Card>
        </Container>
    );
}

export default PredictionForm;

