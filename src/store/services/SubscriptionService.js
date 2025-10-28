import api from "../api/appApi";

class SubscriptionService {
  static async createSubscription(subscriptionData) {
    try {
      const response = await api.post('/subscription/create', subscriptionData);
      return response.data;
    } catch (error) {
      console.error("Create subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to create subscription');
      }
      throw this.handleError(error);
    }
  }

  static async getCurrentSubscription() {
    try {
      const response = await api.get('/subscription/current');
      return response.data;
    } catch (error) {
      console.error("Get current subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 404) {
        return { success: true, data: { subscription: null } };
      }
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to get current subscription');
      }
      throw this.handleError(error);
    }
  }

  static async updateSubscriptionPlan(planData) {
    try {
      const response = await api.put('/subscription/update', planData);
      return response.data;
    } catch (error) {
      console.error("Update subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to update subscription');
      }
      throw this.handleError(error);
    }
  }

  static async cancelSubscription(cancelData = {}) {
    try { 
      const response = await api.post('/subscription/cancel', cancelData);
      return response.data;
    } catch (error) {
      console.error("Cancel subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
      }
      throw this.handleError(error);
    }
  }

  static async reactivateSubscription(reactivateData = {}) {
    try {
      const response = await api.post('/subscription/reactivate', reactivateData);
      return response.data;
    } catch (error) {
      console.error("Reactivate subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to reactivate subscription');
      }
      throw this.handleError(error);
    }
  }

  static async getPaymentMethods() {
    try {
      const response = await api.get('/subscription/payment-methods');
      return response.data;
    } catch (error) {
      console.error("Get payment methods service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to get payment methods');
      }
      throw this.handleError(error);
    }
  }

  static async createSetupIntent() {
    try {
      const response = await api.post('/subscription/setup-intent');
      return response.data;
    } catch (error) {
      console.error("Create setup intent service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to create setup intent');
      }
      throw this.handleError(error);
    }
  }

  static async getInvoices(params = {}) {
    try {
      const response = await api.get('/subscription/invoices', { params });
      return response.data;
    } catch (error) {
      console.error("Get invoices service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to get invoices');
      }
      throw this.handleError(error);
    }
  }

  static async confirmSubscriptionPayment(paymentData) {
    try {
      const response = await api.post('/subscription/confirm', paymentData);
      return response.data;
    } catch (error) {
      console.error("Confirm subscription service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to confirm subscription');
      }
      throw this.handleError(error);
    }
  }

  static async getSubscriptionById(subscriptionId) {
    try {
      const response = await api.get(`subscription/id/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error("Get subscription by ID service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to get subscription');
      }
      throw this.handleError(error);
    }
  }

  static async getUserSubscriptions() {
    try {
      const response = await api.get('/get_user_subscriptions');
      return response.data;
    } catch (error) {
      console.error("Get user subscriptions service error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response) {
        throw new Error(error.response?.data?.message || 'Failed to get subscriptions');
      }
      throw this.handleError(error);
    }
  }

  // Error handling utility
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

export default SubscriptionService;