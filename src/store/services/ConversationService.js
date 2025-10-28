import api from "../api/appApi";

class ConversationService {


// In your ConversationService.getUserConversations method
static async getUserConversations(page = 1, limit = 20) {
  try {
    const response = await api.get(`/conversation/all?page=${page}&limit=${limit}`);
    console.log('API Response:', response.data); // Add this line
    return response.data;
  } catch (error) { 
    throw this.handleError(error);
  }
}



  static async getConversation(conversationId) {
    try {
      const response = await api.get(`/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

// In ConversationService.js
static async createOrGetPersonalConversation(userId, matchId = null) {
  try {
    const response = await api.post('/conversation/personal', { userId, matchId });
    console.log("API Response:", response.data); // Add this line
    return response.data;
  } catch (error) {
    throw this.handleError(error);
  }
}

  static async createGroupConversation(userIds, groupName, groupDescription = null, groupPhoto = null) {
    try {
      const response = await api.post('/conversation/group', { 
        userIds, 
        groupName, 
        groupDescription, 
        groupPhoto 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async addParticipant(conversationId, userId) {
    try {
      const response = await api.post(`/conversation/${conversationId}/participants`, { userId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async removeParticipant(conversationId, userId) {
    try {
      const response = await api.delete(`/conversation/${conversationId}/participants`, { 
        data: { userId } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateGroup(conversationId, groupName, groupDescription = null, groupPhoto = null) {
    try {
      const response = await api.put(`/conversation/${conversationId}/group`, { 
        groupName, 
        groupDescription, 
        groupPhoto 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/conversation/delete/${conversationId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async markMessagesAsRead(conversationId) {
    try {
      const response = await api.post(`/conversation/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getParticipants(conversationId) {
    try {
      const response = await api.get(`/conversation/${conversationId}/participants`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async searchConversations(query) {
    try {
      const response = await api.get(`/conversation/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getUnreadCount() {
    try {
      const response = await api.get('/conversation/unread-count');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createVIPConversation(userId) {
    try {
      const response = await api.post('/conversation/vip', { userId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling utility
  static handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        message: data?.message || `Server error: ${status}`,
        code: data?.code || 'SERVER_ERROR',
        status,
        data: data?.data || null
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'No response from server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0
      };
    } else {
      // Something else happened
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

export default ConversationService;