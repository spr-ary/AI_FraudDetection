import React, { useEffect, useMemo, useState } from "react";
import {Container, Table, Alert, Spinner, Form, Button, Row, Col, ButtonGroup,} from "react-bootstrap";
import { fetchTransactionList } from "../api";

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [transactionClass, setTransactionClass] = useState(""); 
  const [minTime, setMinTime] = useState("");
  const [maxTime, setMaxTime] = useState("");

  const [page, setPage] = useState(0); 
  const [pageSize, setPageSize] = useState(50);

  // Sorting (client-side for current page)
  const [sortKey, setSortKey] = useState("Time"); 
  const [sortDir, setSortDir] = useState("desc"); 

  const buildFilters = () => ({
    min_amount: minAmount !== "" ? parseFloat(minAmount) : null,
    max_amount: maxAmount !== "" ? parseFloat(maxAmount) : null,
    transaction_class: transactionClass !== "" ? parseInt(transactionClass) : null,
    min_time: minTime !== "" ? parseFloat(minTime) : null,
    max_time: maxTime !== "" ? parseFloat(maxTime) : null,
  });

  const getTransactions = async ({ nextPage = page, nextPageSize = pageSize } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const offset = nextPage * nextPageSize;
      const data = await fetchTransactionList(offset, nextPageSize, buildFilters());
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setTotalResults(typeof data.total === "number" ? data.total : 0);
      } else {
        setError("Failed to fetch transactions.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    getTransactions({ nextPage: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vColumns = useMemo(() => {
    if (!transactions?.length) return [];
    return Object.keys(transactions[0]).filter((k) => k.startsWith("V"));
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    const arr = [...transactions];
    const dir = sortDir === "asc" ? 1 : -1;

    // Only sort keys that exist
    const safeGet = (t) => {
      if (sortKey === "Time") return Number(t.Time ?? 0);
      if (sortKey === "Amount") return Number(t.Amount ?? 0);
      if (sortKey === "Class") return Number(t.Class ?? 0);
      return 0;
    };

    arr.sort((a, b) => (safeGet(a) - safeGet(b)) * dir);
    return arr;
  }, [transactions, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    getTransactions({ nextPage: 0 });
  };

  const handleReset = () => {
    setMinAmount("");
    setMaxAmount("");
    setTransactionClass("");
    setMinTime("");
    setMaxTime("");
    setPage(0);
    setTimeout(() => getTransactions({ nextPage: 0 }), 0);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status" />
        <div className="mt-2 text-muted">Loading transactions…</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={() => getTransactions()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Transaction List</h2>
        </div>

        <div className="d-flex gap-2"></div>
      </div>

      <Form onSubmit={handleSearch} className="mb-3 p-3 border rounded bg-white">
        <Row className="g-3">
          <Col md={3}>
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

          <Col md={3}>
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

          <Col md={3}>
            <Form.Group controlId="minTime">
              <Form.Label>Min Time (sec)</Form.Label>
              <Form.Control
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group controlId="maxTime">
              <Form.Label>Max Time (sec)</Form.Label>
              <Form.Control
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group controlId="transactionClass">
              <Form.Label>Transaction Class</Form.Label>
              <Form.Select value={transactionClass} onChange={(e) => setTransactionClass(e.target.value)}>
                <option value="">All</option>
                <option value="0">Non-Fraud</option>
                <option value="1">Fraud</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group controlId="pageSize">
              <Form.Label>Rows per page</Form.Label>
              <Form.Select
                value={pageSize}
                onChange={(e) => {
                  const next = parseInt(e.target.value, 10);
                  setPageSize(next);
                  setPage(0);
                  getTransactions({ nextPage: 0, nextPageSize: next });
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4} className="d-flex align-items-end gap-2">
            <Button type="submit" variant="primary" className="flex-grow-1">
              Search
            </Button>
            <Button type="button" variant="outline-secondary" onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          {totalResults > 0 ? (
            <Alert variant="info" className="mb-0 py-2">
              Found <b>{totalResults.toLocaleString()}</b> transactions • Page{" "}
              <b>{page + 1}</b> / <b>{totalPages}</b>
            </Alert>
          ) : (
            <Alert variant="info" className="mb-0 py-2">
              No transactions found matching your criteria.
            </Alert>
          )}
        </div>

        <ButtonGroup>
          <Button
            variant="outline-primary"
            disabled={!canPrev}
            onClick={() => {
              const next = page - 1;
              setPage(next);
              getTransactions({ nextPage: next });
            }}
          >
            ← Prev
          </Button>
          <Button
            variant="outline-primary"
            disabled={!canNext}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              getTransactions({ nextPage: next });
            }}
          >
            Next →
          </Button>
        </ButtonGroup>
      </div>

      {sortedTransactions.length > 0 && (
        <div className="border rounded bg-white" style={{ overflow: "auto" }}>
          <Table hover responsive size="sm" className="mb-0">
            <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "white" }}>
              <tr>
                <th style={{ whiteSpace: "nowrap" }}>#</th>

                <th
                  style={{ whiteSpace: "nowrap", cursor: "pointer" }}
                  onClick={() => toggleSort("Time")}
                  title="Sort by Time"
                >
                  Time{sortIndicator("Time")}
                </th>

                <th
                  style={{ whiteSpace: "nowrap", cursor: "pointer" }}
                  onClick={() => toggleSort("Amount")}
                  title="Sort by Amount"
                >
                  Amount{sortIndicator("Amount")}
                </th>

                {vColumns.map((key) => (
                  <th key={key} style={{ whiteSpace: "nowrap" }}>
                    {key}
                  </th>
                ))}

                <th
                  style={{ whiteSpace: "nowrap", cursor: "pointer" }}
                  onClick={() => toggleSort("Class")}
                  title="Sort by Class"
                >
                  Class{sortIndicator("Class")}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedTransactions.map((t, idx) => (
                <tr key={idx} className={t.Class === 1 ? "table-danger" : ""}>
                  <td>{page * pageSize + idx + 1}</td>
                  <td>{t.Time}</td>
                  <td>{Number(t.Amount).toFixed(2)}</td>

                  {vColumns.map((k) => (
                    <td key={k}>
                      {typeof t[k] === "number" ? t[k].toFixed(2) : String(t[k] ?? "")}
                    </td>
                  ))}

                  <td>{t.Class === 1 ? "Fraud" : "Legitimate"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default TransactionList;
