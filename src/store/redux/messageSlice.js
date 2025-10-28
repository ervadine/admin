// redux/slices/messageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import MessageService from "../services/MessageService";
import { handleAsyncError } from "../../utils/handleError";

const EMPTY_ARRAY = [];
const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
  hasNext: false,
  hasPrev: false,
}; 

export const sendTextMessage = createAsyncThunk(
  "message/sendTextMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await MessageService.sendTextMessage(messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const sendMediaMessage = createAsyncThunk(
  "message/sendMediaMessage",
  async (mediaData, { rejectWithValue }) => {
    try {
      const response = await MessageService.sendMediaMessage(mediaData);
      return response.data;
    } catch (error) {
     return rejectWithValue(error);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "message/fetchMessages",
  async (
    { conversationId, page = 1, limit = 50, before = null },
    { rejectWithValue }
  ) => {
    try {
      const params = { conversationId, page, limit };
      if (before) params.before = before;

      const response = await MessageService.getMessages(params);
      return { ...response.data, isNewPage: page === 1 };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteSingleMessage = createAsyncThunk(
  "message/deleteSingleMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await MessageService.deleteSingleMessage(messageId);
      return { messageId, response: response.data };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteMessages = createAsyncThunk(
  "message/deleteMessages",
  async (messageIds, { rejectWithValue }) => {
    try {
      const response = await MessageService.deleteMessages(messageIds);
      return { messageIds, response: response.data };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "message/markMessagesAsRead",
  async ({ conversationId, messageIds = null }, { rejectWithValue }) => {
    try {
      const response = await MessageService.markMessagesAsRead(
        conversationId,
        messageIds
      );
      return {
        ...response.data,
        conversationId,
        messageIds: messageIds || [],
      };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "message/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MessageService.getUnreadCount();
      return response.data; // This should match the controller response structure
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
); 

export const initiateCall = createAsyncThunk(
  "message/initiateCall",
  async (callData, { rejectWithValue }) => {
    try {
      console.log('📞 initiateCall thunk called with:', callData);
      
      // Validate required fields
      if (!callData.receiverId) {
        throw new Error('receiverId is required');
      }
      
      const response = await MessageService.initiateCall(callData);
      console.log('✅ initiateCall API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ initiateCall thunk error:', error);
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCallStatus = createAsyncThunk(
  "message/updateCallStatus",
  async ({ messageId, status, duration }, { rejectWithValue }) => {
    try {
      const response = await MessageService.updateCallStatus(messageId, {
        status,
        duration,
      });
      return response.data;
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const searchMessages = createAsyncThunk(
  "message/searchMessages",
  async (
    { conversationId, query, page = 1, limit = 20 },
    { rejectWithValue }
  ) => {
    try {
      const response = await MessageService.searchMessages(
        conversationId,
        query,
        { page, limit }
      );
      return { ...response.data, query, conversationId };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchCallHistory = createAsyncThunk(
  "message/fetchCallHistory",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await MessageService.getCallHistory({ page, limit });
      return response.data;
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMediaMessages = createAsyncThunk(
  "message/fetchMediaMessages",
  async (
    { conversationId, page = 1, limit = 20 }, // Remove mediaType parameter
    { rejectWithValue }
  ) => {
    try {
      const params = { conversationId, page, limit };

      const response = await MessageService.getMediaMessages(params);
      
      // Extract data from the nested structure
      const { mediaMessages, totalPages, currentPage, total } = response.data;
      
      return { 
        mediaMessages, 
        totalPages, 
        currentPage, 
        total,
        conversationId,
      };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateMessagesReadStatus = createAsyncThunk(
  'message/updateMessagesReadStatus', 
  async (payload, { rejectWithValue }) => {
    try {
      // This is typically where you'd make an API call
      // For now, we'll just return the payload to update the state
      return {
        messageIds: Array.isArray(payload.messageIds) ? payload.messageIds : [payload.messageIds],
        conversationId: payload.conversationId,
        readBy: payload.readBy,
        readAt: payload.readAt || new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = handleAsyncError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  messages: {},
   currentUserId: null,
  conversations: {},
  currentConversation: null,
  unreadCount: 0,
  callHistory: {
    data: EMPTY_ARRAY,
    pagination: EMPTY_PAGINATION,
  },
  mediaMessages: {
    data: EMPTY_ARRAY,
    pagination: EMPTY_PAGINATION,
  },
  searchResults: {
    data: EMPTY_ARRAY,
    pagination: EMPTY_PAGINATION,
    query: "",
  },
  loading: {
    sendMessage: false,
    fetchMessages: false,
    deleteMessage: false,
    markAsRead: false,
    fetchUnreadCount: false,
    initiateCall: false,
    updateCallStatus: false,
    searchMessages: false,
    fetchCallHistory: false,
    fetchMediaMessages: false,
  },
  errors: {
    sendMessage: null,
    fetchMessages: null,
    deleteMessage: null,
    markAsRead: null,
    fetchUnreadCount: null,
    initiateCall: null,
    updateCallStatus: null,
    searchMessages: null,
    fetchCallHistory: null,
    fetchMediaMessages: null,
  },
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.messages = {};
      state.conversations = {};
      state.currentConversation = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = {
        data: EMPTY_ARRAY,
        pagination: EMPTY_PAGINATION,
        query: "",
      };
    },
    clearErrors: (state) => {
      state.errors = {
        sendMessage: null,
        fetchMessages: null,
        deleteMessage: null,
        markAsRead: null,
        fetchUnreadCount: null,
        initiateCall: null,
        updateCallStatus: null,
        searchMessages: null,
        fetchCallHistory: null,
        fetchMediaMessages: null,
      };
    },
  // In your messageSlice.js
addMessageToConversation: (state, action) => {
  const { conversationId, message } = action.payload;
  
  if (!state.messages[conversationId]) {
    state.messages[conversationId] = [];
  }

  // FIXED: Safe message ID check
  const messageId = message._id || message.tempId;
  if (!messageId) {
    console.error('❌ Message missing ID, cannot add to store:', message);
    return;
  }

  // Check if message already exists
  const existingIndex = state.messages[conversationId].findIndex(
    (msg) => (msg._id === messageId) || (msg.tempId === messageId)
  );

  if (existingIndex === -1) {
    state.messages[conversationId].push(message);
  } else {
    // Update existing message (replace temp with real)
    state.messages[conversationId][existingIndex] = message;
  }
},
    updateMessageStatus: (state, action) => {
      const { conversationId, messageId, updates } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        const messageIndex = messages.findIndex((msg) => msg._id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates };
        }
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    incrementUnreadCount: (state,action) => {
        const count = action.payload || 1;
      state.unreadCount+=count;
    },
    decrementUnreadCount: (state, action) => {
      const count = action.payload || 1;
      state.unreadCount = Math.max(0, state.unreadCount - count);
    },
    resetMessageState: () => initialState,
    
  },
  extraReducers: (builder) => {
    builder
      // Send Text Message
      .addCase(sendTextMessage.pending, (state) => {
        state.loading.sendMessage = true;
        state.errors.sendMessage = null;
      })
      .addCase(sendTextMessage.fulfilled, (state, action) => {
        state.loading.sendMessage = false;
        const { conversationId, message } = action.payload;

        if (!conversationId || !message) {
          console.warn("Invalid message data received:", action.payload);
          return;
        }

        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }

        // Check if message already exists to avoid duplicates
        const messageExists = state.messages[conversationId].some(
          (msg) => msg._id === message._id
        );

        if (!messageExists) {
          state.messages[conversationId].push(message);
        }
      })
      .addCase(sendTextMessage.rejected, (state, action) => {
        state.loading.sendMessage = false;
        state.errors.sendMessage = action.payload;
      })

      // Send Media Message
      .addCase(sendMediaMessage.pending, (state) => {
        state.loading.sendMessage = true;
        state.errors.sendMessage = null;
      })
      .addCase(sendMediaMessage.fulfilled, (state, action) => {
        state.loading.sendMessage = false;
        const { conversationId, message } = action.payload;

        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        // Check if message already exists to avoid duplicates
        const messageExists = state.messages[conversationId].some(
          (msg) => msg._id === message._id
        );

        if (!messageExists) {
          state.messages[conversationId].push(message);
        }
      })
      .addCase(sendMediaMessage.rejected, (state, action) => {
        state.loading.sendMessage = false;
        state.errors.sendMessage = action.payload;
      })

      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading.fetchMessages = true;
        state.errors.fetchMessages = null;
      })
    .addCase(fetchMessages.fulfilled, (state, action) => {
  state.loading.fetchMessages = false;
  const {
    conversationId,
    messages: newMessages,
    totalPages,
    currentPage,
    total,
    isNewPage,
  } = action.payload;

  // Ensure numeric values
  const currentPageNum = parseInt(currentPage, 10);
  const totalPagesNum = parseInt(totalPages, 10);
  const totalNum = parseInt(total, 10);

  if (isNewPage) {
    // Replace messages for first page
    state.messages[conversationId] = newMessages;
  } else {
    // For older messages, prepend them to the beginning
    state.messages[conversationId] = [
      ...newMessages,
      ...(state.messages[conversationId] || []),
    ];
  }

  // Store pagination info
  if (!state.conversations[conversationId]) {
    state.conversations[conversationId] = {};
  }
  state.conversations[conversationId].pagination = {
    page: currentPageNum,
    limit: newMessages.length,
    total: totalNum,
    pages: totalPagesNum,
    hasNext: currentPageNum < totalPagesNum,
    hasPrev: currentPageNum > 1,
  };
})
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading.fetchMessages = false;
        state.errors.fetchMessages = action.payload;
      })

      // Delete Single Message
      .addCase(deleteSingleMessage.pending, (state) => {
        state.loading.deleteMessage = true;
        state.errors.deleteMessage = null;
      })
      .addCase(deleteSingleMessage.fulfilled, (state, action) => {
        state.loading.deleteMessage = false;
        const { messageId } = action.payload;

        // Remove the message from all conversations
        Object.keys(state.messages).forEach((conversationId) => {
          state.messages[conversationId] = state.messages[
            conversationId
          ].filter((msg) => msg._id !== messageId);
        });
      })
      .addCase(deleteSingleMessage.rejected, (state, action) => {
        state.loading.deleteMessage = false;
        state.errors.deleteMessage = action.payload;
      })

      // Delete Multiple Messages
      .addCase(deleteMessages.pending, (state) => {
        state.loading.deleteMessage = true;
        state.errors.deleteMessage = null;
      })
      .addCase(deleteMessages.fulfilled, (state, action) => {
        state.loading.deleteMessage = false;
        const { messageIds } = action.payload;

        // Remove multiple messages from all conversations
        Object.keys(state.messages).forEach((conversationId) => {
          state.messages[conversationId] = state.messages[
            conversationId
          ].filter((msg) => !messageIds.includes(msg._id));
        });
      })
      .addCase(deleteMessages.rejected, (state, action) => {
        state.loading.deleteMessage = false;
        state.errors.deleteMessage = action.payload;
      })

      // Mark Messages as Read
      .addCase(markMessagesAsRead.pending, (state) => {
        state.loading.markAsRead = true;
        state.errors.markAsRead = null;
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        state.loading.markAsRead = false;
        const { conversationId, messageIds, modifiedCount } = action.payload;
        
        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[conversationId].map(msg => {
            if (messageIds.length === 0 || messageIds.includes(msg._id)) {
              return { ...msg, isRead: true };
            }
            return msg;
          });
        }
        
        state.unreadCount = Math.max(0, (state.unreadCount || 0) - modifiedCount);
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.loading.markAsRead = false;
        state.errors.markAsRead = action.payload;
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading.fetchUnreadCount = true;
        state.errors.fetchUnreadCount = null;
      })
     .addCase(fetchUnreadCount.fulfilled, (state, action) => {
  state.loading.fetchUnreadCount = false;
  const {unreadCount}=action.payload
  state.unreadCount = unreadCount; // Match the controller response structure
})
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading.fetchUnreadCount = false;
        state.errors.fetchUnreadCount = action.payload;
      })

      // Initiate Call
      .addCase(initiateCall.pending, (state) => {
        state.loading.initiateCall = true;
        state.errors.initiateCall = null;
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.loading.initiateCall = false;
        const { conversationId, message } = action.payload;

        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        // Check if message already exists to avoid duplicates
        const messageExists = state.messages[conversationId].some(
          (msg) => msg._id === message._id
        );

        if (!messageExists) {
          state.messages[conversationId].push(message);
        }
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.loading.initiateCall = false;
        state.errors.initiateCall = action.payload;
      })

      // Update Call Status
      .addCase(updateCallStatus.pending, (state) => {
        state.loading.updateCallStatus = true;
        state.errors.updateCallStatus = null;
      })
      .addCase(updateCallStatus.fulfilled, (state, action) => {
        state.loading.updateCallStatus = false;
        const updatedMessage = action.payload;

        Object.keys(state.messages).forEach((conversationId) => {
          const messageIndex = state.messages[conversationId].findIndex(
            (msg) => msg._id === updatedMessage._id
          );
          if (messageIndex !== -1) {
            state.messages[conversationId][messageIndex] = {
              ...state.messages[conversationId][messageIndex],
              ...updatedMessage,
            };
          }
        });
      })
      .addCase(updateCallStatus.rejected, (state, action) => {
        state.loading.updateCallStatus = false;
        state.errors.updateCallStatus = action.payload;
      })

      // Search Messages
      .addCase(searchMessages.pending, (state) => {
        state.loading.searchMessages = true;
        state.errors.searchMessages = null;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.loading.searchMessages = false;
        const {
          messages,
          totalPages,
          currentPage,
          total,
          query,
          conversationId,
        } = action.payload;

        state.searchResults = {
          data: messages,
          pagination: {
            page: currentPage,
            limit: messages.length,
            total,
            pages: totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
          },
          query,
          conversationId,
        };
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.loading.searchMessages = false;
        state.errors.searchMessages = action.payload;
      })

      // Fetch Call History
      .addCase(fetchCallHistory.pending, (state) => {
        state.loading.fetchCallHistory = true;
        state.errors.fetchCallHistory = null;
      })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.loading.fetchCallHistory = false;
        const { calls, totalPages, currentPage, total } = action.payload;

        state.callHistory = {
          data: calls,
          pagination: {
            page: currentPage,
            limit: calls.length,
            total,
            pages: totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
          },
        };
      })
      .addCase(fetchCallHistory.rejected, (state, action) => {
        state.loading.fetchCallHistory = false;
        state.errors.fetchCallHistory = action.payload;
      })

      // Fetch Media Messages
      .addCase(fetchMediaMessages.pending, (state) => {
        state.loading.fetchMediaMessages = true;
        state.errors.fetchMediaMessages = null;
      })
  

 .addCase(fetchMediaMessages.fulfilled, (state, action) => {
  state.loading.fetchMediaMessages = false;
  const {
    mediaMessages,
    totalPages,
    currentPage,
    total,
    conversationId,
    mediaType,
  } = action.payload;

  state.mediaMessages = {
    data: mediaMessages,
    pagination: {
      page: currentPage,
      limit: action.meta.arg?.limit || 20, // Safely access limit
      total,
      pages: totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
    conversationId,
    mediaType,
  };
})
      .addCase(fetchMediaMessages.rejected, (state, action) => {
        state.loading.fetchMediaMessages = false;
        state.errors.fetchMediaMessages = action.payload;
      })
      
      // Update Messages Read Status
      .addCase(updateMessagesReadStatus.fulfilled, (state, action) => {
        const { messageIds, conversationId, readAt } = action.payload;
        
        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[conversationId].map(msg => {
            if (messageIds.includes(msg._id)) {
              return {
                ...msg,
                isRead: true,
                readAt: readAt
              };
            }
            return msg;
          });
        }
      });
  },
});

// Selectors
export const selectMessagesByConversationId = createSelector(
  [(state) => state.message.messages, (_, conversationId) => conversationId],
  (messages, conversationId) => messages[conversationId] || EMPTY_ARRAY
);

export const selectConversationPagination = createSelector(
  [
    (state) => state.message.conversations,
    (_, conversationId) => conversationId,
  ],
  (conversations, conversationId) => {
    const pagination = conversations[conversationId]?.pagination || EMPTY_PAGINATION;
    
    // Enhanced transformation logic
    return {
      page: Math.max(1, parseInt(pagination.page, 10) || 1),
      limit: Math.max(1, parseInt(pagination.limit, 10) || 20),
      total: Math.max(0, parseInt(pagination.total, 10) || 0),
      pages: Math.max(0, parseInt(pagination.pages, 10) || 0),
      hasNext: Boolean(pagination.hasNext),
      hasPrev: Boolean(pagination.hasPrev),
    };
  }
)

export const selectUnreadCount = createSelector(
  (state) => state.message.unreadCount,
  (unreadCount) => {
    // Add transformation logic if needed
    // For example: ensure it's a number, clamp values, etc.
    return Math.max(0, Number(unreadCount) || 0);
  }
);

export const selectUnreadCounts = createSelector(
  [(state) => state.message.messages, (state) => state.message.unreadCount],
  (messages, totalUnreadCount) => {
    const byConversationId = {};
    
    Object.entries(messages).forEach(([conversationId, messageList]) => {
      const unreadCount = messageList.filter(msg => !msg.isRead).length;
      byConversationId[conversationId] = unreadCount;
    });
    
    return { byConversationId, total: totalUnreadCount };
  }
);

// Enhanced selectCallHistory selector with better structure
export const selectCallHistory = (state) => state.message.callHistory;

// Additional selectors for call history
export const selectCallHistoryData = createSelector(
  [selectCallHistory],
  (callHistory) => callHistory.data || EMPTY_ARRAY
);

export const selectCallHistoryPagination = createSelector(
  [selectCallHistory],
  (callHistory) => callHistory.pagination || EMPTY_PAGINATION
);

export const selectCallHistoryLoading = createSelector(
  [(state) => state.message.loading],
  (loading) => loading.fetchCallHistory
);

export const selectCallHistoryError = createSelector(
  [(state) => state.message.errors],
  (errors) => errors.fetchCallHistory
);

// Selector to filter call history by type (video/audio)
export const selectCallHistoryByType = createSelector(
  [selectCallHistoryData, (_, callType) => callType],
  (callHistory, callType) => {
    if (!callType) return callHistory;
    return callHistory.filter(call => call.callType === callType);
  }
);

// Selector to get call history for a specific conversation
export const selectCallHistoryByConversation = createSelector(
  [selectCallHistoryData, (_, conversationId) => conversationId],
  (callHistory, conversationId) => {
    if (!conversationId) return callHistory;
    return callHistory.filter(call => call.conversationId === conversationId);
  }
);

// Selector to get missed calls
export const selectMissedCalls = createSelector(
  [selectCallHistoryData],
  (callHistory) => callHistory.filter(call => call.status === 'missed')
);

// Selector to get call statistics
export const selectCallStatistics = createSelector(
  [selectCallHistoryData],
  (callHistory) => {
    const totalCalls = callHistory.length;
    const completedCalls = callHistory.filter(call => 
      call.status === 'completed' || call.status === 'ended'
    ).length;
    const missedCalls = callHistory.filter(call => call.status === 'missed').length;
    const totalDuration = callHistory.reduce((total, call) => 
      total + (call.duration || 0), 0
    );
    const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    return {
      totalCalls,
      completedCalls,
      missedCalls,
      totalDuration,
      averageDuration: Math.round(averageDuration)
    };
  }
);

export const selectMediaMessages = (state) => state.message.mediaMessages;

export const selectSearchResults = (state) => state.message.searchResults;

export const selectMessageLoading = (state) => state.message.loading;

export const selectMessageErrors = (state) => state.message.errors;
export const selectMediaPagination = createSelector(
  [selectMediaMessages],
  (mediaMessages) => mediaMessages.pagination || EMPTY_PAGINATION
);

export const {
  clearMessages,
  clearSearchResults,
  clearErrors,
  addMessageToConversation, 
  updateMessageStatus,
  setCurrentConversation, 
  incrementUnreadCount,
  decrementUnreadCount,
  resetMessageState,
} = messageSlice.actions;

export default messageSlice.reducer;