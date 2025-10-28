// src/pages/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import './Dashboard.css';
import {
  selectAllUsers,
  selectAuth,
  selectUsersPagination,
  selectUsersStatus,
  selectUsersError,
  allUsers
} from '../store/redux/authSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const users = useSelector(selectAllUsers);
  const auth = useSelector(selectAuth);
  const usersStatus = useSelector(selectUsersStatus);
  const usersError = useSelector(selectUsersError);

  // Calculate statistics from real user data
  const stats = useMemo(() => {
    if (users.length === 0) {
      return {
        totalUsers: 0,
        vipUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        onlineUsers: 0
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      totalUsers: users.length,
      vipUsers: users.filter(user => user.isVIP === true).length,
      activeUsers: users.filter(user => user.isActive === true).length,
      onlineUsers: users.filter(user => user.isOnline === true).length,
      newUsersThisMonth: users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === thisMonth && userDate.getFullYear() === thisYear;
      }).length
    };
  }, [users]);

  // Recent users data - FIXED: Create a new array before sorting
  const recentUsers = useMemo(() => {
    if (users.length === 0) return [];
    
    // Create a new array before sorting to avoid mutating the original
    const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return sortedUsers.slice(0, 5).map(user => ({
      id: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown',
      email: user.email,
      joinDate: new Date(user.createdAt).toLocaleDateString(),
      status: user.isActive ? 'Active' : 'Inactive',
      subscription: user.isVIP ? 'Premium' : 'Free',
      isOnline: user.isOnline
    }));
  }, [users]);

  // User growth data (last 6 months)
  const userGrowthData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }

    return months.map(month => {
      const usersInMonth = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === month.month && 
               userDate.getFullYear() === month.year;
      });

      const vipUsersInMonth = usersInMonth.filter(user => user.isVIP);

      return {
        month: month.name,
        users: usersInMonth.length,
        vipUsers: vipUsersInMonth.length
      };
    });
  }, [users]);

  // Gender distribution for pie chart
  const genderStats = useMemo(() => {
    const genderCount = users.reduce((acc, user) => {
      const gender = user.gender || 'not-specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genderCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [users]);

  // Age distribution for additional chart
  const ageStats = useMemo(() => {
    const ageRanges = [
      { range: '18-25', min: 18, max: 25 },
      { range: '26-35', min: 26, max: 35 },
      { range: '36-45', min: 36, max: 45 },
      { range: '46-55', min: 46, max: 55 },
      { range: '56+', min: 56, max: 120 }
    ];

    return ageRanges.map(ageRange => {
      const count = users.filter(user => {
        const age = user.age;
        return age && age >= ageRange.min && age <= ageRange.max;
      }).length;

      return {
        ageRange: ageRange.range,
        count
      };
    });
  }, [users]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    // Fetch users data from Redux
    dispatch(allUsers({ page: 1, limit: 1000 }));
  }, [dispatch]);

  if (usersStatus === 'loading') {
    return (
      <Container fluid className="dashboard-container">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      </Container>
    );
  }

  if (usersError) {
    return (
      <Container fluid className="dashboard-container">
        <div className="alert alert-danger">
          Error loading dashboard data: {usersError}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Cards */}
      <Row className="stats-row">
        <Col md={3} sm={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon users">
                <i className="fas fa-users"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.totalUsers.toLocaleString()}</h3>
                <p>Total Users</p>
                <Badge bg="success">+{stats.newUsersThisMonth} this month</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon subscription">
                <i className="fas fa-crown"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.vipUsers.toLocaleString()}</h3>
                <p>VIP Users</p>
                <Badge bg="primary">
                  {stats.totalUsers > 0 ? ((stats.vipUsers / stats.totalUsers) * 100).toFixed(1) : 0}% rate
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon reports">
                <i className="fas fa-user-check"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.activeUsers}</h3>
                <p>Active Users</p>
                <Badge bg="info">{stats.onlineUsers} online now</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon revenue">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.newUsersThisMonth}</h3>
                <p>New This Month</p>
                <Badge bg="warning">
                  {stats.totalUsers > 0 ? ((stats.newUsersThisMonth / stats.totalUsers) * 100).toFixed(1) : 0}% growth
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="charts-row">
        <Col md={8}>
          <Card className="chart-card">
            <Card.Header>
              <h5>User Growth (Last 6 Months)</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#8884d8" name="Total Users" />
                  <Bar dataKey="vipUsers" fill="#82ca9d" name="VIP Users" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="chart-card">
            <Card.Header>
              <h5>Gender Distribution</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Charts Row */}
      <Row className="charts-row">
        <Col md={6}>
          <Card className="chart-card">
            <Card.Header>
              <h5>Age Distribution</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageRange" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="chart-card">
            <Card.Header>
              <h5>User Status Overview</h5>
            </Card.Header>
            <Card.Body>
              <div className="status-overview">
                <div className="status-item">
                  <Badge bg="success" className="me-2">●</Badge>
                  <span>Active Users: {stats.activeUsers}</span>
                </div>
                <div className="status-item">
                  <Badge bg="info" className="me-2">●</Badge>
                  <span>Online Now: {stats.onlineUsers}</span>
                </div>
                <div className="status-item">
                  <Badge bg="primary" className="me-2">●</Badge>
                  <span>VIP Members: {stats.vipUsers}</span>
                </div>
                <div className="status-item">
                  <Badge bg="secondary" className="me-2">●</Badge>
                  <span>New This Month: {stats.newUsersThisMonth}</span>
                </div>
                <div className="status-item">
                  <Badge bg="warning" className="me-2">●</Badge>
                  <span>
                    Profile Completion: {users.filter(u => u.profileComplete).length} / {users.length}
                  </span>
                </div>
                <div className="status-item">
                  <Badge bg="danger" className="me-2">●</Badge>
                  <span>
                    Email Verified: {users.filter(u => u.isEmailVerified).length} / {users.length}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Users Table */}
      <Row>
        <Col md={12}>
          <Card className="recent-card">
            <Card.Header>
              <h5>Recent Users</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Join Date</th>
                    <th>Status</th>
                    <th>Subscription</th>
                    <th>Online</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.joinDate}</td>
                      <td>
                        <Badge bg={user.status === 'Active' ? 'success' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.subscription === 'Premium' ? 'primary' : 'secondary'}>
                          {user.subscription}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.isOnline ? 'success' : 'secondary'}>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;