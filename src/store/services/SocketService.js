import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    this.pendingEvents = [];
    this.conversationRooms = new Set();
    this.eventCallbacks = new Map();
    this.eventListeners = new Map();
    this.typingTimeouts = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    
    // Online status tracking
    this.onlineStatusSubscriptions = new Set();
    this.userStatusCache = new Map();
    
    // Connection promise resolver
    this.connectionResolver = null;
    this.connectionRejecter = null;
    this.privacySettingsCache = null;
    
    // Typing states
    this.typingStates = new Map();
  }

  // Online Status Codes
  static get STATUS_CODES() {
    return {
      ONLINE: 'online',
      OFFLINE: 'offline',
      AWAY: 'away',
      BUSY: 'busy',
      INVISIBLE: 'invisible'
    };
  }

  /**
   * Get detailed connection status information
   * @returns {Object} Connection status object with detailed information
   */
  getConnectionStatus() {
    const baseUrl = this.getServerBaseUrlSync();
    const socketConnected = this.socket?.connected || false;
    const socketId = this.socket?.id || null;
    
    return {
      // Basic connection status
      isConnected: this.isConnected && socketConnected,
      isAuthenticated: this.isAuthenticated,
      connectionState: this.connectionState,
      
      // Socket details
      socketId: socketId,
      socketConnected: socketConnected,
      serverUrl: baseUrl,
      
      // Network status
      hasNetwork: navigator.onLine !== false, // Fallback for React Native compatibility
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      
      // Operational metrics
      pendingEvents: this.pendingEvents.length,
      conversationRooms: Array.from(this.conversationRooms),
      statusSubscriptions: Array.from(this.onlineStatusSubscriptions),
      cachedStatusCount: this.userStatusCache.size,
      activeTypingSessions: this.typingTimeouts.size,
      
      // Event listeners
      activeEventListeners: Array.from(this.eventCallbacks.entries()).reduce((acc, [event, callbacks]) => {
        acc[event] = callbacks.size;
        return acc;
      }, {}),
      
      // Timestamp
      lastUpdated: new Date().toISOString(),
      
      // Health indicators
      health: this.getConnectionHealth(),
      
      // Detailed state breakdown
      stateBreakdown: {
        socket: this.socket ? {
          connected: this.socket.connected,
          id: this.socket.id,
          disconnected: this.socket.disconnected,
          active: !!this.socket
        } : null,
        authentication: this.isAuthenticated,
        eventSystem: {
          pending: this.pendingEvents.length,
          listeners: this.eventCallbacks.size,
          subscriptions: this.onlineStatusSubscriptions.size
        },
        rooms: {
          joined: this.conversationRooms.size,
          list: Array.from(this.conversationRooms)
        }
      }
    };
  }

  /**
   * Get connection health status
   * @returns {string} Health status: 'healthy', 'degraded', 'poor', 'disconnected'
   */
  getConnectionHealth() {
    if (!this.isConnected || !this.socket?.connected) {
      return 'disconnected';
    }
    
    const pendingEvents = this.pendingEvents.length;
    const reconnectAttempts = this.reconnectAttempts;
    
    if (pendingEvents > 10 || reconnectAttempts > 5) {
      return 'poor';
    } else if (pendingEvents > 5 || reconnectAttempts > 2) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

async getServerBaseUrl() {
  // Always use production URL
  return 'https://choucoune.onrender.com';
}

getServerBaseUrlSync() {
  // Always use production URL
  return 'https://choucoune.onrender.com';
}

  reset() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
    this.connectionState = 'disconnected';
    this.eventListeners.clear();
  }

  // Initialize socket connection
  async initialize() {

    if (this.isInitialized && this.socket?.connected) {
      return true;
    }
    try {
       this.reset();
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Disconnect existing socket
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      const SERVER_URL = await this.getServerBaseUrl();
      
      console.log('Initializing socket connection to:', SERVER_URL);
      
      // Create socket connection
      this.socket = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
      });

      this.setupEventListeners();
      this.isInitialized = true;
      this.connectionState = 'connecting';
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('Socket connection timeout, allowing reconnection...');
          if (this.socket && this.socket.connected) {
            this.handleConnect();
            resolve();
          } else {
            reject(new Error('Connection timeout'));
          }
        }, 15000);

        const connectHandler = () => {
          clearTimeout(timeout);
          this.socket.off('connect_error', connectErrorHandler);
          this.handleConnect();
          resolve();
        };

        const connectErrorHandler = (error) => {
          clearTimeout(timeout);
          this.socket.off('connect', connectHandler);
          this.handleConnectError(error);
          reject(error);
        };

        this.socket.once('connect', connectHandler);
        this.socket.once('connect_error', connectErrorHandler);
      });
    } catch (error) {
      console.error('Socket initialization failed:', error);
      this.connectionState = 'error';
      throw error;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error) => this.handleConnectError(error));
    this.socket.on('error', (error) => this.handleError(error));

    // Message events
    this.socket.on('new_message', (data) => this.emitEvent('new_message', data));
    this.socket.on('messages_read', (data) => this.emitEvent('messages_read', data));
    this.socket.on('message_error', (data) => this.emitEvent('message_error', data));

    // Unread count events
    this.socket.on('unread_count_update', (data) => this.emitEvent('unread_count_update', data));
    this.socket.on('unread_counts_response', (data) => this.emitEvent('unread_counts_response', data));
    this.socket.on('unread_counts_error', (data) => this.emitEvent('unread_counts_error', data));

    // Conversation events
    this.socket.on('conversation_read', (data) => this.emitEvent('conversation_read', data));
    this.socket.on('mark_conversation_read_error', (data) => this.emitEvent('mark_conversation_read_error', data));
    this.socket.on('last_read_updated', (data) => this.emitEvent('last_read_updated', data));
    this.socket.on('update_last_read_error', (data) => this.emitEvent('update_last_read_error', data));

    // User status events
    this.socket.on('user_online', (data) => {
      this.updateUserStatusCache(data.userId, SocketService.STATUS_CODES.ONLINE);
      this.emitEvent('user_online', data);
    });
    
    this.socket.on('user_offline', (data) => {
      this.updateUserStatusCache(data.userId, SocketService.STATUS_CODES.OFFLINE);
      this.emitEvent('user_offline', data);
    });
    
    this.socket.on('user_status_change', (data) => {
      this.updateUserStatusCache(data.userId, data.status || (data.isOnline ? SocketService.STATUS_CODES.ONLINE : SocketService.STATUS_CODES.OFFLINE));
      this.emitEvent('user_status_change', data);
    });
    
    this.socket.on('online_status_response', (data) => {
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([userId, isOnline]) => {
          const status = isOnline ? SocketService.STATUS_CODES.ONLINE : SocketService.STATUS_CODES.OFFLINE;
          this.updateUserStatusCache(userId, status);
        });
      }
      this.emitEvent('online_status_response', data);
    });

    this.socket.on('online_status_error', (data) => this.emitEvent('online_status_error', data));

    // Typing events
    this.socket.on('user_typing_start', (data) => this.emitEvent('user_typing_start', data));
    this.socket.on('user_typing_stop', (data) => this.emitEvent('user_typing_stop', data));

    // Like and match events
    this.socket.on('new_like', (data) => this.emitEvent('new_like', data));
    this.socket.on('new_match', (data) => this.emitEvent('new_match', data));
    this.socket.on('like_success', (data) => this.emitEvent('like_success', data));
    this.socket.on('like_error', (data) => this.emitEvent('like_error', data));
    this.socket.on('like_removed', (data) => this.emitEvent('like_removed', data));
    this.socket.on('like_count_updated', (data) => this.emitEvent('like_count_updated', data));
    this.socket.on('unlike_success', (data) => this.emitEvent('unlike_success', data));
    this.socket.on('unlike_error', (data) => this.emitEvent('unlike_error', data));
    this.socket.on('likes_viewed', (data) => this.emitEvent('likes_viewed', data));
    this.socket.on('view_likes_error', (data) => this.emitEvent('view_likes_error', data));
    this.socket.on('like_marked_viewed', (data) => this.emitEvent('like_marked_viewed', data));
    this.socket.on('mark_like_viewed_error', (data) => this.emitEvent('mark_like_viewed_error', data));
    this.socket.on('initial_like_count', (data) => this.emitEvent('initial_like_count', data));
    this.socket.on('like_count_error', (data) => this.emitEvent('like_count_error', data));
    this.socket.on('matches_list', (data) => this.emitEvent('matches_list', data));
    this.socket.on('matches_error', (data) => this.emitEvent('matches_error', data));
    this.socket.on('likes_list', (data) => this.emitEvent('likes_list', data));
    this.socket.on('likes_list_error', (data) => this.emitEvent('likes_list_error', data));

    // Login/Logout events
    this.socket.on('connection_login', (data) => this.emitEvent('connection_login', data));

    // Privacy settings events
    this.socket.on('privacy_settings_updated', (data) => {
      console.log('Privacy settings updated:', data);
      // Update cache
      if (data && data.settings) {
        this.privacySettingsCache = data.settings;
      }
      this.emitEvent('privacy_settings_updated', data);
    });
    
    this.socket.on('user_privacy_updated', (data) => {
      console.log('User privacy updated:', data);
      this.emitEvent('user_privacy_updated', data);
    });
    
    this.socket.on('privacy_update_error', (data) => {
      console.error('Privacy update error:', data);
      this.emitEvent('privacy_update_error', data);
    });
    
    this.socket.on('privacy_settings_response', (data) => {
      console.log('Privacy settings response:', data);
      // Update cache
      if (data && data.privacySettings) {
        this.privacySettingsCache = data.privacySettings;
      }
      this.emitEvent('privacy_settings_response', data);
    });
  }

  // Connection handlers
  handleConnect() {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket connect event fired but socket is not connected');
      return;
    }

    const socketId = this.socket.id;
    console.log('Socket connected successfully:', socketId);
    
    this.isConnected = true;
    this.isAuthenticated = true;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    
    // Rejoin all conversation rooms with delay to ensure connection is ready
    setTimeout(() => {
      this.conversationRooms.forEach(conversationId => {
        this.joinConversation(conversationId);
      });
      
      // Resubscribe to status updates
      if (this.onlineStatusSubscriptions.size > 0) {
        this.subscribeToStatusUpdates(Array.from(this.onlineStatusSubscriptions));
      }
      
      this.processPendingEvents();
    }, 100);
    
    this.emitEvent('connect', { socketId });
  }

  handleDisconnect(reason) {
    console.log('Socket disconnected:', reason);
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    this.emitEvent('disconnect', { reason });
  }

  handleConnectError(error) {
    console.error('Socket connection error:', error);
    this.connectionState = 'error';
    this.emitEvent('connect_error', { error });
  }

  handleError(error) {
    console.error('Socket error:', error);
    this.emitEvent('error', { error });
  }

  // Process pending events
  processPendingEvents() {
    if (!this.isConnected || !this.socket) return;
    
    const eventsToProcess = [...this.pendingEvents];
    this.pendingEvents = [];
    
    eventsToProcess.forEach(event => {
      this.emit(event.name, event.data, event.callback);
    });
  }

  // Generic emit method
  emit(event, data, callback) {
    if (!this.socket || !this.isConnected) {
      console.log(`Queueing event ${event} for when connection is restored`);
      this.pendingEvents.push({ name: event, data, callback });
      return false;
    }

    try {
      if (!this.socket.connected) {
        console.log(`Socket not connected, queueing event ${event}`);
        this.pendingEvents.push({ name: event, data, callback });
        return false;
      }

      if (typeof callback === 'function') {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
      return false;
    }
  }

  // ========== PRIVACY SETTINGS METHODS ==========

  /**
   * Update user privacy settings (showLastActive)
   * @param {Object} settings - Privacy settings object
   * @param {boolean} settings.showLastActive - Whether to show last active status
   * @param {Function} callback - Optional callback function
   */
  updatePrivacySettings(settings, callback = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        const error = new Error('Not connected to server');
        if (callback) callback({ success: false, error: error.message });
        return reject(error);
      }

      console.log('Updating privacy settings:', settings);

      this.emit('update_privacy_settings', settings, (response) => {
        if (response && response.success) {
          console.log('Privacy settings updated successfully:', response.data);
          
          // Update cache
          if (response.data && response.data.privacySettings) {
            this.privacySettingsCache = response.data.privacySettings;
          }
          
          // Emit local event for UI updates
          this.emitEvent('privacy_settings_updated', response.data);
          
          if (callback) callback(response);
          resolve(response);
        } else {
          const error = new Error(response?.error || 'Failed to update privacy settings');
          console.error('Error updating privacy settings:', error.message);
          
          this.emitEvent('privacy_update_error', { 
            error: error.message,
            settings 
          });
          
          if (callback) callback({ success: false, error: error.message });
          reject(error);
        }
      });
    });
  }

  getPrivacySettings(callback = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        // Return cached settings if available
        if (this.privacySettingsCache) {
          const response = {
            success: true,
            data: { privacySettings: this.privacySettingsCache }
          };
          if (callback) callback(response);
          return resolve(response);
        }
        
        const error = new Error('Not connected to server');
        if (callback) callback({ success: false, error: error.message });
        return reject(error);
      }

      this.emit('get_privacy_settings', {}, (response) => {
        if (response && response.success) {
          // Update cache
          if (response.data && response.data.privacySettings) {
            this.privacySettingsCache = response.data.privacySettings;
          }
          
          if (callback) callback(response);
          resolve(response);
        } else {
          const error = new Error(response?.error || 'Failed to get privacy settings');
          if (callback) callback({ success: false, error: error.message });
          reject(error);
        }
      });
    });
  }

  async isLastActiveVisible() {
    try {
      const response = await this.getPrivacySettings();
      return response.data?.privacySettings?.showLastActive ?? true; // Default to true if not set
    } catch (error) {
      console.error('Error checking last active visibility:', error);
      return true; // Default to visible on error
    }
  }

  toggleLastActiveVisibility(show, callback = null) {
    return this.updatePrivacySettings({ showLastActive: show }, callback);
  }

  /**
   * Get cached privacy settings
   * @returns {Object|null} Cached privacy settings
   */
  getCachedPrivacySettings() {
    return this.privacySettingsCache;
  }

  clearPrivacySettingsCache() {
    this.privacySettingsCache = null;
  }

  // ========== ONLINE STATUS METHODS ==========

  /**
   * Get online status for one or multiple users
   * @param {string|string[]} userIds - Single user ID or array of user IDs
   * @param {Function} callback - Optional callback function
   */
  getOnlineStatus(userIds, callback = null) {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    
    // Check cache first for immediate response
    const cachedResults = {};
    const uncachedUserIds = [];
    
    userIdArray.forEach(userId => {
      if (this.userStatusCache.has(userId)) {
        cachedResults[userId] = this.userStatusCache.get(userId);
      } else {
        uncachedUserIds.push(userId);
      }
    });

    // Return cached results immediately if we have all data
    if (uncachedUserIds.length === 0 && typeof callback === 'function') {
      callback(cachedResults);
      return;
    }

    // Request uncached user statuses from server
    if (uncachedUserIds.length > 0) {
      this.emit('get_online_status', uncachedUserIds, (response) => {
        if (response && typeof response === 'object' && !response.error) {
          // Merge cached and fresh results
          const finalResults = { ...cachedResults, ...response };
          if (typeof callback === 'function') {
            callback(finalResults);
          }
          this.emitEvent('online_status_response', finalResults);
        } else {
          console.error('Error getting online status:', response?.error);
          if (typeof callback === 'function') {
            callback({ error: response?.error || 'Failed to get online status' });
          }
        }
      });
    } else if (typeof callback === 'function') {
      callback(cachedResults);
    }
  }

  /**
   * Subscribe to status updates for users
   * @param {string|string[]} userIds - Single user ID or array of user IDs
   */
  subscribeToStatusUpdates(userIds) {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    
    // Add to local subscriptions
    userIdArray.forEach(userId => {
      this.onlineStatusSubscriptions.add(userId);
    });

    // Send subscription to server
    this.emit('subscribe_to_status', userIdArray);
    
    console.log(`Subscribed to status updates for:`, userIdArray);
  }

  /**
   * Unsubscribe from status updates for users
   * @param {string|string[]} userIds - Single user ID or array of user IDs
   */
  unsubscribeFromStatusUpdates(userIds) {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    
    // Remove from local subscriptions
    userIdArray.forEach(userId => {
      this.onlineStatusSubscriptions.delete(userId);
    });

    // Send unsubscribe to server
    this.emit('unsubscribe_from_status', userIdArray);
    
    console.log(`Unsubscribed from status updates for:`, userIdArray);
  }

  /**
   * Manually update own online status
   * @param {boolean} isOnline - Whether the user is online
   * @param {string} status - Optional status code
   */
  updateOnlineStatus(isOnline, status = null) {
    this.emit('update_online_status', {
      isOnline,
      status: status || (isOnline ? SocketService.STATUS_CODES.ONLINE : SocketService.STATUS_CODES.OFFLINE)
    });
  }

  /**
   * Update local status cache
   * @param {string} userId 
   * @param {string} status 
   */
  updateUserStatusCache(userId, status) {
    this.userStatusCache.set(userId, status);
    
    // Set cache expiration (5 minutes)
    setTimeout(() => {
      if (this.userStatusCache.get(userId) === status) {
        this.userStatusCache.delete(userId);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get cached status for a user
   * @param {string} userId 
   * @returns {string|null} Status or null if not cached
   */
  getCachedStatus(userId) {
    return this.userStatusCache.get(userId) || null;
  }

  /**
   * Check if user is online based on cached data
   * @param {string} userId 
   * @returns {boolean}
   */
  isUserOnline(userId) {
    const status = this.getCachedStatus(userId);
    return status === SocketService.STATUS_CODES.ONLINE;
  }

  /**
   * Clear status cache
   */
  clearStatusCache() {
    this.userStatusCache.clear();
  }

  // ========== MESSAGE METHODS ==========

  async sendMessage(conversationId, content, messageType = 'text', receiverId = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to server'));
      }

      this.emit('send_message', { 
        conversationId, 
        content, 
        messageType, 
        receiverId 
      }, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  markMessagesAsRead(conversationId, messageIds = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to server'));
      }

      console.log(`Marking messages as read for conversation: ${conversationId}`, 
                  messageIds ? `message IDs: ${messageIds.length}` : 'all unread messages');

      this.emit('mark_as_read', { 
        conversationId, 
        messageIds 
      }, (response) => {
        if (response && (response.success || !response.error)) {
          resolve(response);
        } else {
          const error = response?.error || 'Failed to mark messages as read';
          console.error('Error marking messages as read:', error);
          reject(new Error(error));
        }
      });
    });
  }

  markConversationAsRead(conversationId) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to server'));
      }

      console.log(`Marking entire conversation as read: ${conversationId}`);

      this.emit('mark_conversation_read', { 
        conversationId 
      }, (response) => {
        if (response && (response.success || !response.error)) {
          resolve(response);
        } else {
          const error = response?.error || 'Failed to mark conversation as read';
          console.error('Error marking conversation as read:', error);
          reject(new Error(error));
        }
      });
    });
  }

  updateLastReadMessage(conversationId, messageId) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to server'));
      }

      console.log(`Updating last read message for conversation ${conversationId}: ${messageId}`);

      this.emit('update_last_read', { 
        conversationId,
        messageId 
      }, (response) => {
        if (response && (response.success || !response.error)) {
          resolve(response);
        } else {
          const error = response?.error || 'Failed to update last read message';
          console.error('Error updating last read message:', error);
          reject(new Error(error));
        }
      });
    });
  }

  getUnreadCounts(callback = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('Not connected to server'));
      }

      this.emit('get_unread_counts', {}, (response) => {
        if (response && !response.error) {
          if (typeof callback === 'function') {
            callback(response);
          }
          resolve(response);
        } else {
          const error = new Error(response?.error || 'Failed to get unread counts');
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          reject(error);
        }
      });
    });
  }

  // ========== TYPING METHODS ==========

  startTyping(conversationId) {
    if (!this.isConnected) return;

    // Clear existing timeout
    if (this.typingTimeouts.has(conversationId)) {
      clearTimeout(this.typingTimeouts.get(conversationId));
    }

    this.emit('typing_start', { conversationId });

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);

    this.typingTimeouts.set(conversationId, timeout);
  }

  stopTyping(conversationId) {
    if (!this.isConnected) return;

    if (this.typingTimeouts.has(conversationId)) {
      clearTimeout(this.typingTimeouts.get(conversationId));
      this.typingTimeouts.delete(conversationId);
    }

    this.emit('typing_stop', { conversationId });
  }

  // ========== CONVERSATION METHODS ==========

  joinConversation(conversationId) {
    if (!this.isConnected) return;
    
    this.conversationRooms.add(conversationId);
    this.emit('join_conversation', { conversationId });
    console.log(`Joined conversation: ${conversationId}`);
  }

  leaveConversation(conversationId) {
    this.conversationRooms.delete(conversationId);
    this.emit('leave_conversation', { conversationId });
    console.log(`Left conversation: ${conversationId}`);
  }

  // ========== LIKE & MATCH METHODS ==========

  sendLike(targetUserId) {
    return new Promise((resolve, reject) => {
      this.emit('user_like', { targetUserId }, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send like'));
        }
      });
    });
  }

  sendUnlike(targetUserId) {
    return new Promise((resolve, reject) => {
      this.emit('user_unlike', { targetUserId }, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send unlike'));
        }
      });
    });
  }

  viewLikes() {
    this.emit('view_likes');
  }

  markLikeAsViewed(matchId) {
    this.emit('mark_like_viewed', { matchId });
  }

  requestInitialLikeCount() {
    this.emit('request_initial_like_count');
  }

  subscribeToLikes() {
    this.emit('subscribe_to_likes');
  }

  unsubscribeFromLikes() {
    this.emit('unsubscribe_from_likes');
  }

  getMatches(page = 1, limit = 20) {
    this.emit('get_matches', { page, limit });
  }

  getLikes(page = 1, limit = 20) {
    this.emit('get_likes', { page, limit });
  }

  // ========== LOGIN/LOGOUT METHODS ==========

  notifyLogin(loginTime = new Date()) {
    this.emit('user_login', { 
      userId: this.getCurrentUserId(), 
      loginTime 
    });
  }

  notifyLogout() {
    this.emit('user_logout', { 
      userId: this.getCurrentUserId() 
    });
  }

  // ========== EVENT SUBSCRIPTION ==========

  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).delete(callback);
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event to subscribers
  emitEvent(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // ========== UTILITY METHODS ==========

  /** 
   * Get current user ID from storage
   * @returns {string|null}
   */
  async getCurrentUserId() {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user._id || user.id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Get connection status (legacy method - maintained for backward compatibility)
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      socketId: this.socket?.id,
      statusSubscriptions: Array.from(this.onlineStatusSubscriptions),
      cachedStatusCount: this.userStatusCache.size,
      pendingEvents: this.pendingEvents.length,
      conversationRooms: Array.from(this.conversationRooms),
      privacySettings: this.privacySettingsCache
    };
  }

  // Check if socket is really connected
  isReallyConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionState = 'disconnected';
    this.eventCallbacks.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.pendingEvents = [];
    this.conversationRooms.clear();
    this.onlineStatusSubscriptions.clear();
    this.userStatusCache.clear();
    this.privacySettingsCache = null;
  }

  // Reconnect with new token
  async reconnectWithNewToken() {
    console.log('Reconnecting with new token...');
    this.disconnect();
    await this.initialize();
    return true;
  }

  // Cleanup method for component unmounting
  cleanup() {
    this.disconnect();
    this.eventCallbacks.clear();
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;