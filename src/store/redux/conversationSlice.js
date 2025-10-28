import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ConversationService from "../services/ConversationService";
import { normalizeId } from "../../utils/normalizationUtils";
import { createSelector } from "reselect";

const EMPTY_ARRAY = [];
const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
  hasNextPage: false,
  nextPage: null
};

// Helper function for consistent response handling
const handleResponse = (response) => {
  // Handle both nested data structure and direct data
  return response?.data || response;
};

// Async Thunks with consistent response handling
export const getUserConversations = createAsyncThunk(
  "conversation/getUserConversations",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await ConversationService.getUserConversations(page, limit);
      return handleResponse(response);
    } catch (error) {
      return rejectWithValue(ConversationService.handleError(error));
    }
  }
);

export const getConversation = createAsyncThunk(
  "conversation/getConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await ConversationService.getConversation(conversationId);
      return handleResponse(response);
    } catch (error) {
      return rejectWithValue(ConversationService.handleError(error));
    }
  }
);

export const createOrGetPersonalConversation = createAsyncThunk(
  "conversation/personal",
  async ({ userId, matchId }, { rejectWithValue }) => {
    try {
      const response = await ConversationService.createOrGetPersonalConversation(userId, matchId);
      return handleResponse(response);
    } catch (error) {
      return rejectWithValue(ConversationService.handleError(error));
    }
  }
);

// Update other thunks similarly...
export const createGroupConversation = createAsyncThunk(
  "conversation/createGroup",
  async ({ userIds, groupName, groupDescription, groupPhoto }, { rejectWithValue }) => {
    try {
      const response = await ConversationService.createGroupConversation(
        userIds,
        groupName,
        groupDescription,
        groupPhoto
      );
      return handleResponse(response);
    } catch (error) {
      return rejectWithValue(ConversationService.handleError(error));
    }
  }
);

export const markMessagesAsRead = createAsyncThunk( 
  "conversation/markMessagesAsRead",
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await ConversationService.markMessagesAsRead(conversationId);
      return { ...handleResponse(response), conversationId };
    } catch (error) {
      return rejectWithValue(ConversationService.handleError(error));
    }
  }
);

