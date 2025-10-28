// src/pages/UsersManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectAllUsers,
  selectUsersStatus,
  selectUsersError,
  selectUsersPagination,
  allUsers,
  searchUsers,
  clearSearchResults
} from '../store/redux/authSlice';
import './UsersManagement.css';

const UsersManagement = () => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const users = useSelector(selectAllUsers);
  const usersStatus = useSelector(selectUsersStatus);
  const usersError = useSelector(selectUsersError);
  const usersPagination = useSelector(selectUsersPagination);

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const vipUsers = users.filter(user => user.isVIP === true).length;
    const activeUsers = users.filter(user => user.isActive === true).length;
    const onlineUsers = users.filter(user => user.isOnline === true).length;
    const verifiedUsers = users.filter(user => user.isEmailVerified === true).length;

    return {
      totalUsers,
      vipUsers,
      activeUsers,
      onlineUsers,
      verifiedUsers,
      engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };
  }, [users]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = user.email?.toLowerCase() || '';
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) ||
               user.name?.toLowerCase().includes(searchLower);
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'active': return user.isActive === true;
          case 'inactive': return user.isActive === false;
          case 'online': return user.isOnline === true;
          case 'verified': return user.isEmailVerified === true;
          default: return true;
        }
      });
    }

    // Subscription filter
    if (filterSubscription !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterSubscription) {
          case 'vip': return user.isVIP === true;
          case 'free': return user.isVIP === false;
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterStatus, filterSubscription, users]);

  const getStatusVariant = (user) => {
    if (!user.isActive) return 'secondary';
    if (user.isOnline) return 'success';
    return 'primary';
  };

  const getStatusText = (user) => {
    if (!user.isActive) return 'Inactive';
    if (user.isOnline) return 'Online';
    return 'Offline';
  };

  const getSubscriptionVariant = (user) => {
    return user.isVIP ? 'primary' : 'secondary';
  };

  const getSubscriptionText = (user) => {
    return user.isVIP ? 'VIP' : 'Free';
  };

  const getVerificationBadge = (user) => {
    return user.isEmailVerified ? 
      <Badge bg="success" className="ms-1">Verified</Badge> : 
      <Badge bg="warning" className="ms-1">Unverified</Badge>;
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    // Here you would typically dispatch an action to update user status
    // For now, we'll just log it since we don't have an update user action
    console.log(`Update user ${userId} status to ${newStatus}`);
    
    // If you had an updateUser action, it would look like:
    // dispatch(updateUser({ userId, updates: { isActive: newStatus === 'active' } }));
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      dispatch(searchUsers({ search: searchTerm }));
    } else {
      dispatch(allUsers({ page: 1, limit: 1000 }));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    dispatch(clearSearchResults());
    dispatch(allUsers({ page: 1, limit: 1000 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const lastActive = new Date(dateString);
    const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  useEffect(() => {
    // Fetch all users on component mount
    dispatch(allUsers({ page: 1, limit: 1000 }));
  }, [dispatch]);

  if (usersStatus === 'loading') {
    return (
      <Container fluid className="users-management-container">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading users data...</p>
        </div>
      </Container>
    );
  }

  if (usersError) {
    return (
      <Container fluid className="users-management-container">
        <div className="alert alert-danger">
          Error loading users: {usersError}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="users-management-container">
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Manage and monitor all registered users</p>
      </div>

      {/* Stats Overview */}
      <Row className="stats-overview">
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.vipUsers}</h3>
              <p>VIP Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.activeUsers}</h3>
              <p>Active Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.onlineUsers}</h3>
              <p>Online Now</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.verifiedUsers}</h3>
              <p>Verified</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.engagementRate}%</h3>
              <p>Engagement Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="filters-card">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={handleClearSearch}>
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="online">Online</option>
                <option value="verified">Verified</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="vip">VIP</option>
                <option value="free">Free</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" onClick={handleSearch}>
                <i className="fas fa-search me-2"></i>
                Search
              </Button>
            </Col>
            <Col md={2}>
              <Button variant="outline-primary" className="w-100">
                <i className="fas fa-download me-2"></i>
                Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="users-table-card">
        <Card.Body>
          <div className="table-info mb-3">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <Table responsive hover className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Join Date</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.profilePicture?.url ? (
                          <img 
                            src={user.profilePicture.url} 
                            alt={user.name || 'User'} 
                            className="avatar-img"
                          />
                        ) : (
                          <div className="avatar-fallback">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <strong>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.name || 'Unknown User'
                          }
                        </strong>
                        <small>ID: {user._id?.substring(0, 8)}...</small>
                        {getVerificationBadge(user)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{user.email}</div>
                    {user.location?.city && (
                      <small className="text-muted">{user.location.city}</small>
                    )}
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatLastActive(user.lastActive)}</td>
                  <td>
                    <Badge bg={getStatusVariant(user)}>
                      {getStatusText(user)}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getSubscriptionVariant(user)}>
                      {getSubscriptionText(user)}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleUpdateStatus(user._id, 'active')}
                        title="Activate User"
                        disabled={user.isActive}
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(user._id, 'inactive')}
                        title="Deactivate User"
                        disabled={!user.isActive}
                      >
                        <i className="fas fa-ban"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p>No users found matching your criteria</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Row>
              <Col md={4}>
                <div className="text-center">
                  <div className="user-avatar-large">
                    {selectedUser.profilePicture?.url ? (
                      <img 
                        src={selectedUser.profilePicture.url} 
                        alt={selectedUser.name || 'User'} 
                        className="avatar-img-large"
                      />
                    ) : (
                      <div className="avatar-fallback-large">
                        {selectedUser.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <h4 className="mt-3">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.name || 'Unknown User'
                    }
                  </h4>
                  <Badge bg={getStatusVariant(selectedUser)} className="me-1">
                    {getStatusText(selectedUser)}
                  </Badge>
                  <Badge bg={getSubscriptionVariant(selectedUser)} className="me-1">
                    {getSubscriptionText(selectedUser)}
                  </Badge>
                  {getVerificationBadge(selectedUser)}
                </div>
              </Col>
              <Col md={8}>
                <div className="user-details-list">
                  <div className="detail-item">
                    <strong>Email:</strong>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <strong>User ID:</strong>
                    <span className="font-monospace">{selectedUser._id}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Join Date:</strong>
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Last Active:</strong>
                    <span>{formatLastActive(selectedUser.lastActive)}</span>
                  </div>
                  {selectedUser.age && (
                    <div className="detail-item">
                      <strong>Age:</strong>
                      <span>{selectedUser.age}</span>
                    </div>
                  )}
                  {selectedUser.gender && (
                    <div className="detail-item">
                      <strong>Gender:</strong>
                      <span>{selectedUser.gender}</span>
                    </div>
                  )}
                  {selectedUser.location?.city && (
                    <div className="detail-item">
                      <strong>Location:</strong>
                      <span>
                        {[selectedUser.location.city, selectedUser.location.country]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Profile Complete:</strong>
                    <Badge bg={selectedUser.profileComplete ? 'success' : 'warning'}>
                      {selectedUser.profileComplete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {selectedUser.bio && (
                    <div className="detail-item">
                      <strong>Bio:</strong>
                      <p className="mb-0">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <i className="fas fa-edit me-2"></i>
            Edit User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UsersManagement;