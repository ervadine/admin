// FirebaseNotificationService.js
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from './SocketService';

// Import your notification icon (make sure this path is correct)
const notification_icon = require('../../assets/notification_icon.png');

class FirebaseNotificationService {
  constructor() {
    this.isInitialized = false;
    this.notificationListeners = new Map();
    this.currentAppState = AppState.currentState;
    this.navigationRef = null;
  }

  /**
   * Initialize the notification service
   */
  async initialize(navigationRef) {
    if (this.isInitialized) {
      console.log('Firebase Notification Service already initialized');
      return;
    }

    this.navigationRef = navigationRef;

    try {
      // Request permissions
      await this.requestPermission();
      
      // Get FCM token
      const token = await this.getFCMToken();
      
      // Register device with your server
      if (token) {
        await this.registerDevice(token);
      }

      // Setup notification listeners
      this.setupNotificationListeners();
      
      // Setup app state listener
      this.setupAppStateListener();

      this.isInitialized = true;
      console.log('Firebase Notification Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Notification Service:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permissions granted');
        
        // Setup notification channels (Android)
        if (Platform.OS === 'android') {
          await this.setupAndroidChannels();
        }
        
        return true;
      } else {
        console.log('Notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channels
   */
  async setupAndroidChannels() {
    try {
      // Create a default channel
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        sound: 'default',
        importance: 4, // HIGH
        vibration: true,
        vibrationPattern: [300, 500],
      });

      // Create a chat channel
      const chatChannelId = await notifee.createChannel({
        id: 'chat',
        name: 'Chat Messages',
        sound: 'default',
        importance: 4, // HIGH
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
        lightColor: '#FF4081',
      });

      console.log('Android notification channels created:', { channelId, chatChannelId });
    } catch (error) {
      console.error('Error setting up Android channels:', error);
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken() {
    try {
      // Check if token already exists
      let token = await AsyncStorage.getItem('fcm_token');
      
      if (!token) {
        token = await messaging().getToken();
        if (token) {
          await AsyncStorage.setItem('fcm_token', token);
          console.log('FCM token generated and stored:', token);
        }
      } else {
        console.log('FCM token retrieved from storage:', token);
      }

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device with your server
   */
  async registerDevice(fcmToken) {
    try {
      if (!socketService.isConnected) {
        console.log('Socket not connected, queuing device registration');
        await this.queueDeviceRegistration(fcmToken);
        return;
      }

      const platform = Platform.OS;
      const appVersion = '1.0.0'; // You might want to get this from app config

      await socketService.registerPushDevice(fcmToken, platform, appVersion);
      console.log('Device registered successfully with server');
      
      // Clear any queued registration
      await AsyncStorage.removeItem('pending_device_registration');
    } catch (error) {
      console.error('Error registering device:', error);
      // Queue registration for retry
      await this.queueDeviceRegistration(fcmToken);
    }
  }

  /**
   * Queue device registration for retry
   */
  async queueDeviceRegistration(fcmToken) {
    try {
      const pendingRegistration = {
        fcmToken,
        platform: Platform.OS,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('pending_device_registration', JSON.stringify(pendingRegistration));
      console.log('Device registration queued for retry');
    } catch (error) {
      console.error('Error queuing device registration:', error);
    }
  }

  /**
   * Retry pending device registration
   */
  async retryPendingRegistration() {
    try {
      const pending = await AsyncStorage.getItem('pending_device_registration');
      if (pending && socketService.isConnected) {
        const { fcmToken, platform } = JSON.parse(pending);
        await socketService.registerPushDevice(fcmToken, platform, '1.0.0');
        await AsyncStorage.removeItem('pending_device_registration');
        console.log('Pending device registration completed');
      }
    } catch (error) {
      console.error('Error retrying pending registration:', error);
    }
  }

  /**
   * Unregister device from your server
   */
  async unregisterDevice() {
    try {
      const fcmToken = await AsyncStorage.getItem('fcm_token');
      
      if (fcmToken && socketService.isConnected) {
        await socketService.unregisterPushDevice(fcmToken);
        console.log('Device unregistered successfully from server');
      }

      // Clear local storage
      await AsyncStorage.removeItem('fcm_token');
      await AsyncStorage.removeItem('pending_device_registration');
      
      // Delete token from Firebase
      await messaging().deleteToken();
      
      console.log('Device completely unregistered');
    } catch (error) {
      console.error('Error unregistering device:', error);
      throw error;
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      await this.handleForegroundNotification(remoteMessage);
    });

    // Handle notifications when app is in background or quit
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage);
      await this.handleBackgroundNotification(remoteMessage);
    });

    // Handle notification taps
    this.notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Check if app was opened by a notification
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened by notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      }
    });

