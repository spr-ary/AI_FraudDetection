import React, { useEffect, useState } from 'react';
import { Container, Table, Alert, Spinner, Form, Button, Row, Col } from 'react-bootstrap';
import { fetchTransactionList } from '../api';

const TransactionList = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalResults, setTotalResults] = useState(0);

    // State for search filters
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [transactionClass, setTransactionClass] = useState(''); // 0 for non-fraud, 1 for fraud, '' for all
    const [minTime, setMinTime] = useState('');
    const [maxTime, setMaxTime] = useState('');

    const transactionsLimit = 50; // Display first 50 rows

    const getTransactions = async (filters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTransactionList(0, transactionsLimit, filters);
            if (data && data.transactions) {
                setTransactions(data.transactions);
                setTotalResults(data.total);
            } else {
                setError("Failed to fetch transactions.");
            }
        } catch (err) {
            setError("An error occurred while fetching transactions.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load without filters
        getTransactions({});
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const filters = {
            min_amount: minAmount !== '' ? parseFloat(minAmount) : null,
            max_amount: maxAmount !== '' ? parseFloat(maxAmount) : null,
            transaction_class: transactionClass !== '' ? parseInt(transactionClass) : null,
            min_time: minTime !== '' ? parseFloat(minTime) : null,
            max_time: maxTime !== '' ? parseFloat(maxTime) : null,
        };
        getTransactions(filters);
    };

    if (loading) return 
        <Container className="mt-4 text-center">
            <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
            </Spinner>
        </Container>;

    if (error) return 
        <Container className="mt-4">
            <Alert variant="danger">{error}</Alert>
        </Container>;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Transaction List</h2>
            <Form onSubmit={handleSearch} className="mb-4 p-3 border rounded">
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="minAmount">
                            <Form.Label>Min Amount</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="maxAmount">
                            <Form.Label>Max Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="minTime">
                            <Form.Label>Min Time (seconds)</Form.Label>
                            <Form.Control
                                type="number"
                                value={minTime}
                                onChange={(e) => setMinTime(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="maxTime">
                            <Form.Label>Max Time (seconds)</Form.Label>
                            <Form.Control
                                type="number"
                                value={maxTime}
                                onChange={(e) => setMaxTime(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="transactionClass">
                            <Form.Label>Transaction Class</Form.Label>
                            <Form.Select
                                value={transactionClass}
                                onChange={(e) => setTransactionClass(e.target.value)}>
                                <option value="">All</option>
                                <option value="0">Non-Fraud</option>
                                <option value="1">Fraud</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end">
                        <Button type="submit" variant="primary" className="w-100">
                            Search
                        </Button>
                    </Col>
                </Row>
            </Form>

            {totalResults > 0 && (
                <Alert variant="info">
                    Found {totalResults} matching transactions. Displaying {Math.min(transactions.length, transactionsLimit)} results.
                </Alert>
            )}
            {transactions.length === 0 && totalResults === 0 && (
                <Alert variant="info">
                    No transactions found matching your criteria.
                </Alert>
            )}

            {transactions.length > 0 && (
                <Table striped bordered hover responsive size="sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Time</th>
                            <th>Amount</th>
                            {/* Dynamically render V features headers */}
                            {Object.keys(transactions[0]).filter(key => key.startsWith('V')).map(key => (
                                <th key={key}>{key}</th>
                            ))}
                            <th>Class</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction, index) => (
                            <tr key={index} className={transaction.Class === 1 ? 'table-danger' : ''}  >
                                <td>{index + 1}</td>
                                <td>{transaction.Time}</td>
                                <td>{transaction.Amount}</td>
                                {/* Dynamically render V features data */}
                                {Object.keys(transactions[0]).filter(key => key.startsWith('V')).map(key => (
                                    <td key={key}>{transaction[key].toFixed(2)}</td>
                                ))}
                                <td>{transaction.Class === 1 ? 'Fraud' : 'Legitimate'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default TransactionList;
