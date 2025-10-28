import api from "../api/appApi";

const AuthService = {
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error || "Login failed";
    }
  },

  updatePrivacySettings: async (privacyData) => {
    try {
      const response = await api.put("/auth/show-last-active", privacyData);
      
      if (response.data && response.data.data?.privacySettings) {
        const currentUser = await AuthService.getUser();
        if (currentUser) {
          currentUser.settings = {
            ...currentUser.settings,
            ...response.data.data.privacySettings
          };
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  handleGoogleLogin: async (credentialResponse) => {
    try {
      const response = await api.post("/auth/google", {
        tokenId: credentialResponse.credential,
      });

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error || "Login failed";
    }
  },

  handleFacebookLogin: async (facebookResponse) => {
    try {
      const response = await api.post("/auth/facebook", {
        accessToken: facebookResponse.accessToken,
        userID: facebookResponse.userID,
      });

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error || "Login failed";
    }
  },

  verifyEmail: async (verificationData) => {
    try {
      const response = await api.post("/auth/verify-email", verificationData);

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.request) {
        throw new Error("Network error - unable to reach server");
      } else {
        throw error.response?.data?.message || error || "verification failed";
      }
    }
  },

  resendVerificationCode: async () => {
    try {
      const response = await api.post("/auth/resend-verification");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  completeProfile: async (profileData) => {
    try {
      const response = await api.post("/auth/complete-profile", profileData);

      if (response.data && response.data.account?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.account.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  editProfile: async (profileData) => {
    try {
      const response = await api.put("/auth/edit-profile", profileData);

      if (response.data && response.data.update?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.update.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  addPhotoProfile: async (imageData) => {
    try {
      const response = await api.put("/auth/upload-profile-picture", {
        imageData: {
          url: imageData.url,
          publicId: imageData.publicId,
        },
      });

      if (response.data && response.data?.data.profilePicture) {
        localStorage.setItem("user", JSON.stringify(response.data?.data.profilePicture));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  deleteImage: async (publicId) => {
    try {
      const response = await api.delete(`/auth/picture/${publicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await api.delete("/auth/delete-profile-picture");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  addMorePhotos: async (imagesData) => {
    try {
      const imagesArray = Array.isArray(imagesData) ? imagesData : [imagesData];

      const response = await api.put("/auth/upload-pictures", {
        imagesData: imagesArray.map((image) => ({
          url: image.url || image.secure_url,
          publicId: image.publicId || image.public_id,
          name: image.name || image.original_filename,
          size: image.size || image.bytes,
          mimeType: image.mimeType || image.format || "image/jpeg",
        })),
      });

      if (response.data && response.data.data?.uploadedImages) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  refreshToken: async (refreshTokenData) => {
    try {
      const response = await api.post("/auth/refresh-token", refreshTokenData);

      if (response.data && response.data.data?.token) {
        localStorage.setItem("token", response.data.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await api.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/auth/logout");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");

      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
      throw error.response?.data || error.message || error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await api.get(`/auth/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  updateLocation: async (locationData) => {
    try {
      const response = await api.put("/auth/location", locationData);

      if (response.data && response.data.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },

  initializeAuth: async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      return token;
    } catch (error) {
      console.error("Error initializing auth:", error);
      return null;
    }
  },

  getToken: async () => {
    try {
      return localStorage.getItem("token");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  getUser: async () => {
    try {
      const userString = localStorage.getItem("user");
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  getAllUsers: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/auth/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  isAuthenticated: async () => {
    try {
      const token = localStorage.getItem("token");
      return !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },

  clearAuth: async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
      delete api.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  },

  searchUsers: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== '') {
          queryParams.append(key, searchParams[key]);
        }
      });

      const response = await api.get(`/auth/search-users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || error;
    }
  },
};

export default AuthService;