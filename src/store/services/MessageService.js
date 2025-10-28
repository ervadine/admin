// services/MessageService.js
import api from "../api/appApi";

class MessageService {


static async sendTextMessage(messageData) { 
    try {
      const response = await api.post('/messages/text', messageData);
    
      return response.data;
    } catch (error) {
    
      throw error.response.data?.error?.message; 
    }
}

  static async sendMediaMessage(mediaData) {
    try {
      const response = await api.post('/messages/media', mediaData);
      return response.data;
    } catch (error) {
     throw error.response.data?.error?.message;
    }
  }

  static async getMessages(params = {}) {
    try {
      const response = await api.get('/messages/conversation', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  } 

  static async deleteSingleMessage(messageId) {
    try {
      const response = await api.delete(`/messages/single/${messageId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deleteMessages(messageIds) {
    try {
      const response = await api.delete('/messages/bulk', {
        data: { messageIds }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


// MessageService.js - Add debouncing mechanism
static markMessagesAsRead = (() => {
  let pendingRequests = new Map();
  let timeoutId = null;

  return async (conversationId, messageIds = null) => {
    try {
      const key = conversationId + (messageIds ? messageIds.join(',') : 'all');
      
      // Add to pending requests
      if (!pendingRequests.has(key)) {
        pendingRequests.set(key, { conversationId, messageIds });
      }

      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Set new timeout to batch requests
      timeoutId = setTimeout(async () => {
        const requests = Array.from(pendingRequests.values());
        pendingRequests.clear();
        
        for (const request of requests) {
          try {
            const payload = {
              conversationId: request.conversationId,
              messageIds: request.messageIds ? 
                (Array.isArray(request.messageIds) ? request.messageIds : [request.messageIds]) : 
                []
            };

            const response = await api.put('/messages/read', payload);
            return response.data;
          } catch (error) {
            console.error("Failed to mark messages as read:", error);
            // Don't throw here to prevent breaking other requests
          }
        }
      }, 300); // Batch requests every 300ms
      
    } catch (error) {
      throw this.handleError(error);
    }
  };
})();


// services/MessageService.js or similar
static async getUnreadCount() {
  try {
    const response = await api.get('/messages/unread/count');
    return response.data;
  } catch (error) { 
    throw this.handleError(error);
  }
}

  static async initiateCall(callData) {
    try {
      const response = await api.post('/messages/call/initiate', callData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateCallStatus(messageId, statusData) {
    try {
      const response = await api.put(`/messages/call/status/${messageId}`, statusData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async searchMessages(conversationId, query, params = {}) {
    try {
      const response = await api.get('/messages/search', {
        params: { conversationId, query, ...params }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getCallHistory(params = {}) {
    try {
      const response = await api.get('/messages/calls/history', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

static async getMediaMessages(params = {}) {
  try {
    const response = await api.get('/messages/media', { params });
    return response.data; // This should return {success: true, data: {...}}
  } catch (error) {
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

export default MessageService;