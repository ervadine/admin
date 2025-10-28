import { Platform, Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import socketService from "./SocketService";

// Enhanced notification configuration based on your app.json
const NOTIFICATION_CONFIG = {
  project: {
    id:
      Constants.expoConfig?.extra?.eas?.projectId ||
      "586d6230-102a-47da-8c29-ff9fa8a45b6b",
    name: Constants.expoConfig?.name || "Choucoune",
    version: Constants.expoConfig?.version || "1.0.0",
  },

  notification: {
    icon: require("../../assets/notification_icon.png"),
    color: "#FF4081",
    androidMode: "collapse",
    androidCollapsedTitle: "Choucoune",
    iosDisplayInForeground: true,
    sounds: ["../../assets/sounds/notification.wav"],
  },

  channels: {
    CHAT: {
      id: "choucoune-chat",
      name: "Chat Messages",
      description: "Notifications for new messages and conversations",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrate: true,
      enableLights: true,
      enableVibrate: true,
    },
    SOCIAL: {
      id: "choucoune-social",
      name: "Social Interactions",
      description: "Notifications for likes, matches and social activities",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrate: true,
      enableLights: true,
      enableVibrate: true,
    },
    SYSTEM: {
      id: "choucoune-system",
      name: "System Updates",
      description: "Important system and account notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrate: false,
      enableLights: true,
      enableVibrate: false,
    },
  },

  content: {
    sound: true,
    vibrate: true,
    priority: "high",
    autoDismiss: true,
  },

  app: {
    name: "Choucoune",
    badge: true,
    preview: true,
  },
};

class CustomNotificationService {
  constructor() {
    this.isInitialized = false;
    this.expoPushToken = null;
    this.currentUser = null;
    this.navigationRef = null;
    this.notificationListeners = new Map();
    this.pendingNotifications = new Map();
    this.notificationHistory = [];

    this.sentNotificationIds = new Set();
    this.selfNotificationBlocklist = new Set();
    this.recentlyBlockedNotifications = new Map();

    // NEW: Track registered devices
    this.registeredDevices = new Set();
    this.deviceRegistrationStatus = false;

    this.settings = {
      messages: true,
      likes: true,
      matches: true,
      sounds: NOTIFICATION_CONFIG.content.sound,
      vibrations: NOTIFICATION_CONFIG.content.vibrate,
      badge: NOTIFICATION_CONFIG.app.badge,
      preview: NOTIFICATION_CONFIG.app.preview,
    };

    this.appState = AppState.currentState;
    this.initializationPromise = null;
    this.socketEventHandlers = null;

    // Bind methods
    this.handleNotificationReceived = this.handleNotificationReceived.bind(this);
    this.handleNotificationResponse = this.handleNotificationResponse.bind(this);
    this.handleNewMessage = this.handleNewMessage.bind(this);
    this.handleMessageSent = this.handleMessageSent.bind(this);
    this.handleNewLike = this.handleNewLike.bind(this);
    this.handleNewMatch = this.handleNewMatch.bind(this);
    this.handleSocketConnected = this.handleSocketConnected.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);

    // Notification listeners
    this.notificationReceivedListener = null;
    this.notificationResponseListener = null;
  }

  // ==================== PUBLIC API ====================

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      if (this.isInitialized) {
        console.log("CustomNotificationService: Already initialized");
        return;
      }

      try {
        console.log("CustomNotificationService: Initializing Choucoune notification service...");

        await this.loadSettings();
        await this.loadCurrentUser();
        await this.loadNotificationHistory();
        await this.setupExpoNotifications();
        this.setupNotificationHandlers();
        this.setupSocketListeners();
        this.setupAppStateListener();

        // NEW: Load registered devices
        await this.loadRegisteredDevices();

        this.isInitialized = true;
        console.log("CustomNotificationService: ✅ Choucoune notification service initialized successfully");
      } catch (error) {
        console.error("CustomNotificationService: ❌ Initialization failed", error);
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  // NEW: Load registered devices from storage
  async loadRegisteredDevices() {
    try {
      const storedDevices = await AsyncStorage.getItem("choucoune_registered_devices");
      if (storedDevices) {
        const devices = JSON.parse(storedDevices);
        this.registeredDevices = new Set(devices);
        console.log("CustomNotificationService: Loaded registered devices:", this.registeredDevices.size);
      }
    } catch (error) {
      console.warn("CustomNotificationService: Error loading registered devices", error);
    }
  }

  // NEW: Save registered devices to storage
  async saveRegisteredDevices() {
    try {
      const devicesArray = Array.from(this.registeredDevices);
      await AsyncStorage.setItem("choucoune_registered_devices", JSON.stringify(devicesArray));
    } catch (error) {
      console.warn("CustomNotificationService: Error saving registered devices", error);
    }
  }

  // NEW: Register current device
  async registerCurrentDevice() {
    try {
      if (!this.expoPushToken) {
        console.warn("CustomNotificationService: No push token available for device registration");
        return false;
      }

      const deviceId = this.getDeviceIdentifier();
      this.registeredDevices.add(deviceId);
      await this.saveRegisteredDevices();
      
      this.deviceRegistrationStatus = true;
      console.log("CustomNotificationService: ✅ Device registered successfully:", deviceId);
      return true;
    } catch (error) {
      console.error("CustomNotificationService: Device registration failed", error);
      return false;
    }
  }

  // NEW: Unregister current device
  async unregisterCurrentDevice() {
    try {
      const deviceId = this.getDeviceIdentifier();
      this.registeredDevices.delete(deviceId);
      await this.saveRegisteredDevices();
      
      this.deviceRegistrationStatus = false;
      console.log("CustomNotificationService: Device unregistered:", deviceId);
      return true;
    } catch (error) {
      console.error("CustomNotificationService: Device unregistration failed", error);
      return false;
    }
  }

  // NEW: Check if current device is registered
  isDeviceRegistered() {
    const deviceId = this.getDeviceIdentifier();
    return this.registeredDevices.has(deviceId);
  }

  // NEW: Get unique device identifier
  getDeviceIdentifier() {
    // Use expo push token as device identifier
    if (this.expoPushToken) {
      return `device_${this.expoPushToken}`;
    }
    
    // Fallback to device ID + user ID combination
    const deviceId = Constants.deviceId || Device.modelName || "unknown_device";
    const userId = this.currentUser?._id || "unknown_user";
    return `device_${deviceId}_${userId}`;
  }

  // NEW: Enhanced check to verify if notification should be sent to this device
  shouldSendToThisDevice(notificationData = {}) {
    // Check if device is registered
    if (!this.isDeviceRegistered()) {
      console.log("CustomNotificationService: 🔴 Device not registered - blocking notification");
      return false;
    }

    // Check if this is a self-notification
    if (this.shouldBlockSelfNotification(notificationData.senderId || notificationData.userId)) {
      console.log("CustomNotificationService: 🔴 Self-notification blocked");
      return false;
    }

    // Check notification settings
    if (!this.isNotificationTypeEnabled(notificationData.type)) {
      console.log("CustomNotificationService: 🔴 Notification type disabled:", notificationData.type);
      return false;
    }

    return true;
  }

  // NEW: Check if specific notification type is enabled in settings
  isNotificationTypeEnabled(type) {
    switch (type) {
      case "new_message":
        return this.settings.messages;
      case "new_like":
        return this.settings.likes;
      case "new_match":
        return this.settings.matches;
      default:
        return true;
    }
  }

  // FIXED: Enhanced Expo Notifications setup with device registration
  async setupExpoNotifications() {
    try {
      console.log("CustomNotificationService: Setting up Expo notifications...");

      // Configure notification handler with proper async handling
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.settings.sounds,
          shouldSetBadge: this.settings.badge,
        }),
      });

      // Better permission handling
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("CustomNotificationService: Notification permissions not granted");
        this.deviceRegistrationStatus = false;
      } else {
        // Only get push token if permissions are granted
        this.expoPushToken = await this.registerForPushNotificationsAsync();
        
        // NEW: Automatically register device after getting push token
        if (this.expoPushToken) {
          await this.registerCurrentDevice();
        }
      }

      // Always setup channels and listeners even without push permissions
      await this.createNotificationChannels();
      this.setupNotificationListeners();

      console.log("CustomNotificationService: ✅ Expo notifications configured successfully");
    } catch (error) {
      console.error("CustomNotificationService: Expo notification setup failed", error);
    }
  }

  // FIXED: Better push notification registration
  async registerForPushNotificationsAsync() {
    try {
      if (!Device.isDevice) {
        console.warn("CustomNotificationService: Must use physical device for push notifications");
        return null;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: NOTIFICATION_CONFIG.project.id,
        })
      ).data;

      console.log("CustomNotificationService: ✅ Expo push token obtained:", token);
      return token;
    } catch (error) {
      console.error("CustomNotificationService: Error getting push token", error);
      return null;
    }
  }

  // FIXED: Enhanced socket listener setup with device verification
  setupSocketListeners() {
    if (!socketService) {
      console.warn("CustomNotificationService: socketService not available");
      setTimeout(() => this.setupSocketListeners(), 5000);
      return;
    }

    try {
      this.removeSocketListeners();

      const handlers = {
        new_message: this.handleNewMessage,
        message_notification: this.handleNewMessage,
        new_like: this.handleNewLike,
        new_match: this.handleNewMatch,
        connect: this.handleSocketConnected,
        disconnect: (reason) => {
          console.log("CustomNotificationService: Socket disconnected", reason);
        },
        message_sent: this.handleMessageSent,
        // NEW: Add device registration event
        device_registered: this.handleDeviceRegistered.bind(this),
        device_unregistered: this.handleDeviceUnregistered.bind(this),
      };

      Object.entries(handlers).forEach(([event, handler]) => {
        if (socketService.on && typeof socketService.on === "function") {
          socketService.on(event, handler);
        } else {
          console.warn(`CustomNotificationService: socketService.on not available for event ${event}`);
        }
      });

      this.socketEventHandlers = handlers;
      console.log("CustomNotificationService: Socket listeners attached successfully");
    } catch (error) {
      console.error("CustomNotificationService: setupSocketListeners error", error);
      setTimeout(() => this.setupSocketListeners(), 3000);
    }
  }

  // NEW: Handle device registration confirmation from backend
  handleDeviceRegistered = (data) => {
    console.log("CustomNotificationService: Device registration confirmed by backend", data);
    this.deviceRegistrationStatus = true;
  };

  // NEW: Handle device unregistration confirmation from backend
  handleDeviceUnregistered = (data) => {
    console.log("CustomNotificationService: Device unregistration confirmed by backend", data);
    this.deviceRegistrationStatus = false;
  };

  // FIXED: Enhanced message handler with device registration check
  handleNewMessage = async (payload) => {
    try {
      console.log("CustomNotificationService: handleNewMessage received:", payload);

      if (!payload) {
        console.warn("CustomNotificationService: Empty payload received");
        return;
      }

      // NEW: Check if device is registered before processing
      if (!this.isDeviceRegistered()) {
        console.log("CustomNotificationService: 🔴 Device not registered - ignoring message");
        return;
      }

      // Handle different payload structures
      let messageData, conversationId, senderInfo;

      if (payload.message) {
        messageData = payload.message;
        conversationId = payload.conversationId;
        senderInfo = messageData.senderId;
      } else if (payload.conversationId) {
        messageData = payload;
        conversationId = payload.conversationId;
        senderInfo = payload.senderId;
      } else {
        messageData = payload;
        conversationId = payload.conversationId || payload.conversation;
        senderInfo = payload.senderId || payload.sender;
      }

      if (!messageData) {
        console.warn("CustomNotificationService: No message data in payload");
        return;
      }

      const messageId = messageData._id || messageData.id || Date.now().toString();
      const content = messageData.content || messageData.message || messageData.text || "New message";

      // Extract sender information
      let senderId, senderName, profilePicture;

      if (typeof senderInfo === "object") {
        senderId = senderInfo._id || senderInfo.id || senderInfo.userId;
        senderName = senderInfo.name || senderInfo.username || "Someone";
        profilePicture = senderInfo.profilePicture || senderInfo.avatar;
      } else {
        senderId = senderInfo;
        senderName = "Someone";
      }

      // Validate required fields
      if (!conversationId || !senderId) {
        console.warn("CustomNotificationService: Missing required message fields", {
          conversationId,
          senderId,
          messageId,
        });
        return;
      }

      // Enhanced self-notification blocking
      if (this.shouldBlockSelfNotification(senderId)) {
        console.log("CustomNotificationService: 🔴 BLOCKED self-notification for message");
        return;
      }

      const messageType = messageData.messageType || "text";

      console.log("CustomNotificationService: Processing message notification", {
        conversationId,
        messageId,
        senderId,
        senderName,
        messageType,
        deviceRegistered: this.isDeviceRegistered(),
      });

      // Show the notification
      await this.showMessageNotification({
        conversationId,
        messageId,
        message: content,
        senderName,
        senderId,
        profilePicture,
        messageType,
        unreadCount: 1,
      });
    } catch (error) {
      console.error("CustomNotificationService: Error in handleNewMessage", error);
    }
  };

  // FIXED: Enhanced message notification with device registration check
  async showMessageNotification({
    conversationId,
    messageId,
    message,
    senderName,
    senderId,
    profilePicture,
    unreadCount = 1,
    messageType = "text",
  }) {
    try {
      // NEW: Check device registration and settings before showing notification
      if (!this.shouldSendToThisDevice({ type: "new_message", senderId })) {
        return null;
      }

      // Validate required parameters
      if (!conversationId || !messageId || !senderId) {
        console.warn("CustomNotificationService: Missing required parameters for message notification", {
          conversationId,
          messageId,
          senderId,
        });
        return null;
      }

      const notificationId = `choucoune_msg_${conversationId}_${messageId}`;

      // Check if we've already shown this notification
      if (this.sentNotificationIds.has(notificationId)) {
        console.log("CustomNotificationService: Notification already shown:", notificationId);
        return null;
      }

      this.sentNotificationIds.add(notificationId);

      // Clean up old tracking entries periodically
      if (this.sentNotificationIds.size > 1000) {
        const entries = Array.from(this.sentNotificationIds).slice(0, 500);
        entries.forEach((key) => this.sentNotificationIds.delete(key));
      }

      // Prepare notification content
      const messagePreview = this.getMessagePreview(message, messageType);
      const notificationTitle = senderName || "New Message";
      const notificationBody = messagePreview;

      console.log("CustomNotificationService: Showing message notification", {
        notificationId,
        conversationId,
        senderName,
        messagePreview,
        deviceRegistered: this.isDeviceRegistered(),
      });

      // Ensure profilePicture is a string, not an object
      let profilePictureUri = null;
      if (profilePicture) {
        if (typeof profilePicture === 'string') {
          profilePictureUri = profilePicture;
        } else if (profilePicture.uri) {
          profilePictureUri = profilePicture.uri;
        } else if (profilePicture.url) {
          profilePictureUri = profilePicture.url;
        }
      }

      const notificationData = {
        id: notificationId,
        type: "new_message",
        conversationId: String(conversationId),
        messageId: String(messageId),
        senderId: String(senderId),
        messageType,
        navigation: "Chat",
        recipient: JSON.stringify({
          _id: String(senderId),
          name: senderName,
          profilePicture: profilePictureUri,
          userName: senderName,
        }),
        timestamp: Date.now(),
        app: NOTIFICATION_CONFIG.app.name,
        projectId: NOTIFICATION_CONFIG.project.id,
        deviceId: this.getDeviceIdentifier(), // NEW: Include device ID
      };

      const notificationContent = {
        title: notificationTitle,
        body: notificationBody,
        data: notificationData,
        sound: this.settings.sounds ? "default" : null,
        priority: NOTIFICATION_CONFIG.content.priority,
        badge: this.settings.badge ? unreadCount : undefined,
        channelId: NOTIFICATION_CONFIG.channels.CHAT.id,
        autoDismiss: NOTIFICATION_CONFIG.content.autoDismiss,
      };

      // Remove undefined properties
      Object.keys(notificationContent).forEach(key => {
        if (notificationContent[key] === undefined) {
          delete notificationContent[key];
        }
      });

      try {
        // Schedule the notification
        const scheduledId = await Notifications.scheduleNotificationAsync({
          identifier: notificationId,
          content: notificationContent,
          trigger: null,
        });

        console.log("CustomNotificationService: ✅ Message notification scheduled:", scheduledId);

        // Add to history
        await this.addToHistory({
          id: notificationId,
          type: "new_message",
          title: notificationTitle,
          body: notificationBody,
          data: notificationData,
          timestamp: Date.now(),
          read: false,
        });

        return scheduledId;
      } catch (scheduleError) {
        console.error("CustomNotificationService: Failed to schedule notification, showing fallback", scheduleError);
        
        // Fallback: Show in-app notification
        return this.showInAppNotificationFallback({
          title: notificationTitle,
          body: notificationBody,
          data: notificationData,
        });
      }
    } catch (error) {
      console.error("CustomNotificationService: Failed to show message notification", error);
      return null;
    }
  }

  // FIXED: Handle socket connected with device registration
  handleSocketConnected = () => {
    console.log("CustomNotificationService: Socket connected - registering device and push token");
    this.registerDeviceWithBackend();
  };

  // NEW: Enhanced device registration with backend
  async registerDeviceWithBackend() {
    if (!this.expoPushToken || !this.currentUser) {
      console.log("CustomNotificationService: Skipping backend registration - no token or user");
      return;
    }

    try {
      // Wait a bit for socket to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (socketService?.isConnected) {
        const deviceData = {
          pushToken: this.expoPushToken,
          platform: Platform.OS,
          appVersion: "1.0.0",
          projectId: NOTIFICATION_CONFIG.project.id,
          deviceId: this.getDeviceIdentifier(),
          userId: this.currentUser._id,
          timestamp: Date.now(),
        };

        // NEW: Register device with backend
        if (socketService.registerDevice) {
          await socketService.registerDevice(deviceData);
          console.log("CustomNotificationService: ✅ Device registered via socket service");
        } else if (socketService.registerPushDevice) {
          // Fallback to existing method
          await socketService.registerPushDevice(
            this.expoPushToken,
            Platform.OS,
            "1.0.0",
            NOTIFICATION_CONFIG.project.id
          );
          console.log("CustomNotificationService: ✅ Push token registered via socket service");
        }
        
        // Update local registration status
        await this.registerCurrentDevice();
      } else {
        console.warn("CustomNotificationService: Socket not connected, cannot register device");
        await this.storeTokenForLaterRegistration();
      }
    } catch (error) {
      console.warn("CustomNotificationService: Backend registration error", error);
      await this.storeTokenForLaterRegistration();
    }
  }

  // FIXED: Enhanced notification received handler with device check
  handleNotificationReceived(notification) {
    console.log("CustomNotificationService: Notification received:", notification);

    const { request } = notification;
    const { content } = request;

    // NEW: Check if notification should be processed for this device
    if (!this.shouldSendToThisDevice(content.data)) {
      console.log("CustomNotificationService: 🔴 Notification blocked - device not registered or settings disabled");
      return;
    }

    // Handle foreground notification
    if (this.appState === "active") {
      this.handleForegroundNotification(content);
    }

    // Emit event for other components
    this.emitNotificationEvent("notificationReceived", content);
  }

  // NEW: Enhanced like notification with device check
  async showLikeNotification({ userId, userName, profilePicture, matchId }) {
    try {
      // NEW: Check device registration and settings
      if (!this.shouldSendToThisDevice({ type: "new_like", userId })) {
        return null;
      }

      const notificationId = `choucoune_like_${matchId || userId}_${Date.now()}`;
      
      const notificationData = {
        id: notificationId,
        type: "new_like",
        userId,
        userName,
        matchId,
        navigation: "ViewProfile",
        profilePicture,
        timestamp: Date.now(),
        app: NOTIFICATION_CONFIG.app.name,
        projectId: NOTIFICATION_CONFIG.project.id,
        deviceId: this.getDeviceIdentifier(), // NEW: Include device ID
      };

      const notificationContent = {
        title: "New Like! 💖",
        body: `${userName} liked your profile`,
        data: notificationData,
        sound: this.settings.sounds ? "default" : null,
        priority: "high",
        channelId: NOTIFICATION_CONFIG.channels.SOCIAL.id,
      };

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: notificationContent,
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("CustomNotificationService: Failed to show like notification", error);
      return null;
    }
  }

  // NEW: Enhanced match notification with device check
  async showMatchNotification({ userId, userName, profilePicture, matchId }) {
    try {
      // NEW: Check device registration and settings
      if (!this.shouldSendToThisDevice({ type: "new_match", userId })) {
        return null;
      }

      const notificationId = `choucoune_match_${matchId}_${Date.now()}`;
      
      const notificationData = {
        id: notificationId,
        type: "new_match",
        userId,
        userName,
        matchId,
        navigation: "ViewProfile",
        profilePicture,
        timestamp: Date.now(),
        app: NOTIFICATION_CONFIG.app.name,
        projectId: NOTIFICATION_CONFIG.project.id,
        deviceId: this.getDeviceIdentifier(), // NEW: Include device ID
      };

      const notificationContent = {
        title: "It's a Match! ✨",
        body: `You and ${userName} have matched! Start a conversation.`,
        data: notificationData,
        sound: this.settings.sounds ? "default" : null,
        priority: "high",
        channelId: NOTIFICATION_CONFIG.channels.SOCIAL.id,
      };

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: notificationContent,
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error("CustomNotificationService: Failed to show match notification", error);
      return null;
    }
  }

  // NEW: Public method to check registration status
  getRegistrationStatus() {
    return {
      isDeviceRegistered: this.isDeviceRegistered(),
      deviceId: this.getDeviceIdentifier(),
      pushToken: this.expoPushToken ? "Available" : "Not Available",
      registeredDevicesCount: this.registeredDevices.size,
      currentUser: this.currentUser ? this.currentUser._id : "Not logged in",
    };
  }

  // NEW: Manual device registration for users
  async manualDeviceRegistration() {
    try {
      if (!this.expoPushToken) {
        throw new Error("No push token available. Please ensure notification permissions are granted.");
      }

      if (!this.currentUser) {
        throw new Error("No user logged in. Please log in first.");
      }

      const success = await this.registerCurrentDevice();
      if (success) {
        await this.registerDeviceWithBackend();
        return true;
      }
      return false;
    } catch (error) {
      console.error("CustomNotificationService: Manual device registration failed", error);
      throw error;
    }
  }

  // NEW: Manual device unregistration
  async manualDeviceUnregistration() {
    try {
      const success = await this.unregisterCurrentDevice();
      
      // Notify backend about device unregistration
      if (success && socketService?.isConnected && socketService.unregisterDevice) {
        await socketService.unregisterDevice({
          deviceId: this.getDeviceIdentifier(),
          userId: this.currentUser?._id,
        });
      }
      
      return success;
    } catch (error) {
      console.error("CustomNotificationService: Manual device unregistration failed", error);
      throw error;
    }
  }

  // ==================== REMAINING METHODS (unchanged but included for completeness) ====================

  async createNotificationChannels() {
    if (Platform.OS === "android") {
      try {
        const channels = [
          {
            id: NOTIFICATION_CONFIG.channels.CHAT.id,
            name: NOTIFICATION_CONFIG.channels.CHAT.name,
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF4081",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
          },
          {
            id: NOTIFICATION_CONFIG.channels.SOCIAL.id,
            name: NOTIFICATION_CONFIG.channels.SOCIAL.name,
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF4081",
          },
          {
            id: NOTIFICATION_CONFIG.channels.SYSTEM.id,
            name: NOTIFICATION_CONFIG.channels.SYSTEM.name,
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: "default",
          },
        ];

        for (const channel of channels) {
          await Notifications.setNotificationChannelAsync(channel.id, channel);
          console.log(`✅ Created channel: ${channel.id}`);
        }
      } catch (error) {
        console.error("Channel creation error:", error);
      }
    }
  }

  setupNotificationListeners() {
    if (this.notificationReceivedListener) {
      this.notificationReceivedListener.remove();
    }
    if (this.notificationResponseListener) {
      this.notificationResponseListener.remove();
    }

    this.notificationReceivedListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );

    console.log("CustomNotificationService: ✅ Notification listeners setup");
  }

  removeSocketListeners() {
    if (!socketService || !this.socketEventHandlers) return;

    try {
      Object.entries(this.socketEventHandlers).forEach(([event, handler]) => {
        if (socketService.off && typeof socketService.off === "function") {
          socketService.off(event, handler);
        }
      });
      this.socketEventHandlers = null;
      console.log("CustomNotificationService: Socket listeners removed");
    } catch (error) {
      console.error("CustomNotificationService: removeSocketListeners error", error);
    }
  }

  shouldBlockSelfNotification(senderId) {
    if (!this.currentUser || !senderId) {
      return false;
    }

    const currentUserId = String(this.currentUser._id || this.currentUser.id);
    const incomingSenderId = String(senderId);

    const isSelf = currentUserId === incomingSenderId;

    if (isSelf) {
      console.log("CustomNotificationService: 🔴 SELF-NOTIFICATION BLOCKED", {
        currentUserId,
        incomingSenderId,
        currentUserName: this.currentUser.name,
      });
    }

    return isSelf;
  }

  getMessagePreview(message, messageType) {
    if (!message) return "New message";

    switch (messageType) {
      case "image":
        return "📷 Sent a photo";
      case "video":
        return "🎥 Sent a video";
      case "audio":
        return "🎵 Sent an audio message";
      case "call":
        return "📞 Missed call";
      default:
        return this.truncateMessage(message);
    }
  }

  truncateMessage(message = "", maxLength = 120) {
    if (typeof message !== "string") return "New message";
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  }

  handleNotificationResponse(response) {
    console.log("CustomNotificationService: Notification response:", response);

    const { notification, actionIdentifier } = response;
    const { content } = notification.request;

    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      this.handleNotificationTap(content.data);
    }
  }

  setupAppStateListener() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    console.log("CustomNotificationService: App state changed:", {
      from: this.appState,
      to: nextAppState,
    });

    this.appState = nextAppState;

    if (nextAppState === "active") {
      this.handleAppForeground();
    } else if (nextAppState.match(/inactive|background/)) {
      this.handleAppBackground();
    }
  };

  handleAppForeground() {
    console.log("CustomNotificationService: App came to foreground");
    this.setApplicationIconBadgeNumber(0);
  }

  handleAppBackground() {
    console.log("CustomNotificationService: App went to background");
  }

  buildRecipientObject(senderId, senderName, profilePicture) {
    return {
      _id: senderId,
      id: senderId,
      userId: senderId,
      name: senderName,
      username: senderName,
      userName: senderName,
      profilePicture: profilePicture,
      avatar: profilePicture,
      settings: {},
    };
  }

  showInAppNotificationFallback({ title, body, data }) {
    const notificationId = `inapp_fallback_${Date.now()}`;

    console.log("CustomNotificationService: Showing fallback in-app notification");

    const notificationData = {
      id: notificationId,
      title: title || NOTIFICATION_CONFIG.app.name,
      body: body || "New message",
      data: data || {},
      isFallback: true,
      projectId: NOTIFICATION_CONFIG.project.id,
      timestamp: Date.now(),
    };

    console.log("📱 In-app notification:", notificationData);
    this.emitNotificationEvent("showInAppNotification", notificationData);

    if (Platform.OS === "ios" || Platform.OS === "android") {
      setTimeout(() => {
        this.showEmergencyAlert(title, body);
      }, 100);
    }

    return notificationId;
  }

  showEmergencyAlert(title, message) {
    try {
      if (Alert && typeof Alert.alert === "function") {
        Alert.alert(
          title || NOTIFICATION_CONFIG.app.name,
          message || "You have a new message",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.warn("CustomNotificationService: Emergency alert failed", error);
    }
  }

  handleNotificationTap(data) {
    if (!data || data.app !== NOTIFICATION_CONFIG.app.name) return;

    if (this.shouldBlockSelfNotification(data.senderId || data.userId)) {
      console.log("CustomNotificationService: 🔴 BLOCKED self-notification navigation");
      return;
    }

    const { navigation, type, ...screenParams } = data;

    console.log("CustomNotificationService: Handling notification tap", {
      navigation,
      type,
      screenParams,
    });

    if (navigation && this.navigationRef) {
      if (navigation === "Chat" || navigation === "ChatScreen") {
        this.navigateToChatScreen(screenParams);
      } else {
        this.navigateTo(navigation, screenParams);
      }
    } else {
      console.warn("CustomNotificationService: No navigation specified or navigationRef not available");
      if (type === "new_message") {
        this.navigateToChatScreen(screenParams);
      }
    }

    this.emitNotificationEvent("notificationTapped", { type, data });
  }

  navigateToChatScreen(params = {}) {
    try {
      if (!this.navigationRef) {
        console.warn("CustomNotificationService: navigationRef not available");
        this.storePendingNavigation("Chat", params);
        return;
      }

      console.log("CustomNotificationService: Navigating to Chat screen with params:", params);

      const navParams = {};

      if (params.conversationId) {
        navParams.conversationId = params.conversationId;
      }

      if (params.recipient) {
        let recipientData;
        try {
          recipientData = typeof params.recipient === 'string' 
            ? JSON.parse(params.recipient) 
            : params.recipient;
        } catch (e) {
          recipientData = params.recipient;
        }
        navParams.recipient = recipientData;
      } else if (params.senderId) {
        navParams.recipient = this.buildRecipientObject(
          params.senderId,
          params.senderName || "User",
          params.profilePicture
        );
      }

      navParams.fromNotification = true;

      console.log("CustomNotificationService: Final navigation params:", navParams);
      this.navigationRef.navigate("Chat", navParams);

      console.log("CustomNotificationService: ✅ Successfully navigated to Chat screen");
    } catch (error) {
      console.error("CustomNotificationService: navigateToChatScreen error", error);
      this.storePendingNavigation("Chat", params);
    }
  }

  navigateTo(screenName, params = {}) {
    try {
      if (this.navigationRef && typeof this.navigationRef.navigate === 'function') {
        console.log('CustomNotificationService: Attempting navigation to', screenName, 'with params:', params);
        
        if (screenName === 'Chat' || screenName === 'ChatScreen') {
          this.navigateToChatScreen(params);
        } else {
          this.navigationRef.navigate(screenName, params);
        }
        
        console.log('CustomNotificationService: ✅ Navigation successful to', screenName);
      } else {
        console.warn('CustomNotificationService: navigationRef not available, saving pending navigation', screenName);
        this.storePendingNavigation(screenName, params);
      }
    } catch (error) {
      console.error('CustomNotificationService: navigateTo error', error);
      this.storePendingNavigation(screenName, params);
    }
  }

  async storePendingNavigation(screenName, params = {}) {
    try {
      const pending = { 
        screenName, 
        params, 
        timestamp: Date.now(),
        attemptCount: (params.attemptCount || 0) + 1
      };
      
      await AsyncStorage.setItem(
        "choucoune_pending_navigation",
        JSON.stringify(pending)
      );
      console.log("CustomNotificationService: stored pending navigation", screenName);
    } catch (error) {
      console.error("CustomNotificationService: storePendingNavigation failed", error);
    }
  }

  async checkPendingNavigation() {
    try {
      const raw = await AsyncStorage.getItem('choucoune_pending_navigation');
      if (!raw) return;

      const pending = JSON.parse(raw);
      const { screenName, params, timestamp, attemptCount = 1 } = pending;
      
      if (Date.now() - timestamp > 10 * 60 * 1000 || attemptCount > 5) {
        await AsyncStorage.removeItem('choucoune_pending_navigation');
        console.log('CustomNotificationService: Removed expired pending navigation');
        return;
      }

      await AsyncStorage.removeItem('choucoune_pending_navigation');
      console.log('CustomNotificationService: executing pending navigation to', screenName);

      if (this.navigationRef && typeof this.navigationRef.navigate === 'function') {
        setTimeout(() => {
          try {
            params.attemptCount = attemptCount;
            
            if (screenName === 'Chat' || screenName === 'ChatScreen') {
              this.navigateToChatScreen(params);
            } else {
              this.navigationRef.navigate(screenName, params);
            }
          } catch (error) {
            console.warn('CustomNotificationService: navigation attempt failed, re-storing pending nav', error);
            this.storePendingNavigation(screenName, params);
          }
        }, 1500);
      } else {
        await this.storePendingNavigation(screenName, params);
        console.warn('CustomNotificationService: navigationRef not available, stored pending navigation again');
      }
    } catch (error) {
      console.error('CustomNotificationService: checkPendingNavigation error', error);
    }
  }

  setNavigationRef(navRef) {
    this.navigationRef = navRef;
    console.log("CustomNotificationService: Navigation ref set");
    this.checkPendingNavigation();
  }

  handleMessageSent = (payload) => {
    try {
      console.log("CustomNotificationService: Message sent by current user", payload);

      if (payload?.message?._id) {
        const messageId = payload.message._id;
        const conversationId = payload.message.conversationId;

        const blockKey = `msg_${conversationId}_${messageId}`;
        this.selfNotificationBlocklist.add(blockKey);

        console.log("CustomNotificationService: Added to self-notification blocklist", blockKey);
      }
    } catch (error) {
      console.error("CustomNotificationService: Error in handleMessageSent", error);
    }
  };

  handleNewLike = async (payload) => {
    try {
      console.log("CustomNotificationService: handleNewLike received", payload);

      if (!payload || !payload.like) {
        console.warn("CustomNotificationService: Invalid like payload");
        return;
      }

      const { like } = payload;
      const { userId, userName, profilePicture, matchId } = like;

      if (this.shouldBlockSelfNotification(userId)) {
        console.log("CustomNotificationService: 🔴 BLOCKED self-like notification");
        return;
      }

      await this.showLikeNotification({
        userId,
        userName,
        profilePicture,
        matchId,
      });
    } catch (error) {
      console.error("CustomNotificationService: Error in handleNewLike", error);
    }
  };

  handleNewMatch = async (payload) => {
    try {
      console.log("CustomNotificationService: handleNewMatch received", payload);

      if (!payload || !payload.match) {
        console.warn("CustomNotificationService: Invalid match payload");
        return;
      }

      const { match } = payload;
      const { userId, userName, profilePicture, matchId } = match;

      if (this.shouldBlockSelfNotification(userId)) {
        console.log("CustomNotificationService: 🔴 BLOCKED self-match notification");
        return;
      }

      await this.showMatchNotification({
        userId,
        userName,
        profilePicture,
        matchId,
      });
    } catch (error) {
      console.error("CustomNotificationService: Error in handleNewMatch", error);
    }
  };

  showInAppNotification({ title, body, data }) {
    if (this.shouldBlockSelfNotification(data.senderId || data.userId)) {
      console.log("CustomNotificationService: 🔴 BLOCKED self-notification in app");
      return;
    }

    this.emitNotificationEvent("showInAppNotification", {
      title,
      body,
      data,
      id: `inapp_${Date.now()}`,
    });
  }

  handleForegroundNotification(content) {
    console.log("CustomNotificationService: Notification received in foreground", content);
    this.showInAppNotification({
      title: content.title,
      body: content.body,
      data: content.data,
    });
  }

  on(event, callback) {
    if (!this.notificationListeners.has(event)) {
      this.notificationListeners.set(event, new Set());
    }
    this.notificationListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.notificationListeners.has(event)) {
      this.notificationListeners.get(event).delete(callback);
    }
  }

  emitNotificationEvent(event, data) {
    if (this.notificationListeners.has(event)) {
      this.notificationListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`CustomNotificationService: Error in ${event} listener`, error);
        }
      });
    }
  }

  async updateCurrentUser(userData) {
    this.currentUser = userData;
    try {
      if (userData) {
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));
        console.log("CustomNotificationService: Updated current user", userData._id);
        if (this.expoPushToken) {
          await this.registerDeviceWithBackend();
        }
      }
    } catch (error) {
      console.warn("CustomNotificationService: Failed to update user", error);
    }
  }

  getPushToken() {
    return this.expoPushToken;
  }

  async getNotificationSettings() {
    return { ...this.settings };
  }

  async updateNotificationSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    console.log("CustomNotificationService: Notification settings updated", this.settings);
  }

  setupNotificationHandlers() {
    console.log("CustomNotificationService: Notification handlers setup completed");
  }

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem("choucoune_notification_settings");
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("CustomNotificationService: Error loading settings", error);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem(
        "choucoune_notification_settings",
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.warn("CustomNotificationService: Error saving settings", error);
    }
  }

  async loadCurrentUser() {
    try {
      const stored = await AsyncStorage.getItem("user_data");
      if (stored) {
        this.currentUser = JSON.parse(stored);
        console.log("CustomNotificationService: loaded current user", this.currentUser?._id);
      } else {
        this.currentUser = null;
      }
    } catch (error) {
      console.error("CustomNotificationService: loadCurrentUser failed", error);
      this.currentUser = null;
    }
  }

  async loadNotificationHistory() {
    try {
      const stored = await AsyncStorage.getItem("choucoune_notification_history");
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("CustomNotificationService: Error loading notification history", error);
    }
  }

  async addToHistory(notification) {
    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
    await AsyncStorage.setItem(
      "choucoune_notification_history",
      JSON.stringify(this.notificationHistory)
    );
  }

  async markAsRead(notificationId) {
    const notification = this.notificationHistory.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      await AsyncStorage.setItem(
        "choucoune_notification_history",
        JSON.stringify(this.notificationHistory)
      );
    }
  }

  async clearAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);

      this.pendingNotifications.clear();
      this.sentNotificationIds.clear();
      this.selfNotificationBlocklist.clear();
      this.recentlyBlockedNotifications.clear();
      console.log("CustomNotificationService: All notifications cleared");
    } catch (error) {
      console.error("CustomNotificationService: Error clearing notifications", error);
    }
  }

  async setApplicationIconBadgeNumber(number = 0) {
    try {
      await Notifications.setBadgeCountAsync(number);
      console.log("CustomNotificationService: set badge count to", number);
    } catch (error) {
      console.warn("CustomNotificationService: setBadgeCountAsync error", error);
    }
  }

  async cleanup() {
    try {
      this.removeSocketListeners();

      if (this.notificationReceivedListener) {
        this.notificationReceivedListener.remove();
      }
      if (this.notificationResponseListener) {
        this.notificationResponseListener.remove();
      }

      AppState.removeEventListener("change", this.handleAppStateChange);

      this.notificationListeners.clear();
      this.pendingNotifications.clear();
      this.sentNotificationIds.clear();
      this.selfNotificationBlocklist.clear();
      this.recentlyBlockedNotifications.clear();

      this.isInitialized = false;
      this.initializationPromise = null;

      console.log("CustomNotificationService: Cleanup completed");
    } catch (error) {
      console.error("CustomNotificationService: Cleanup error", error);
    }
  }

  cleanupNotificationTracking() {
    if (this.sentNotificationIds.size > 500) {
      const entries = Array.from(this.sentNotificationIds).slice(0, 100);
      entries.forEach((key) => this.sentNotificationIds.delete(key));
      console.log("CustomNotificationService: Cleaned up old sent notification tracking entries");
    }

    if (this.selfNotificationBlocklist.size > 200) {
      const entries = Array.from(this.selfNotificationBlocklist).slice(0, 50);
      entries.forEach((key) => this.selfNotificationBlocklist.delete(key));
    }

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, timestamp] of this.recentlyBlockedNotifications.entries()) {
      if (timestamp < oneHourAgo) {
        this.recentlyBlockedNotifications.delete(key);
      }
    }
  }

  async storeTokenForLaterRegistration() {
    try {
      if (!this.expoPushToken) return;

      const pendingToken = {
        token: this.expoPushToken,
        platform: Platform.OS,
        version: "1.0.0",
        projectId: NOTIFICATION_CONFIG.project.id,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        "pending_push_token",
        JSON.stringify(pendingToken)
      );
      console.log("CustomNotificationService: Token stored for later registration");
    } catch (error) {
      console.warn("CustomNotificationService: Error storing pending token", error);
    }
  }

  async testNotification() {
    try {
      console.log("CustomNotificationService: Testing notification...");

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from Choucoune!",
          data: {
            type: "test",
            app: NOTIFICATION_CONFIG.app.name,
            timestamp: Date.now(),
          },
          sound: true,
          priority: "high",
          channelId: NOTIFICATION_CONFIG.channels.SYSTEM.id,
        },
        trigger: null,
      });

      console.log("CustomNotificationService: ✅ Test notification scheduled:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("CustomNotificationService: Test notification failed:", error);
      throw error;
    }
  }

  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      expoPushToken: this.expoPushToken ? "Available" : "Not Available",
      currentUser: this.currentUser
        ? { id: this.currentUser._id, name: this.currentUser.name }
        : null,
      settings: this.settings,
      appState: this.appState,
      socketConnected: socketService?.isConnected || false,
      projectId: NOTIFICATION_CONFIG.project.id,
      notificationConfig: NOTIFICATION_CONFIG,
      navigationRefAvailable: !!this.navigationRef,
      // NEW: Include device registration status
      deviceRegistration: this.getRegistrationStatus(),
    };
  }

  getNotificationConfig() {
    return NOTIFICATION_CONFIG;
  }
}

// Create singleton instance
const customNotificationService = new CustomNotificationService();
export default customNotificationService;