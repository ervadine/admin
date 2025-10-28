// src/pages/Login.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  selectAuthStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectUser,
  resetAuthError,
} from "../store/redux/authSlice";
import "./login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux selectors
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const loading = authStatus === "loading";
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (authError) {
      dispatch(resetAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();

      // Login successful - navigation will be handled by useEffect below
      console.log("Login successful:", result);
    } catch (error) {
      // Error is handled by Redux and displayed via authError
      console.error("Login failed:", error);
    }
  };

  // Redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has admin privileges
      if (user.isAdmin) {
        navigate(from, { replace: true });
      } else {
        // Regular users shouldn't access admin panel
        dispatch(resetAuthError());
        // You might want to show a different error or redirect to user dashboard
        console.log("User does not have admin privileges");
      }
    }
  }, [isAuthenticated, user, navigate, from, dispatch]);

  return (
    <div className="login-page">
      <Container fluid className="h-100">
        <Row className="h-100">
          <Col md={6} className="login-left">
            <div className="login-overlay">
              <h1>Admin Dashboard</h1>
              <p>Manage users, subscriptions, and platform analytics</p>
            </div>
          </Col>
          <Col md={6} className="login-right">
            <div className="login-form-container">
              <Card className="login-card">
                <Card.Body>
                  <div className="text-center mb-4">
                    <h2>Welcome Back</h2>
                    <p className="text-muted">Sign in to your admin account</p>
                  </div>

                  {authError && (
                    <Alert
                      variant="danger"
                      className="d-flex align-items-center"
                    >
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {authError}
                    </Alert>
                  )}

                  {isAuthenticated && user && !user.isAdmin && (
                    <Alert
                      variant="warning"
                      className="d-flex align-items-center"
                    >
                      <i className="fas fa-exclamation-circle me-2"></i>
                      You don't have admin privileges to access this panel.
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                        isInvalid={!!authError}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        isInvalid={!!authError}
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 login-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <small className="text-muted">
                      Contact system administrator for access credentials
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
