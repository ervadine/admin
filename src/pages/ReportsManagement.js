// src/pages/ReportsManagement.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap';
import { 
  getAllReports, 
  updateReportStatus, 
  replyToReport,
  setFilters,
  clearFilters,
  selectReports,
  selectLoading,
  selectUpdating,
  selectReplying,
  selectStatistics,
  selectFilters
} from '../store/redux/reportSlice';
import './ReportsManagement.css';

const ReportsManagement = () => {
  const dispatch = useDispatch();
  const reports = useSelector(selectReports);
  const loading = useSelector(selectLoading);
  const updating = useSelector(selectUpdating);
  const replying = useSelector(selectReplying);
  const statistics = useSelector(selectStatistics);
  const filters = useSelector(selectFilters);

  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    dispatch(getAllReports());
  }, [dispatch]);

  useEffect(() => {
    filterReports();
  }, [searchTerm, filters, reports]);

  const filterReports = () => {
    let filtered = [...reports];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => {
        const userName = report.user?.name || report.user?.username || '';
        const userEmail = report.user?.email || '';
        return (
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.problem_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter from Redux
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Apply problem type filter from Redux
    if (filters.problem_type) {
      filtered = filtered.filter(report => report.problem_type === filters.problem_type);
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleReply = (report) => {
    setSelectedReport(report);
    setReplyMessage('');
    setInternalNotes('');
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedReport) {
      alert('Please enter a reply message');
      return;
    }

    try {
      const replyData = {
        message: replyMessage,
        isInternal: false
      };

      if (internalNotes.trim()) {
        // If there are internal notes, you might want to handle them separately
        // This depends on your API structure
        console.log('Internal notes:', internalNotes);
      }

      await dispatch(replyToReport({
        reportId: selectedReport._id,
        replyData
      })).unwrap();

      setShowReplyModal(false);
      setSelectedReport(null);
      setReplyMessage('');
      setInternalNotes('');
      
      // Refresh the reports list
      dispatch(getAllReports());
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await dispatch(updateReportStatus({
        reportId,
        statusData: { status: newStatus }
      })).unwrap();
      
      // Refresh the reports list
      dispatch(getAllReports());
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleRefresh = () => {
    dispatch(getAllReports());
  };

  const problemTypes = [
    'Technical Issue',
    'Bug Report', 
    'Inappropriate Content',
    'Harassment',
    'Account Issue',
    'Payment Problem',
    'Other'
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (user) => {
    return user?.name || user?.username || 'Unknown User';
  };

  const getUserEmail = (user) => {
    return user?.email || 'No email';
  };

  if (loading && reports.length === 0) {
    return (
      <Container fluid className="reports-management-container">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading reports...</span>
          </Spinner>
          <p className="mt-2">Loading reports...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="reports-management-container">
      <div className="page-header">
        <h1>Reports Management</h1>
        <p>Monitor and respond to user reports and issues</p>
      </div>

      {/* Stats Overview */}
      <Row className="stats-overview">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{reports.length}</h3>
              <p>Total Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{reports.filter(r => r.status === 'pending').length}</h3>
              <p>Pending Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{reports.filter(r => r.priority === 'critical' || r.priority === 'high').length}</h3>
              <p>High Priority</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{statistics?.avgResponseTime || 'N/A'}</h3>
              <p>Avg. Response Time</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="filters-card">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? '' : e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.problem_type || 'all'}
                onChange={(e) => handleFilterChange('problem_type', e.target.value === 'all' ? '' : e.target.value)}
              >
                <option value="all">All Types</option>
                {problemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button 
                variant="primary" 
                className="w-100"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="fas fa-sync-alt"></i>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reports Table */}
      <Card className="reports-table-card">
        <Card.Body>
          {filteredReports.length === 0 ? (
            <div className="text-center py-4">
              <p>No reports found matching your criteria.</p>
            </div>
          ) : (
            <Table responsive hover className="reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Replies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report._id} className="report-row">
                    <td>
                      <div className="report-preview">
                        <strong>#{report._id.slice(-6)}</strong>
                        <p className="report-description">{report.description}</p>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <strong>{getUserDisplayName(report.user)}</strong>
                        <small>{getUserEmail(report.user)}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark">
                        {report.problem_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getPriorityVariant(report.priority)}>
                        {report.priority}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(report.status)}>
                        {getStatusText(report.status)}
                      </Badge>
                    </td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <span className="replies-count">
                        {report.replies?.length || 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleReply(report)}
                          disabled={replying}
                        >
                          {replying ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <>
                              <i className="fas fa-reply me-1"></i>
                              Reply
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleUpdateStatus(report._id, 'resolved')}
                          disabled={updating}
                        >
                          {updating ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="fas fa-check"></i>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Reply to Report #{selectedReport?._id?.slice(-6)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && (
            <>
              <Alert variant="info">
                <strong>User:</strong> {getUserDisplayName(selectedReport.user)} ({getUserEmail(selectedReport.user)})<br/>
                <strong>Issue:</strong> {selectedReport.problem_type}<br/>
                <strong>Description:</strong> {selectedReport.description}
              </Alert>

              {/* Previous Replies */}
              {selectedReport.replies && selectedReport.replies.length > 0 && (
                <div className="previous-replies">
                  <h6>Previous Replies:</h6>
                  {selectedReport.replies
                    .filter(reply => !reply.isInternal)
                    .map(reply => (
                      <div key={reply._id} className="reply-item">
                        <div className="reply-header">
                          <strong>{reply.repliedBy?.name || 'Admin'}</strong>
                          <small>{formatDate(reply.repliedAt)}</small>
                        </div>
                        <p className="reply-message">{reply.message}</p>
                      </div>
                    ))
                  }
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Your Reply *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response to the user..."
                  disabled={replying}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Internal Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add internal notes for your team..."
                  disabled={replying}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowReplyModal(false)}
            disabled={replying}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendReply}
            disabled={replying || !replyMessage.trim()}
          >
            {replying ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Send Reply'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReportsManagement;