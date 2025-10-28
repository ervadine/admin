import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import MatchService from "../services/MatchService";
import { normalizeId } from "../../utils/normalizationUtils";
import { createSelector } from "reselect";
import { editProfile } from "./authSlice"; // Import the auth action

const EMPTY_ARRAY = [];
const EMPTY_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
};

const handleAsyncError = (error) => {
  console.error("Async error:", error);

  if (error.code === "ERR_NETWORK") {
    return {
      message: "Network error. Please check your internet connection.",
      code: "NETWORK_ERROR",
      status: 0,
    };
  }

  if (error.response) {
    return {
      message:
        error.response.data?.message ||
        `Server error: ${error.response.status}`,
      code: error.code,
      status: error.response.status,
    };
  }

  return {
    message: error.message || "An unexpected error occurred",
    code: error.code || "UNKNOWN_ERROR",
    status: 0,
  };
};

// Async thunks
export const likeUser = createAsyncThunk(
  "match/like",
  async (targetUserId, { rejectWithValue, dispatch }) => {
    try {
      // Optimistic update
      dispatch(addLikedUser(targetUserId));

      const response = await MatchService.likeUser(targetUserId);

      if (response.data?.isMutualMatch) {
        dispatch(incrementNewLikes());
      } 

      return response;
    } catch (error) {
      dispatch(removeLikedUser(targetUserId));
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const unlikeUser = createAsyncThunk(
  "match/unlike",
  async (targetUserId, { rejectWithValue, dispatch }) => {
    try {
      dispatch(removeLikedUser(targetUserId));
      const response = await MatchService.unlikeUser(targetUserId);
      return response;
    } catch (error) {
      dispatch(addLikedUser(targetUserId));
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getMutualLikers = createAsyncThunk(
  "match/check-mutual-match",
  async (targetUserId, { rejectWithValue, dispatch }) => {
    try {
      const response = await MatchService.checkMutualMatch(targetUserId);
      return response;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getUsersWhoLikedMe = createAsyncThunk(
  "match/users-who-liked-me",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await MatchService.getUsersWhoLikedMe(page, limit);
      console.log("result for likes: ", response);

      // Check if the response structure is correct
      if (response.data && response.data.users) { 
        return {
          users: response.data.users,
          newLikes: response.data.newLikes || 0,
          pagination: response.data.pagination || {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        };
      } else {
        // Handle unexpected response structure
        console.error("Unexpected API response structure:", response);
        return {
          users: [],
          newLikes: 0,
          pagination: { page, limit, total: 0, pages: 0 },
        };
      }
    } catch (error) {
      console.error("Error in getUsersWhoLikedMe thunk:", error);
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getUsersToSwipe = createAsyncThunk(
  "match/users-to-swipe",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await MatchService.getUsersToSwipe(params);
      return {
        users: response.data?.users || [],
        pagination: response.data?.pagination || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          pages: 0,
        },
        filters: response.filters || {},
      };
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const markUserAsSeen = createAsyncThunk(
  "match/mark-user-viewed",
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const response = await MatchService.markUserAsViewed(userId);

      if (response.data?.likeCount !== undefined) {
        dispatch(updateLikeCount(response.data.likeCount));
      }

      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getStaticMatches = createAsyncThunk(
  "match/getMatches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MatchService.getStaticMatches();
      
      return {
        matches: response.data?.mutualMatches || [],
        analytics: {
          totalLikes: response.data?.totalLikes || 0,
          totalMatches: response.data?.totalMatches || 0,
        }
      };
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

const matchSlice = createSlice({
  name: "match",
  initialState: {
    matches: [],
    matchesPagination: EMPTY_PAGINATION,
    matchesLoading: false,
    matchesError: null,
    likedUsers: [],
    usersWhoLikedMe: [],
    usersToSwipe: [],
    newLikes: 0,
    unviewedLikes: [],
    loading: false,
    swipeLoading: false,
    error: null,
    lastMatch: null,
    pagination: EMPTY_PAGINATION,
    swipeFilters: {
      maxDistance: 2000,
      minDistance: 0,
      minAge: 18,
      maxAge: 99,
      genders: null,
      showOnlineOnly: false,
      showVIPOnly: false,
    },
    mutualLikers: [],
    mutualLikersLoading: false,
    mutualLikersError: null,
    matchId: null,
    shouldRefreshSwipe: false, // New flag to trigger refresh
  },
  reducers: {
    addLikedUser: (state, action) => {
      const userId = normalizeId(action.payload);
      if (!state.likedUsers.includes(userId)) {
        state.likedUsers.push(userId);
      }
    },
    removeLikedUser: (state, action) => {
      const userId = normalizeId(action.payload);
      state.likedUsers = state.likedUsers.filter((id) => id !== userId);
    },
    incrementNewLikes: (state) => {
      state.newLikes += 1;
    },
    decrementNewLikes: (state) => {
      state.newLikes = Math.max(0, state.newLikes - 1);
    },
    updateLikeCount: (state, action) => {
      state.newLikes = action.payload;
    },
    addUnviewedLike: (state, action) => {
      const userId = normalizeId(action.payload);
      if (!state.unviewedLikes.includes(userId)) {
        state.unviewedLikes.push(userId);
      }
    },
    removeUnviewedLike: (state, action) => {
      const userId = normalizeId(action.payload);
      state.unviewedLikes = state.unviewedLikes.filter((id) => id !== userId);
    },
    clearMatchState: (state) => {
      state.matches = [];
      state.likedUsers = [];
      state.usersWhoLikedMe = [];
      state.usersToSwipe = [];
      state.newLikes = 0;
      state.unviewedLikes = [];
      state.loading = false;
      state.swipeLoading = false;
      state.error = null;
      state.lastMatch = null;
      state.mutualLikers = [];
      state.mutualLikersLoading = false;
      state.mutualLikersError = null;
      state.shouldRefreshSwipe = false;
    },
    clearUsersToSwipe: (state) => {
      state.usersToSwipe = [];
      state.pagination = EMPTY_PAGINATION;
    },
    updateSwipeFilters: (state, action) => {
      state.swipeFilters = { ...state.swipeFilters, ...action.payload };
    },
    initializeUnviewedLikes: (state, action) => {
      state.unviewedLikes = action.payload.map(normalizeId);
      state.newLikes = action.payload.length;
    },
    // New reducer to manually trigger swipe refresh
    triggerSwipeRefresh: (state) => {
      state.shouldRefreshSwipe = true;
      state.usersToSwipe = [];
      state.pagination = EMPTY_PAGINATION;
    },
    // New reducer to reset the refresh flag
    resetSwipeRefresh: (state) => {
      state.shouldRefreshSwipe = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // likeUser
      .addCase(likeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.isMutualMatch) {
          state.lastMatch = {
            targetUser: action.payload.targetUser,
            match: action.payload.match,
            isMutualMatch: true,
          };
        }
      })
      .addCase(likeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // unlikeUser
      .addCase(unlikeUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(unlikeUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(unlikeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getUsersWhoLikedMe
      .addCase(getUsersWhoLikedMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersWhoLikedMe.fulfilled, (state, action) => {
        state.loading = false;

        // Handle pagination - replace for page 1, append for subsequent pages
        if (action.payload.pagination.page === 1) {
          state.usersWhoLikedMe = action.payload.users;
        } else {
          // Append new users, remove duplicates
          const existingIds = new Set(
            state.usersWhoLikedMe.map((user) => user._id)
          );
          const newUsers = action.payload.users.filter(
            (user) => !existingIds.has(user._id)
          );
          state.usersWhoLikedMe = [...state.usersWhoLikedMe, ...newUsers];
        }

        state.newLikes = action.payload.newLikes;
        state.pagination = action.payload.pagination;

        // Update unviewed likes based on the viewed status from the backend
        const newUnviewedLikes = [];
        action.payload.users.forEach((user) => {
          if (!user.viewed) {
            const normalizedId = normalizeId(user._id);
            if (!newUnviewedLikes.includes(normalizedId)) {
              newUnviewedLikes.push(normalizedId);
            }
          }
        });
        state.unviewedLikes = newUnviewedLikes;
      })
      .addCase(getUsersWhoLikedMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Don't clear the existing users on error
      })
      // getUsersToSwipe
      .addCase(getUsersToSwipe.pending, (state) => {
        state.swipeLoading = true;
        state.error = null;
      })
      .addCase(getUsersToSwipe.fulfilled, (state, action) => {
        state.swipeLoading = false;
        const { users, pagination, filters } = action.payload;

        if (pagination.page === 1) {
          state.usersToSwipe = users;
        } else {
          // Append new users, remove duplicates
          const existingIds = new Set(
            state.usersToSwipe.map((user) => user._id)
          );
          const newUsers = users.filter((user) => !existingIds.has(user._id));
          state.usersToSwipe = [...state.usersToSwipe, ...newUsers];
        }

        state.pagination = pagination;
        state.shouldRefreshSwipe = false; // Reset refresh flag after successful fetch

        if (filters) {
          state.swipeFilters = { ...state.swipeFilters, ...filters };
        }
      })
      .addCase(getUsersToSwipe.rejected, (state, action) => {
        state.swipeLoading = false;
        state.error = action.payload;
        state.usersToSwipe = [];
        state.shouldRefreshSwipe = false; // Reset refresh flag on error too
      })
      // markUserAsSeen
      .addCase(markUserAsSeen.fulfilled, (state, action) => {
        const { userId, likeCount } = action.payload;
        if (likeCount !== undefined) {
          state.newLikes = likeCount;
        }
        state.unviewedLikes = state.unviewedLikes.filter(
          (id) => id !== normalizeId(userId)
        );
      })
      // Listen for profile update success from authSlice
      .addCase(editProfile.fulfilled, (state) => {
        // Clear current swipe users and trigger refresh
        state.usersToSwipe = [];
        state.pagination = EMPTY_PAGINATION;
        state.shouldRefreshSwipe = true;
      })
      .addCase(getMutualLikers.pending, (state) => {
        state.mutualLikersLoading = true;
        state.mutualLikersError = null;
      })
      .addCase(getMutualLikers.fulfilled, (state, action) => {
        state.mutualLikersLoading = false;
        state.mutualLikers = action.payload.data.mutualLikers;
        state.matchId = action.payload.data.matchId;
      })
      .addCase(getMutualLikers.rejected, (state, action) => {
        state.mutualLikersLoading = false;
        state.mutualLikersError = action.payload;
      })
      .addCase(getStaticMatches.pending, (state) => {
        state.matchesLoading = true;
        state.matchesError = null;
      })
      .addCase(getStaticMatches.fulfilled, (state, action) => {
        state.matchesLoading = false;
        const { matches, analytics } = action.payload;

        state.matches = matches || [];
        
        if (analytics) {
          state.analytics = analytics;
        }
      })
      .addCase(getStaticMatches.rejected, (state, action) => {
        state.matchesLoading = false;
        state.matchesError = action.payload;
      });
  },
});

export const {
  addLikedUser,
  removeLikedUser,
  incrementNewLikes,
  updateLikeCount,
  addUnviewedLike,
  removeUnviewedLike,
  decrementNewLikes,
  clearMatchState,
  clearUsersToSwipe,
  updateSwipeFilters,
  initializeUnviewedLikes,
  triggerSwipeRefresh,
  resetSwipeRefresh,
} = matchSlice.actions;

// Selectors

// Basic selectors (input selectors)
const selectMatchState = (state) => state.match;

// New selector for the refresh flag
export const selectShouldRefreshSwipe = createSelector(
  [selectMatchState],
  (match) => match.shouldRefreshSwipe || false
);

// Memoized selectors
export const selectUsersWhoLikedMe = createSelector(
  [selectMatchState],
  (match) => match.usersWhoLikedMe || EMPTY_ARRAY
);

export const selectUnviewedLikes = createSelector(
  [selectMatchState],
  (match) => match.unviewedLikes || EMPTY_ARRAY
);

export const selectUnviewedUsers = createSelector(
  [selectUsersWhoLikedMe, selectUnviewedLikes],
  (users, unviewedLikes) => {
    const normalizedUnviewedIds = unviewedLikes.map(normalizeId);
    return users.filter((user) =>
      normalizedUnviewedIds.includes(normalizeId(user._id))
    );
  }
);

export const selectUsersToSwipe = createSelector(
  [selectMatchState],
  (match) => match.usersToSwipe || EMPTY_ARRAY
);

export const selectLikedUsers = createSelector(
  [selectMatchState],
  (match) => match.likedUsers || EMPTY_ARRAY
);

export const selectNewLikesCount = createSelector(
  [selectMatchState],
  (match) => match.newLikes || 0
);

export const selectMatchLoading = createSelector(
  [selectMatchState],
  (match) => match.loading || false
);

export const selectSwipeLoading = createSelector(
  [selectMatchState],
  (match) => match.swipeLoading || false
);

export const selectMatchError = createSelector(
  [selectMatchState],
  (match) => match.error || null
);

export const selectPagination = createSelector(
  [selectMatchState],
  (match) => match.pagination || EMPTY_PAGINATION
);

export const selectSwipeFilters = createSelector(
  [selectMatchState],
  (match) => match.swipeFilters
);

export const selectHasMoreUsersToSwipe = createSelector(
  [selectPagination],
  (pagination) => pagination.page < pagination.pages
);

export const selectCurrentSwipeUser = createSelector(
  [selectUsersToSwipe, (state, index) => index],
  (users, index) => users[index] || null
);

export const selectIsUserLiked = createSelector(
  [selectLikedUsers, (state, userId) => userId],
  (likedUsers, userId) => likedUsers.includes(normalizeId(userId))
);

// Complex selector for filtered users
export const selectFilteredUsersToSwipe = createSelector(
  [selectUsersToSwipe, selectSwipeFilters],
  (users, filters) => {
    if (!users.length) return EMPTY_ARRAY;

    return users.filter((user) => {
      // Apply filter logic here
      if (
        filters.genders &&
        user.gender &&
        !filters.genders.includes(user.gender)
      ) {
        return false;
      }

      if (filters.minAge && user.age && user.age < filters.minAge) {
        return false;
      }

      if (filters.maxAge && user.age && user.age > filters.maxAge) {
        return false;
      }

      if (
        filters.maxDistance &&
        user.distance &&
        user.distance > filters.maxDistance
      ) {
        return false;
      }

      if (filters.showOnlineOnly && user.isOnline === false) {
        return false;
      }

      if (filters.showVIPOnly && user.isVIP === false) {
        return false;
      }

      return true;
    });
  }
);
 
export const selectMutualLikers = createSelector(
  [selectMatchState],
  (match) => match.mutualLikers || EMPTY_ARRAY
);

export const selectMutualLikersLoading = createSelector(
  [selectMatchState],
  (match) => match.mutualLikersLoading || false
);

export const selectMatchId = createSelector(
  [selectMatchState],
  (match) => match.matchId || null
);

export const selectMutualLikersError = createSelector(
  [selectMatchState],
  (match) => match.mutualLikersError || null
);

export const selectMatches = createSelector(
  [selectMatchState],
  (match) => match.matches || EMPTY_ARRAY
);

export const selectMatchesCount = createSelector(
  [selectMatches],
  (matches) => {
    if (!matches || !Array.isArray(matches)) return 0;
    return matches.length;
  }
);

export const selectMatchesPagination = createSelector(
  [selectMatchState],
  (match) => match.matchesPagination || EMPTY_PAGINATION
);

export const selectMatchesLoading = createSelector(
  [selectMatchState],
  (match) => match.matchesLoading || false
);

export const selectMatchesError = createSelector(
  [selectMatchState],
  (match) => match.matchesError || null
);

export const selectHasMoreMatches = createSelector(
  [selectMatchesPagination],
  (pagination) => pagination.page < pagination.pages
);

// Selector for total matches count from pagination
export const selectTotalMatchesCount = createSelector(
  [selectMatchesPagination],
  (pagination) => pagination.total || 0
);

export const selectAnalytics = createSelector(
  [selectMatchState],
  (match) => match.analytics || {}
);

export const selectTotalLikesReceived = createSelector(
  [selectAnalytics],
  (analytics) => analytics.totalLikesReceived || 0
);

export default matchSlice.reducer;