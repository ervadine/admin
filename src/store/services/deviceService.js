import api from "../api/appApi";

class DeviceService {
  static async registerDevice(deviceData) {
    try {
      const response = await api.post('/notifications/devices/register', deviceData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async unregisterDevice(fcmToken) {
    try {
      const response = await api.post('/notifications/devices/unregister', { fcmToken });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getUserDevices() {
    try {
      const response = await api.get('/notifications/devices');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async sendTestNotification(type = 'test') {
    try {
      const response = await api.post('/notifications/test', { type });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error) {
    if (this.isNetworkError(error)) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        originalError: error
      };
    }

    if (this.isAuthError(error)) {
      return {
        message: 'Authentication failed. Please login again.',
        code: 'AUTH_ERROR',
        originalError: error
      };
    }

    // Handle specific HTTP status codes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            message: data.message || 'Bad request',
            code: 'BAD_REQUEST',
            status,
            originalError: error
          };
        case 404:
          return {
            message: data.message || 'Resource not found',
            code: 'NOT_FOUND',
            status,
            originalError: error
          };
        case 500:
          return {
            message: data.message || 'Server error. Please try again later.',
            code: 'SERVER_ERROR',
            status,
            originalError: error
          };
        default:
          return {
            message: data.message || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
            status,
            originalError: error
          };
      }
    }

    // Handle no response error
    return {
      message: 'No response from server. Please try again.',
      code: 'NO_RESPONSE',
      originalError: error
    };
  }

  static isNetworkError(error) {
    return error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' || 
           !error.response;
  }

  static isAuthError(error) {
    return error.status === 401 || 
           error.status === 403 ||
           (error.response && (error.response.status === 401 || error.response.status === 403));
  }

  static async withRetry(apiCall, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on auth errors or client errors (4xx)
        if (this.isAuthError(error) || 
            (error.response && error.response.status >= 400 && error.response.status < 500)) {
          break;
        }
        
        // Retry on server errors (5xx) and network errors
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  // Method with retry logic
  static async registerDeviceWithRetry(deviceData, maxRetries = 3) {
    return this.withRetry(() => this.registerDevice(deviceData), maxRetries);
  }

  static async unregisterDeviceWithRetry(fcmToken, maxRetries = 3) {
    return this.withRetry(() => this.unregisterDevice(fcmToken), maxRetries);
  }
}

export default DeviceService;