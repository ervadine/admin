import axios from 'axios';

// Use environment variable or fallback to production URL
const API_BASE_URL = 'https://choucoune.onrender.com/api/v1';

console.log('[API] Using URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Enable if you need to handle cookies
});

// ============================
// Request Interceptor
// ============================
api.interceptors.request.use(
  (config) => {
    console.log('[API] Request →', `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request setup error:', error);
    return Promise.reject(error);
  }
);

// ============================
// Response Interceptor
// ============================
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response ✅', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('[API] Response ❌', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Handle specific error cases
    if (error.code === 'ERR_NETWORK') {
      error.message = 'Network error: Unable to connect to server. Please check your internet connection.';
    } else if (error.response?.status === 401) {
      // Auto-logout on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 500) {
      error.message = 'Server error: Please try again later.';
    }

    return Promise.reject(error);
  }
);

// ============================
// Utility Functions
// ============================

export const testConnection = async () => {
  try {
    const response = await api.get('/health', { timeout: 8000 });
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

export const testAuthEndpoint = async () => {
  try {
    const response = await api.get('/auth/profile');
    return { 
      success: true, 
      authenticated: true,
      data: response.data 
    };
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

// Auth utilities
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setUserData = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserData = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  delete api.defaults.headers.common['Authorization'];
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Initialize auth on app start
export const initializeAuth = () => {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
    return true;
  }
  return false;
};

export default api;