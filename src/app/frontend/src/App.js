import React from 'react';
import './App.css';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

import Dashboard from './components/Dashboard';
import PredictionForm from './components/PredictionForm';
import TransactionList from './components/TransactionList';

function App() {
  return (
    <Router>
        <div className="App">
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={NavLink} to="/">Fraud Detection App</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={NavLink} to="/predict">Predict</Nav.Link>
                            <Nav.Link as={NavLink} to="/transactions">Transactions</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container className="mt-4">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/predict" element={<PredictionForm />} />
                    <Route path="/transactions" element={<TransactionList />} />
                </Routes>
            </Container>
        </div>
    </Router>
  );
}

export default App;
