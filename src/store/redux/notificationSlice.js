import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import DeviceService from "../services/deviceService";
import { createSelector } from "@reduxjs/toolkit";

const handleAsyncError = (error) => {
  console.log("Full error object:", error);

  if (error.response?.data) {
    const data = error.response.data;

    if (data.message) return data.message;
    if (typeof data === "string") return data;
    if (data.error) return data.error;

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0].msg || data.errors[0].message || "Validation error";
    }
  }

  if (error.message) return error.message;
  if (typeof error === "string") return error;
  if (error.code === "NETWORK_ERROR") {
    return "Network error. Please check your internet connection.";
  }

  return "An unknown error occurred";
};

// Async thunks
export const registerDevice = createAsyncThunk(
  "notifications/registerDevice",
  async (deviceData, { rejectWithValue }) => {
    try {
      const data = await DeviceService.registerDevice(deviceData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const unregisterDevice = createAsyncThunk(
  "notifications/unregisterDevice",
  async (fcmToken, { rejectWithValue }) => {
    try {
      const data = await DeviceService.unregisterDevice(fcmToken);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getUserDevices = createAsyncThunk(
  "notifications/getUserDevices",
  async (_, { rejectWithValue }) => {
    try {
      const data = await DeviceService.getUserDevices();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
); 

export const updateNotificationSettings = createAsyncThunk(
  "notifications/updateSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const data = await DeviceService.updateNotificationSettings(settings);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const sendTestNotification = createAsyncThunk(
  "notifications/sendTest",
  async (type = 'test', { rejectWithValue }) => {
    try {
      const data = await DeviceService.sendTestNotification(type);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

const initialState = {
  // Device management
  devices: [],
  currentDevice: null,
  
  // Notification settings
  settings: {
    enabled: true,
    messages: true,
    calls: true
  },
  
  // Loading states
  loading: {
    registerDevice: false,
    unregisterDevice: false,
    getDevices: false,
    updateSettings: false,
    sendTest: false
  },
  
  // Error states
  errors: {
    registerDevice: null,
    unregisterDevice: null,
    getDevices: null,
    updateSettings: null,
    sendTest: null
  },
  
  // Success states
  success: {
    registerDevice: false,
    unregisterDevice: false,
    updateSettings: false,
    sendTest: false
  },
  
  // Notifications data
  notifications: [],
  unreadCount: 0
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Reset success states
    resetSuccessStates: (state) => {
      Object.keys(state.success).forEach(key => {
        state.success[key] = false;
      });
    },
    
    // Reset error states
    resetErrorStates: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    },
    
    // Clear specific error
    clearError: (state, action) => {
      const errorKey = action.payload;
      if (state.errors[errorKey]) {
        state.errors[errorKey] = null;
      }
    },
    
    // Add incoming notification (for real-time updates)
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    
    // Mark notification as read
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    // Mark all as read
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    // Update settings locally (for immediate UI feedback)
    updateSettingsLocal: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Set current device
    setCurrentDevice: (state, action) => {
      state.currentDevice = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register Device
      .addCase(registerDevice.pending, (state) => {
        state.loading.registerDevice = true;
        state.errors.registerDevice = null;
        state.success.registerDevice = false;
      })
      .addCase(registerDevice.fulfilled, (state, action) => {
        state.loading.registerDevice = false;
        state.success.registerDevice = true;
        state.currentDevice = action.payload.data?.deviceId;
      })
      .addCase(registerDevice.rejected, (state, action) => {
        state.loading.registerDevice = false;
        state.errors.registerDevice = action.payload;
        state.success.registerDevice = false;
      })
      
      // Unregister Device
      .addCase(unregisterDevice.pending, (state) => {
        state.loading.unregisterDevice = true;
        state.errors.unregisterDevice = null;
        state.success.unregisterDevice = false;
      })
      .addCase(unregisterDevice.fulfilled, (state) => {
        state.loading.unregisterDevice = false;
        state.success.unregisterDevice = true;
        state.currentDevice = null;
      })
      .addCase(unregisterDevice.rejected, (state, action) => {
        state.loading.unregisterDevice = false;
        state.errors.unregisterDevice = action.payload;
        state.success.unregisterDevice = false;
      })
      
      // Get User Devices
      .addCase(getUserDevices.pending, (state) => {
        state.loading.getDevices = true;
        state.errors.getDevices = null;
      })
      .addCase(getUserDevices.fulfilled, (state, action) => {
        state.loading.getDevices = false;
        state.devices = action.payload.data?.devices || [];
      })
      .addCase(getUserDevices.rejected, (state, action) => {
        state.loading.getDevices = false;
        state.errors.getDevices = action.payload;
      })
      
      // Update Notification Settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.loading.updateSettings = true;
        state.errors.updateSettings = null;
        state.success.updateSettings = false;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.loading.updateSettings = false;
        state.success.updateSettings = true;
        state.settings = action.payload.data || state.settings;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.loading.updateSettings = false;
        state.errors.updateSettings = action.payload;
        state.success.updateSettings = false;
      })
      
      // Send Test Notification
      .addCase(sendTestNotification.pending, (state) => {
        state.loading.sendTest = true;
        state.errors.sendTest = null;
        state.success.sendTest = false;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.loading.sendTest = false;
        state.success.sendTest = true;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.loading.sendTest = false;
        state.errors.sendTest = action.payload;
        state.success.sendTest = false;
      });
  },
});

// Selectors
export const selectNotificationState = (state) => state.notification;

export const selectDevices = createSelector(
  [selectNotificationState],
  (notification) => notification.devices
);

export const selectCurrentDevice = createSelector(
  [selectNotificationState],
  (notification) => notification.currentDevice
);

export const selectNotificationSettings = createSelector(
  [selectNotificationState],
  (notification) => notification.settings
);

export const selectNotifications = createSelector(
  [selectNotificationState],
  (notification) => notification.notifications
);

export const selectUnreadCount = createSelector(
  [selectNotificationState],
  (notification) => notification.unreadCount
);

export const selectLoadingStates = createSelector(
  [selectNotificationState],
  (notification) => notification.loading
);

export const selectErrorStates = createSelector(
  [selectNotificationState],
  (notification) => notification.errors
);

export const selectSuccessStates = createSelector(
  [selectNotificationState],
  (notification) => notification.success
);

export const selectIsDeviceRegistered = createSelector(
  [selectCurrentDevice],
  (currentDevice) => currentDevice !== null
);

export const {
  resetSuccessStates,
  resetErrorStates,
  clearError,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  updateSettingsLocal,
  setCurrentDevice
} = notificationSlice.actions;

export default notificationSlice.reducer;