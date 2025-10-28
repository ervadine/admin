// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button,Badge } from 'react-bootstrap';
import { Provider, useSelector, useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersManagement from './pages/UsersManagement';
import ReportsManagement from './pages/ReportsManagement';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Home from './pages/Home';
import FAQs from './pages/FAQs';
import { selectAuth, selectUser, profileUser, logout } from './store/redux/authSlice';
import { store } from './store/store';

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const user = useSelector(selectUser);
  
  // Check authentication
  if (!token && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check if user is admin
  const adminUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  if (!adminUser.isAdmin) {
    return <Navigate to="/home" />;
  }
  
  return children;
};

// Regular Protected Route Component (for non-admin pages)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  return (token || isAuthenticated) ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  return (token || isAuthenticated) ? <Navigate to="/home" /> : children;
};

// Admin Layout Component
const AdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const adminUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="app-layout">
      <Navbar bg="white" expand="lg" className="admin-navbar">
        <Container fluid>
          <Navbar.Brand href="/" className="brand">
            <i className="fas fa-chart-line me-2"></i>
            Admin Dashboard
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/dashboard">
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link href="/users">
                <i className="fas fa-users me-1"></i>
                Users
              </Nav.Link>
              <Nav.Link href="/reports">
                <i className="fas fa-flag me-1"></i>
                Reports
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Item className="user-info me-3">
                <i className="fas fa-user-circle me-1"></i>
                {adminUser.name || 'Admin User'}
                {adminUser.isAdmin && (
                  <Badge bg="primary" className="ms-2">Admin</Badge>
                )}
              </Nav.Item>
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// User Layout Component (for non-admin authenticated users)
const UserLayout = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="app-layout">
      <Navbar bg="primary" expand="lg" className="user-navbar">
        <Container fluid>
         
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/home" className="text-white">
                <i className="fas fa-home me-1"></i>
                Home
              </Nav.Link>
              <Nav.Link href="/faqs" className="text-white">
                <i className="fas fa-question-circle me-1"></i>
                FAQs
              </Nav.Link>
              <Nav.Link href="/privacy" className="text-white">
                <i className="fas fa-shield-alt me-1"></i>
                Privacy
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Item className="user-info me-3 text-white">
                <i className="fas fa-user-circle me-1"></i>
                {currentUser.name || 'User'}
              </Nav.Item>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Main App Component with Redux integration
function AppContent() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authStatus = useSelector(state => state.auth.status);

  // Initialize user data from Redux store on app load
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && !user) {
      // If we have a token but no user in Redux, fetch profile
      dispatch(profileUser());
    } else if (storedUser && !user) {
      // If we have user in localStorage but not in Redux, set it
      try {
        const userData = JSON.parse(storedUser);
        dispatch({ type: 'auth/setUser', payload: userData });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, [dispatch, user]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/faqs" element={<FAQs />} />
        
        {/* User routes (authenticated but not necessarily admin) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <UserLayout>
              <Home />
            </UserLayout>
          </ProtectedRoute>
        } />
        
        {/* Admin routes (requires admin privileges) */}
        <Route path="/dashboard" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/users" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <UsersManagement />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/reports" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <ReportsManagement />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        
      
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

// Root App Component with Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;