const initialState = {
  byId: {},
  allIds: [],
  pagination: EMPTY_PAGINATION,
  unreadCounts: { total: 0, byConversationId: {} },
  currentConversation: null,
  loading: false,
  error: null,
  searchResults: [],
  participants: {},
  searchLoading: false,
  lastUpdated: null,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const normalizedId = normalizeId(conversationId);
      
      // Safely increment count
      const currentCount = state.unreadCounts.byConversationId[normalizedId] || 0;
      state.unreadCounts.byConversationId[normalizedId] = currentCount + 1;
      
      // Recalculate total safely
      state.unreadCounts.total = Object.values(state.unreadCounts.byConversationId)
        .reduce((sum, curr) => sum + (Number(curr) || 0), 0);
    },
    
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    
    updateLastMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const normalizedId = normalizeId(conversationId);
      
      if (state.byId[normalizedId]) {
        state.byId[normalizedId].lastMessage = message;
        state.byId[normalizedId].lastMessageAt = new Date().toISOString();
        state.lastUpdated = new Date().toISOString();
      }
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      const normalizedId = normalizeId(conversationId);
      
      if (normalizedId) {
        state.unreadCounts.byConversationId[normalizedId] = Math.max(0, Number(count) || 0);
        state.unreadCounts.total = Object.values(state.unreadCounts.byConversationId)
          .reduce((sum, curr) => sum + (Number(curr) || 0), 0);
      }
    },
    
    // New action to handle socket message read events
    markConversationRead: (state, action) => {
      const { conversationId } = action.payload;
      const normalizedId = normalizeId(conversationId);
      
      if (normalizedId && state.unreadCounts.byConversationId[normalizedId]) {
        // Store the previous count for potential rollback
        const previousCount = state.unreadCounts.byConversationId[normalizedId];
        state.unreadCounts.byConversationId[normalizedId] = 0;
        state.unreadCounts.total = Math.max(0, state.unreadCounts.total - previousCount);
      }
    },
    
    // Reset conversations (useful for logout)
    resetConversations: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get User Conversations - FIXED
      .addCase(getUserConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserConversations.fulfilled, (state, action) => {
        state.loading = false;
        
        const response = action.payload;
        
        if (!response) {
          console.error('Invalid response structure');
          return;
        }
        
        // Handle different response structures
        const conversations = response.conversations || response.data?.conversations || [];
        const unreadCounts = response.unreadCounts || response.data?.unreadCounts || {};
        const pagination = response.pagination || response.data?.pagination || EMPTY_PAGINATION;
        
        // Store conversations with normalization
        if (Array.isArray(conversations)) {
          conversations.forEach((conversation) => {
            if (conversation?._id) {
              const id = normalizeId(conversation._id);
              state.byId[id] = conversation;
              if (!state.allIds.includes(id)) {
                state.allIds.push(id);
              }
            }
          });
        }
        
        // Update unread counts with normalization
        if (unreadCounts && typeof unreadCounts === 'object') {
          const normalizedUnreadCounts = {};
          Object.entries(unreadCounts).forEach(([key, value]) => {
            if (key) {
              normalizedUnreadCounts[normalizeId(key)] = Math.max(0, Number(value) || 0);
            }
          });
          
          state.unreadCounts.byConversationId = normalizedUnreadCounts;
          state.unreadCounts.total = Object.values(normalizedUnreadCounts)
            .reduce((sum, count) => sum + count, 0);
        }
        
        state.pagination = {
          ...EMPTY_PAGINATION,
          ...pagination,
          hasNextPage: pagination.page < pagination.pages,
          nextPage: pagination.page < pagination.pages ? pagination.page + 1 : null
        };
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getUserConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load conversations';
      })

      // Get Conversation
      .addCase(getConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConversation.fulfilled, (state, action) => {
        state.loading = false;
        const conversation = action.payload;
        
        if (conversation?._id) {
          const id = normalizeId(conversation._id);
          state.byId[id] = conversation;
          state.currentConversation = id;
          if (!state.allIds.includes(id)) {
            state.allIds.push(id);
          }
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(getConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Personal Conversation - FIXED
      .addCase(createOrGetPersonalConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrGetPersonalConversation.fulfilled, (state, action) => {
        state.loading = false;
        const conversation = action.payload;
        
        if (conversation?._id) {
          const id = normalizeId(conversation._id);
          state.byId[id] = conversation;
          state.currentConversation = id;
          if (!state.allIds.includes(id)) {
            state.allIds.push(id);
          }
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(createOrGetPersonalConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Messages as Read
      .addCase(markMessagesAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId } = action.payload;
        const normalizedId = normalizeId(conversationId);
        
        if (normalizedId) {
          const previousCount = state.unreadCounts.byConversationId[normalizedId] || 0;
          state.unreadCounts.byConversationId[normalizedId] = 0;
          state.unreadCounts.total = Math.max(0, state.unreadCounts.total - previousCount);
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add other cases similarly with consistent patterns...
  },
});

// Enhanced Selectors
export const selectConversations = (state) => state.conversation.byId;
export const selectAllConversationIds = (state) => state.conversation.allIds;

export const selectCurrentConversation = createSelector(
  [selectConversations, (state) => state.conversation.currentConversation],
  (conversations, currentId) => currentId ? conversations[currentId] : null
);

export const selectConversationById = createSelector(
  [selectConversations, (_, id) => id],
  (conversations, id) => conversations[normalizeId(id)] || null
);

export const selectConversationPagination = (state) => state.conversation.pagination;
export const selectConversationLoading = (state) => state.conversation.loading;
export const selectConversationError = (state) => state.conversation.error;
export const selectSearchResults = (state) => state.conversation.searchResults;
export const selectSearchLoading = (state) => state.conversation.searchLoading;
export const selectLastUpdated = (state) => state.conversation.lastUpdated;

// Enhanced unread counts selector with better fallback
export const selectUnreadCounts = createSelector(
  [(state) => state.conversation.unreadCounts, selectConversations],
  (officialUnreadCounts, conversations) => {
    // Use official counts if available and valid
    if (officialUnreadCounts.total > 0 || Object.keys(officialUnreadCounts.byConversationId).length > 0) {
      return officialUnreadCounts;
    }
    
    // Fallback: calculate from conversations
    const fallbackUnreadCounts = { total: 0, byConversationId: {} };
    
    Object.values(conversations).forEach(conversation => {
      if (conversation?._id && conversation.unreadCount) {
        const id = normalizeId(conversation._id);
        const count = Math.max(0, Number(conversation.unreadCount) || 0);
        if (count > 0) {
          fallbackUnreadCounts.byConversationId[id] = count;
          fallbackUnreadCounts.total += count;
        }
      }
    });
    
    return fallbackUnreadCounts;
  }
);

export const selectParticipantsByConversationId = createSelector(
  [(state) => state.conversation.participants, (_, conversationId) => conversationId],
  (participants, conversationId) => participants[conversationId] || EMPTY_ARRAY
);

export const {
  clearError,
  setCurrentConversation,
  updateLastMessage,
  clearSearchResults,
  updateUnreadCount,
  incrementUnreadCount,
  markConversationRead,
  resetConversations,
} = conversationSlice.actions;

export default conversationSlice.reducer;