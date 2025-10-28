import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import BlockService from "../services/BlockService";

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

export const blockUser = createAsyncThunk(
  "block/blockUser",
  async (userIdToBlock, { rejectWithValue }) => {
    try {
      const data = await BlockService.block(userIdToBlock);
      return data;
    } catch (error) {
      console.log("block user error:", error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const unblockUser = createAsyncThunk(
  "block/unblockUser",
  async (userIdToUnblock, { rejectWithValue }) => {
    try {
      const data = await BlockService.unBlock(userIdToUnblock);
      return data;
    } catch (error) {
      console.log("unblock user error:", error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getBlockedUsers = createAsyncThunk(
  "block/getBlockedUsers",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const data = await BlockService.blockedUsers(page, limit);
      return data;
    } catch (error) {
      console.log("blocked users error:", error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
); 

export const checkBlockStatus = createAsyncThunk(
  "block/checkBlockStatus",
  async (targetUserId, { rejectWithValue }) => {
    try {
      const data = await BlockService.blockStatus(targetUserId);
      return { ...data, targetUserId };
    } catch (error) {
      console.log("block status error:", error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

const initialState = {
  blockedUsers: [],
  blockStatus: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  }
};

const blockSlice = createSlice({
  name: "block",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBlockStatus: (state) => {
      state.blockStatus = {};
    },
    resetBlockState: () => initialState,
    updateBlockStatus: (state, action) => {
      const { targetUserId, isBlockedByMe, isBlockedByThem, canInteract } = action.payload;
      state.blockStatus[targetUserId] = {
        isBlockedByMe,
        isBlockedByThem,
        canInteract
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Block User
      .addCase(blockUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.loading = false;
        const { blockedUserId } = action.payload.data;
        
        // Update block status
        state.blockStatus[blockedUserId] = {
          isBlockedByMe: true,
          isBlockedByThem: false,
          canInteract: false
        };
        
        // Add to blocked users list if not already there
        if (!state.blockedUsers.some(user => user._id === blockedUserId)) {
          state.blockedUsers.unshift({
            _id: blockedUserId,
            blockedAt: new Date().toISOString()
          });
        }
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Unblock User
      .addCase(unblockUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.loading = false;
        const { unblockedUserId } = action.payload.data;
        
        // Update block status
        state.blockStatus[unblockedUserId] = {
          isBlockedByMe: false,
          isBlockedByThem: false,
          canInteract: true
        };
        
        // Remove from blocked users list
        state.blockedUsers = state.blockedUsers.filter(
          user => user._id !== unblockedUserId
        );
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Blocked Users
      .addCase(getBlockedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBlockedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.blockedUsers = action.payload.data.blockedUsers;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getBlockedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Check Block Status
      .addCase(checkBlockStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkBlockStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { targetUserId, data } = action.payload;
        state.blockStatus[targetUserId] = data;
      })
      .addCase(checkBlockStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectBlockedUsers = (state) => state.block.blockedUsers;
export const selectBlockStatus = (state) => state.block.blockStatus;
export const selectBlockLoading = (state) => state.block.loading;
export const selectBlockError = (state) => state.block.error;
export const selectBlockPagination = (state) => state.block.pagination;

export const selectIsUserBlocked = (targetUserId) => 
  createSelector(
    [selectBlockStatus],
    (blockStatus) => blockStatus[targetUserId]?.isBlockedByMe || false
  );

export const selectCanInteractWithUser = (targetUserId) =>
  createSelector(
    [selectBlockStatus],
    (blockStatus) => blockStatus[targetUserId]?.canInteract ?? true
  );

export const {
  clearError,
  clearBlockStatus,
  resetBlockState,
  updateBlockStatus
} = blockSlice.actions;

export default blockSlice.reducer;