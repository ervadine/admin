import api from "../api/appApi";

class BlockService {
  static async block(userIdToBlock) {
    try {
      const response = await api.post(`/auth/block`, { userIdToBlock });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async unBlock(userIdToUnblock) {
    try {
      const response = await api.post(`/auth/unblock`, { userIdToUnblock });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async blockedUsers(page = 1, limit = 20) {
    try {
      const response = await api.get(`/auth/blocked-users`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async blockStatus(targetUserId) {
    try {
      const response = await api.get(`/auth/block-status/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return {
        message: data?.message || `Server error: ${status}`,
        code: data?.code || 'SERVER_ERROR',
        status,
        data: data?.data || null
      };
    } else if (error.request) {
      return {
        message: 'No response from server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        status: 0
      };
    }
  }

  static isNetworkError(error) {
    return error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK';
  }

  static isAuthError(error) {
    return error.status === 401 || error.status === 403;
  }

  static async withRetry(apiCall, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        if (this.isAuthError(error) || (error.status >= 400 && error.status < 500)) {
          break;
        }
        
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
}

export default BlockService;