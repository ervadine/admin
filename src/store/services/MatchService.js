import api from '../api/appApi';

class MatchService {
  static async likeUser(targetUserId) {
    try {
      const response = await api.post(`/match/like/${targetUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error liking user:', error);
      throw this.handleError(error);
    }
  }

  static async unlikeUser(targetUserId) {
    try {
      const response = await api.post(`/match/unlike/${targetUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error unliking user:', error);
      throw this.handleError(error);
    }
  }

static async getStaticMatches(page = 1, limit = 20) {
  try {
    const response = await api.get('/match/statistics');
    return response.data;
  } catch (error) {
    console.error('Error getting match statistics:', error);
    throw this.handleError(error);
  }
}

  static async getLikedUsers(page = 1, limit = 20) {
    try {
      const response = await api.get('/match/liked-users', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting liked users:', error);
      throw this.handleError(error);
    }
  }

  static async getUsersToSwipe(params = {}) {
    try {
      const response = await api.get('/match/users-to-swipe', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          maxDistance: params.maxDistance,
          minDistance: params.minDistance,
          minAge: params.minAge,
          maxAge: params.maxAge,
          genders: params.genders,
          showOnlineOnly: params.showOnlineOnly,
          showVIPOnly: params.showVIPOnly
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting users to swipe:', error);
      throw this.handleError(error);
    }
  }

  static async getUsersWhoLikedMe(page = 1, limit = 20, markAsViewed = false) {
    try {
      const response = await api.get('/match/users-who-liked-me', {
        params: { page, limit, markAsViewed }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting users who liked me:', error);
      throw this.handleError(error);
    }
  }

  static async markUserAsViewed(userId) {
    try {
      const response = await api.post(`/match/mark-user-viewed/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error marking user as viewed:', error);
      throw this.handleError(error);
    }
  }


   static async checkMutualMatch(targetUserId) {
    try {
      const response = await api.get(`/match/check-mutual-match/${targetUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error check mutual match for user:', error);
      throw this.handleError(error);
    }
  }


  static async markAllLikesAsViewed() {
    try {
      const response = await api.post('/match/mark-all-viewed');
      return response.data;
    } catch (error) {
      console.error('Error marking all likes as viewed:', error);
      throw this.handleError(error);
    }
  }

  

  // Real-time like notification handler
  static handleRealTimeLikeNotification(likeData) {
    try {
      // Validate the incoming like data
      if (!likeData || !likeData.likerId) {
        throw new Error('Invalid like notification data');
      }

      console.log('Received real-time like notification:', likeData);
      return likeData;
    } catch (error) {
      console.error('Error handling real-time like notification:', error);
      throw error;
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

  // Utility method to check if error is a network error
  static isNetworkError(error) {
    return error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK';
  }

  // Utility method to check if error is an authentication error
  static isAuthError(error) {
    return error.status === 401 || error.status === 403;
  }

  // Retry mechanism for failed requests
  static async withRetry(apiCall, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on auth errors or client errors
        if (this.isAuthError(error) || (error.status >= 400 && error.status < 500)) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          console.log(`Retry attempt ${attempt}/${maxRetries} in ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
}

export default MatchService;