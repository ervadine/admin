import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../services/AuthService";
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

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await AuthService.register(userData);
      return data;
    } catch (error) {
      console.log("Registration error:", error);

      if (error.response?.status === 500) {
        return rejectWithValue("User already exists");
      }

      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await AuthService.login(credentials);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verify-email",
  async (verificationData, { rejectWithValue }) => {
    try {
      const data = await AuthService.verifyEmail(verificationData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async (_, { rejectWithValue }) => {
    try {
      const data = await AuthService.resendVerificationCode();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const completeProfile = createAsyncThunk(
  "auth/completeProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await AuthService.completeProfile(profileData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const editProfile = createAsyncThunk(
  "auth/edit-profile",
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await AuthService.editProfile(profileData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (refreshTokenData, { rejectWithValue }) => {
    try {
      const data = await AuthService.refreshToken(refreshTokenData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const data = await AuthService.forgotPassword(email);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const data = await AuthService.resetPassword(resetData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const profileUser = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await AuthService.getProfile();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const addPhotoProfile = createAsyncThunk(
  "auth/upload-profile-picture",
  async (imageData, { rejectWithValue }) => {
    try {
      const data = await AuthService.addPhotoProfile(imageData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const uploadMorePhotos = createAsyncThunk(
  "auth/upload-pictures",
  async (imagesData, { rejectWithValue }) => {
    try {
      const imagesArray = Array.isArray(imagesData) ? imagesData : [imagesData];
      const data = await AuthService.addMorePhotos(imagesArray);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const deleteImage = createAsyncThunk(
  "auth/deleteImage",
  async (publicId, { rejectWithValue }) => {
    try {
      const data = await AuthService.deleteImage(publicId);
      return {
        publicId,
        ...data,
      }; 
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const deleteProfileImage = createAsyncThunk(
  "auth/delete-profile-picture",
  async (_, { rejectWithValue }) => {
    try {
      const data = await AuthService.deleteProfilePicture();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const data = await AuthService.logout();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const allUsers = createAsyncThunk(
  "auth/users",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const data = await AuthService.getAllUsers(page, limit);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getUserById = createAsyncThunk(
  "auth/user",
  async (userId, { rejectWithValue }) => {
    try {
      const data = await AuthService.getUserById(userId);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const searchUsers = createAsyncThunk(
  "auth/search-users",
  async (searchParams = {}, { rejectWithValue }) => {
    try {
      const data = await AuthService.searchUsers(searchParams);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const updatePrivacySettings = createAsyncThunk(
  "auth/updatePrivacySettings",
  async (privacyData, { rejectWithValue }) => {
    try {
      const data = await AuthService.updatePrivacySettings(privacyData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  status: "idle",
  users: [],
  usersPagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  error: null,
  isAuthenticated: false,
  success: false,
  requiresVerification: false,
  requiresProfileCompletion: false,
  onboardingComplete: false,
  verificationToken: null,
  usersStatus: "idle",
  usersError: null,
  userPrivacySettings: {},
  searchResults: [],
  searchPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  },
  searchParams: {},
  searchStatus: "idle",
  searchError: null,
  settings: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      AuthService.logout();
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.success = false;
      state.requiresVerification = false;
      state.requiresProfileCompletion = false;
      state.onboardingComplete = false;
      state.verificationToken = null;
    },
    resetAuthError: (state) => {
      state.error = null;
    },
    resetAuthSuccess: (state) => {
      state.success = false;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearAuthState: (state) => {
      Object.assign(state, initialState);
    },
    clearResetPasswordStatus: (state) => {
      state.resetPasswordStatus = "idle";
      state.resetPasswordError = null;
    },
    resetUsersStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.usersPagination = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      };
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchPagination = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      };
      state.searchParams = {};
      state.searchStatus = "idle";
      state.searchError = null;
    },
    resetSearchStatus: (state) => {
      state.searchStatus = "idle";
      state.searchError = null;
    },
    updateUserVIPStatus: (state, action) => {
      if (state.user) {
        state.user.isVIP = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.verificationToken;
        state.verificationToken = action.payload.verificationToken;
        state.isAuthenticated = false;
        state.requiresVerification = action.payload.requiresVerification;
        state.requiresProfileCompletion =
          action.payload.requiresProfileCompletion;
        state.success = true;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.refreshToken = action.payload.data.refreshToken;
        state.isAuthenticated = true;
        state.onboardingComplete = action.payload.data.onboardingComplete;
        state.requiresVerification =
          action.payload.data.requiresVerification || false;
        state.requiresProfileCompletion =
          action.payload.data.requiresProfileCompletion || false;
        state.success = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
        state.isAuthenticated = false;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.token = action.payload?.token || null;
        state.requiresVerification = false;
        state.requiresProfileCompletion =
          action.payload?.requiresProfileCompletion || false;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(completeProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.account.user;
        state.requiresProfileCompletion = false;
        state.onboardingComplete = action.payload.onboardingComplete || true;
        state.success = true;
        state.error = null;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(addPhotoProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(addPhotoProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.data && action.payload.profilePicture) {
          state.user = {
            ...state.user,
            profilePicture: action.payload.profilePicture,
          };
        }
        state.success = true;
        state.error = null;
      })
      .addCase(addPhotoProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(uploadMorePhotos.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(uploadMorePhotos.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.data && action.payload.uploadedImages) {
          state.user = {
            ...state.user,
            more_pictures: [
              ...(state.user?.more_pictures || []),
              ...action.payload.uploadedImages,
            ],
          };
        }
        state.success = true;
        state.error = null;
      })
      .addCase(uploadMorePhotos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteImage.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (state.user && state.user.more_pictures) {
          state.user.more_pictures = state.user.more_pictures.filter(
            (img) => img.publicId !== action.payload.publicId
          );
        }
        state.success = true;
        state.error = null;
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(refreshToken.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.requiresVerification =
          action.payload.requiresVerification || false;
        state.requiresProfileCompletion =
          action.payload.requiresProfileCompletion || false;
        state.success = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.success = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded";
        state.success = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.success = false;
        state.requiresVerification = false;
        state.requiresProfileCompletion = false;
        state.onboardingComplete = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.requiresVerification = false;
        state.requiresProfileCompletion = false;
        state.onboardingComplete = false;
      })
      .addCase(profileUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(profileUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.userData.user;
        
        if (action.payload.userData.privacySettings) {
          state.userPrivacySettings = action.payload.userData.privacySettings.showLastActive;
          
          if (state.user) {
            state.user.settings = {
              ...state.user.settings,
              showLastActive: action.payload.userData.privacySettings.showLastActive
            };
          }
        }
        
        state.requiresVerification = action.payload.requiresVerification;
        state.requiresProfileCompletion = action.payload.requiresProfileCompletion;
        state.onboardingComplete = action.payload.onboardingComplete;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(profileUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(resendVerificationCode.pending, (state) => {
        state.status = "resend_loading";
        state.error = null;
        state.success = false;
      })
      .addCase(resendVerificationCode.fulfilled, (state, action) => {
        state.status = "resend_succeeded";
        state.success = true;
        state.error = null;
        state.user = action.payload.emailVerificationSent || true;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.status = "resend_failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(editProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(editProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.update.user;
        state.requiresProfileCompletion =
          !action.payload.update.user.profileComplete;
        state.isAuthenticated = true;
        state.success = true;
        state.error = null;
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      })
      .addCase(deleteProfileImage.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(deleteProfileImage.fulfilled, (state, action) => {
        if (state.user) {
          state.user.profilePicture = action.payload.profilePicture;
        }
        state.status = "succeeded";
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload?.message || "Failed to delete profile image";
      })
      .addCase(allUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(allUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload.data.users;
        state.usersPagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(allUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.users = [];
      })
      .addCase(getUserById.pending, (state) => {
        state.userProfileStatus = "loading";
        state.userProfileError = null;
        state.userProfile = null;
        state.distance = null;
        state.distanceFormatted = null;
        state.compatibilityScore = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.userProfileStatus = "succeeded";
        state.userProfile = action.payload.data.user;
        state.settings = action.payload.data.privacyInfo;
        state.distance = action.payload.data.distance;
        state.distanceFormatted = action.payload.data.distanceFormatted;
        state.compatibilityScore = action.payload.data.compatibilityScore;
        state.userProfileError = null;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.userProfileStatus = "failed";
        state.userProfileError = action.payload;
        state.userProfile = null;
        state.distance = null;
        state.distanceFormatted = null;
        state.compatibilityScore = null;
      })
      .addCase(searchUsers.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.data.users;
        state.searchPagination = action.payload.data.pagination;
        state.searchParams = action.payload.data.searchParams;
        state.searchError = null;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = action.payload;
        state.searchResults = [];
      })
      .addCase(updatePrivacySettings.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.success = false;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.status = "succeeded";
        
        if (state.user) {
          state.user.settings = {
            ...state.user.settings,
            ...action.payload.data.privacySettings
          };
        }
        
        state.userPrivacySettings = action.payload.data.privacySettings.showLastActive;
        state.success = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const {
  logout,
  resetAuthError,
  resetAuthSuccess,
  setToken,
  setUser,
  clearAuthState,
  clearResetPasswordStatus,
  resetUsersStatus,
  clearUsers,
  clearSearchResults,
  updateUserVIPStatus
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthSuccess = (state) => state.auth.success;
export const selectRequiresVerification = (state) =>
  state.auth.requiresVerification;
export const selectRequiresProfileCompletion = (state) =>
  state.auth.requiresProfileCompletion;
export const selectOnboardingComplete = (state) =>
  state.auth.onboardingComplete;
export const selectResendStatus = (state) => state.auth.status;
export const selectResendLoading = (state) =>
  state.auth.status === "resend_loading";
export const selectResendSuccess = (state) =>
  state.auth.status === "resend_succeeded" && state.auth.success;
export const selectIsEmailVerified = (state) =>
  state.auth?.user?.isEmailVerified || false;
export const selectIsProfileComplete = (state) =>
  state.auth?.user?.profileComplete || false;
export const selectProfilePicture = (state) =>
  state.auth?.user?.profilePicture || null;
export const selectMorePictures = (state) =>
  state.auth?.user?.more_pictures || [];
export const selectAllUsers = (state) => state.auth.users;
export const selectUsersPagination = (state) => state.auth.usersPagination;
export const selectUsersStatus = (state) => state.auth.status;
export const selectUsersError = (state) => state.auth.error;
export const selectUsersLoading = (state) => state.auth.status === "loading";
export const selectUserProfile = (state) => state.auth.userProfile;
export const selectUserProfileStatus = (state) => state.auth.userProfileStatus;
export const selectUserProfileError = (state) => state.auth.userProfileError;
export const selectDistance = (state) => state.auth.distance;
export const selectDistanceFormatted = (state) => state.auth.distanceFormatted;
export const selectCompatibilityScore = (state) => state.auth.compatibilityScore;
export const selectUserProfileLoading = (state) => 
  state.auth.userProfileStatus === "loading";
export const selectSearchResults = (state) => state.auth.searchResults;
export const selectSearchPagination = (state) => state.auth.searchPagination;
export const selectSearchParams = (state) => state.auth.searchParams;
export const selectSearchStatus = (state) => state.auth.searchStatus;
export const selectSearchError = (state) => state.auth.searchError;
export const selectSearchLoading = (state) => state.auth.searchStatus === "loading";
export const selectPrivacySettings = (state) => 
  state.auth.user?.settings || {};
export const selectShowLastActive = (state) => {
  if (state.auth.user?.settings?.showLastActive !== undefined) {
    return state.auth.user.settings.showLastActive;
  }
  
  if (state.auth.userPrivacySettings !== undefined) {
    return state.auth.userPrivacySettings;
  }
  
  if (state.auth.user?.privacySettings?.showLastActive !== undefined) {
    return state.auth.user.privacySettings.showLastActive;
  }

  return true;
};

export const selectUserPrivacySettings = (state) => 
  state.auth.userPrivacySettings || {};

export const selectUserProfileSettings = (state) => 
  state.auth.userProfile?.settings || {};

export const selectCurrentUserId = createSelector(
  [selectAuth],
  (auth) => auth.user?._id || null
);

export const selectCurrentUser = createSelector(
  [selectAuth],
  (auth) => auth.user || null
);

export default authSlice.reducer;