    // Listen for token refresh
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.handleTokenRefresh(token);
    });

    // Listen to notifee foreground events
    this.notifeeForegroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('Notifee foreground event:', type, detail);
      if (type === notifee.EventType.PRESS) {
        this.handleNotificationTap(detail.notification);
      }
    });

    // Listen to notifee background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('Notifee background event:', type, detail);
      if (type === notifee.EventType.PRESS) {
        this.handleNotificationTap(detail.notification);
      }
    });
  }

  /**
   * Handle foreground notifications
   */
  async handleForegroundNotification(remoteMessage) {
    const { data, notification } = remoteMessage;
    
    // Don't show notification if it's from current chat
    if (this.shouldSuppressNotification(data)) {
      console.log('Notification suppressed - user is in relevant chat');
      return;
    }

    // Display local notification
    await this.displayLocalNotification({
      title: notification?.title || data?.title,
      body: notification?.body || data?.body,
      data: data,
    });
  }

  /**
   * Handle background notifications
   */
  async handleBackgroundNotification(remoteMessage) {
    const { data, notification } = remoteMessage;
    
    // Display local notification
    await this.displayLocalNotification({
      title: notification?.title || data?.title,
      body: notification?.body || data?.body,
      data: data,
    });
  }

  /**
   * Display local notification using notifee
   */
  async displayLocalNotification({ title, body, data }) {
    try {
      // Determine channel ID based on notification type
      const channelId = data?.type === 'chat_message' ? 'chat' : 'default';

      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId,
          smallIcon: 'ic_notification', // Make sure this exists in your android resources
          largeIcon: notification_icon,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          sound: 'default',
          attachments: data?.imageUrl ? [{ url: data.imageUrl }] : undefined,
        },
      });

      console.log('Local notification displayed:', { title, body, data });
    } catch (error) {
      console.error('Error displaying local notification:', error);
    }
  }

  /**
   * Handle notification tap
   */
  handleNotificationTap(notification) {
    if (!this.navigationRef) {
      console.log('Navigation ref not available, cannot handle notification tap');
      return;
    }

    const data = notification.data || notification;
    const notificationType = data?.type;

    console.log('Handling notification tap:', { notificationType, data });

    switch (notificationType) {
      case 'chat_message':
        this.navigateToChat(data);
        break;
      
      case 'profile_view':
        this.navigateToProfile(data);
        break;
      
      case 'new_match':
      case 'new_like':
        this.navigateToMatches(data);
        break;
      
      default:
        console.log('Unknown notification type:', notificationType);
        // Default behavior - navigate to main screen
        this.navigationRef.navigate('Main');
    }
  }

  /**
   * Navigate to chat screen
   */
  navigateToChat(data) {
    try {
      const { conversationId, senderId, senderName, senderProfilePicture, isOnline } = data;
      
      if (!conversationId) {
        console.error('No conversationId in notification data');
        return;
      }

      this.navigationRef.navigate('Chat', {
        conversationId: conversationId,
        recipient: {
          _id: senderId,
          name: senderName,
          profilePicture: senderProfilePicture,
          userName: senderName, // Fallback to name if userName not provided
          lastActive: new Date().toISOString(), // You might want to get this from your data
          isOnline: isOnline === 'true' || isOnline === true,
        }
      });

      console.log('Navigated to chat screen:', conversationId);
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  }

  /**
   * Navigate to profile screen
   */
  navigateToProfile(data) {
    try {
      const { userId } = data;
      
      if (!userId) {
        console.error('No userId in notification data');
        return;
      }

      this.navigationRef.navigate('ViewProfile', { userId });
      console.log('Navigated to profile screen:', userId);
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  }

  /**
   * Navigate to matches screen
   */
  navigateToMatches(data) {
    try {
      this.navigationRef.navigate('Matches');
      console.log('Navigated to matches screen');
    } catch (error) {
      console.error('Error navigating to matches:', error);
    }
  }

  /**
   * Check if notification should be suppressed
   */
  shouldSuppressNotification(data) {
    // Implement logic to check if user is currently in the relevant chat
    // For example, check if current screen is the chat screen and conversationId matches
    const currentRoute = this.navigationRef?.getCurrentRoute();
    const isInChat = currentRoute?.name === 'Chat';
    
    if (isInChat && data?.conversationId) {
      const currentConversationId = currentRoute?.params?.conversationId;
      return currentConversationId === data.conversationId;
    }
    
    return false;
  }

  /**
   * Handle token refresh
   */
  async handleTokenRefresh(token) {
    try {
      // Update local storage
      await AsyncStorage.setItem('fcm_token', token);
      
      // Re-register with server
      await this.registerDevice(token);
      
      console.log('Token refresh handled successfully');
    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  }

  /**
   * Setup app state listener
   */
  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (this.currentAppState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        this.onAppForeground();
      } else if (nextAppState.match(/inactive|background/) && this.currentAppState === 'active') {
        // App went to background
        this.onAppBackground();
      }
      
      this.currentAppState = nextAppState;
    });
  }

  /**
   * Handle app coming to foreground
   */
  onAppForeground() {
    console.log('App came to foreground');
    // Retry any pending device registrations
    this.retryPendingRegistration();
  }

  /**
   * Handle app going to background
   */
  onAppBackground() {
    console.log('App went to background');
    // Clean up or save state if needed
  }

  /**
   * Add custom notification listener
   */
  addNotificationListener(type, callback) {
    this.notificationListeners.set(type, callback);
  }

  /**
   * Remove notification listener
   */
  removeNotificationListener(type) {
    this.notificationListeners.delete(type);
  }

  /**
   * Get current FCM token
   */
  async getCurrentToken() {
    return await AsyncStorage.getItem('fcm_token');
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled() {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Open app notification settings
   */
  async openNotificationSettings() {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Cleanup and remove all listeners
   */
  cleanup() {
    if (this.foregroundUnsubscribe) {
      this.foregroundUnsubscribe();
    }
    
    if (this.notificationOpenedUnsubscribe) {
      this.notificationOpenedUnsubscribe();
    }
    
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
    }
    
    if (this.notifeeForegroundUnsubscribe) {
      this.notifeeForegroundUnsubscribe();
    }

    this.notificationListeners.clear();
    this.isInitialized = false;
    this.navigationRef = null;
    
    console.log('Firebase Notification Service cleaned up');
  }
}

// Create singleton instance
const firebaseNotificationService = new FirebaseNotificationService();

export default firebaseNotificationService;