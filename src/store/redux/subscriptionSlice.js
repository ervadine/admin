import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import SubscriptionService from "../services/SubscriptionService";
import { createSelector } from "@reduxjs/toolkit";

// Error handling utility
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

// Async Thunks
export const createSubscription = createAsyncThunk(
  "subscription/createSubscription",
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.createSubscription(subscriptionData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getCurrentSubscription = createAsyncThunk(
  "subscription/getCurrentSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.getCurrentSubscription();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const updateSubscriptionPlan = createAsyncThunk(
  "subscription/updateSubscriptionPlan", 
  async (planData, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.updateSubscriptionPlan(planData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancelSubscription",
  async (cancelData = {}, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.cancelSubscription(cancelData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const reactivateSubscription = createAsyncThunk(
  "subscription/reactivateSubscription",
  async (reactivateData = {}, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.reactivateSubscription(reactivateData);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getPaymentMethods = createAsyncThunk(
  "subscription/getPaymentMethods",
  async (_, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.getPaymentMethods();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const createSetupIntent = createAsyncThunk(
  "subscription/createSetupIntent",
  async (_, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.createSetupIntent();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getInvoices = createAsyncThunk(
  "subscription/getInvoices",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.getInvoices(params);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const confirmSubscriptionPayment = createAsyncThunk(
  "subscription/confirmSubscriptionPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await SubscriptionService.confirmSubscriptionPayment(paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getSubscriptionById = createAsyncThunk(
  "subscription/getSubscriptionById",
  async (subscriptionId, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.getSubscriptionById(subscriptionId);
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

export const getUserSubscriptions = createAsyncThunk(
  "subscriptions/getUserSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const data = await SubscriptionService.getUserSubscriptions();
      return data;
    } catch (error) {
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

const initialState = {
  // Subscription data
  currentSubscription: null,
  userSubscriptions: [],
  paymentMethods: [],
  invoices: [],
  setupIntent: null,

  // Loading states
  loading: false,
  creating: false,
  updating: false,
  canceling: false,
  reactivating: false,
  confirming: false,
  loadingPaymentMethods: false,
  creatingSetupIntent: false,
  loadingInvoices: false,
  loadingSubscriptions: false,

  // Error states
  error: null,
  createError: null,
  updateError: null,
  cancelError: null,
  reactivateError: null,
  confirmError: null,
  paymentMethodsError: null,
  setupIntentError: null,
  invoicesError: null,
  subscriptionsError: null,

  // Success states
  createSuccess: false,
  updateSuccess: false,
  cancelSuccess: false,
  reactivateSuccess: false,
  confirmSuccess: false,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearSubscriptionState: (state) => {
      Object.assign(state, initialState);
    },
    clearSubscriptionData: (state) => {
      state.currentSubscription = null;
      state.userSubscriptions = [];
      state.paymentMethods = [];
      state.invoices = [];
      state.setupIntent = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.cancelError = null;
      state.reactivateError = null;
      state.confirmError = null;
      state.paymentMethodsError = null;
      state.setupIntentError = null;
      state.invoicesError = null;
      state.subscriptionsError = null;
    },
    resetCreateSuccess: (state) => {
      state.createSuccess = false;
      state.createError = null;
    },
    clearSuccess: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.cancelSuccess = false;
      state.reactivateSuccess = false;
      state.confirmSuccess = false;
    },
    setSubscriptionFromWebhook: (state, action) => {
      state.currentSubscription = action.payload;
      state.confirmSuccess = true;
      state.confirmError = null;
      state.createSuccess = true;
      state.createError = null;
    },
    resetConfirmSuccess: (state) => {
      state.confirmSuccess = false;
      state.confirmError = null;
    },
    updateCurrentSubscription: (state, action) => {
      if (state.currentSubscription) {
        state.currentSubscription = {
          ...state.currentSubscription,
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Subscription
      .addCase(createSubscription.pending, (state) => {
        state.creating = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
  state.creating = false;
  state.createSuccess = true;
  state.currentSubscription = action.payload.data?.subscription || null;
  state.setupIntent = action.payload.data?.clientSecret
    ? {
        clientSecret: action.payload.data.clientSecret,
        requiresAction: action.payload.data.requiresAction,
        paymentIntentId: action.payload.data.paymentIntentId,
        subscriptionId: action.payload.data.subscriptionId // Make sure this is included
      }
    : null;
})
      .addCase(createSubscription.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      })

      // Get Current Subscription
      .addCase(getCurrentSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload?.subscription || null;
      })
      .addCase(getCurrentSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentSubscription = null;
      })

      // Update Subscription Plan
      .addCase(updateSubscriptionPlan.pending, (state) => {
        state.updating = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.currentSubscription = action.payload.data?.subscription || state.currentSubscription;
      })
      .addCase(updateSubscriptionPlan.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })

      // Cancel Subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.canceling = true;
        state.cancelError = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.canceling = false;
        state.cancelSuccess = true;
        state.currentSubscription = action.payload.data?.subscription || state.currentSubscription;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.canceling = false;
        state.cancelError = action.payload;
      })

      // Reactivate Subscription
      .addCase(reactivateSubscription.pending, (state) => {
        state.reactivating = true;
        state.reactivateError = null;
        state.reactivateSuccess = false;
      })
      .addCase(reactivateSubscription.fulfilled, (state, action) => {
        state.reactivating = false;
        state.reactivateSuccess = true;
        state.currentSubscription = action.payload.data?.subscription || state.currentSubscription;
      })
      .addCase(reactivateSubscription.rejected, (state, action) => {
        state.reactivating = false;
        state.reactivateError = action.payload;
      })

      // Get Payment Methods
      .addCase(getPaymentMethods.pending, (state) => {
        state.loadingPaymentMethods = true;
        state.paymentMethodsError = null;
      })
      .addCase(getPaymentMethods.fulfilled, (state, action) => {
        state.loadingPaymentMethods = false;
        state.paymentMethods = action.payload.data?.paymentMethods || [];
      })
      .addCase(getPaymentMethods.rejected, (state, action) => {
        state.loadingPaymentMethods = false;
        state.paymentMethodsError = action.payload;
      })

      // Create Setup Intent
      .addCase(createSetupIntent.pending, (state) => {
        state.creatingSetupIntent = true;
        state.setupIntentError = null;
      })
      .addCase(createSetupIntent.fulfilled, (state, action) => {
        state.creatingSetupIntent = false;
        state.setupIntent = {
          clientSecret: action.payload.data?.clientSecret,
          setupIntentId: action.payload.data?.setupIntentId
        };
      })
      .addCase(createSetupIntent.rejected, (state, action) => {
        state.creatingSetupIntent = false;
        state.setupIntentError = action.payload;
      })

      // Get Invoices
      .addCase(getInvoices.pending, (state) => {
        state.loadingInvoices = true;
        state.invoicesError = null;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.loadingInvoices = false;
        state.invoices = action.payload.data?.invoices || [];
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.loadingInvoices = false;
        state.invoicesError = action.payload;
      })

      // Confirm Subscription Payment
      .addCase(confirmSubscriptionPayment.pending, (state) => {
        state.confirming = true;
        state.confirmError = null;
        state.confirmSuccess = false;
      })
      .addCase(confirmSubscriptionPayment.fulfilled, (state, action) => {
        state.confirming = false;
        state.confirmSuccess = true;
        
        if (action.payload.data?.subscription) {
          state.currentSubscription = action.payload.data.subscription;
        }
        
        state.createSuccess = true;
        state.createError = null;
      })
      .addCase(confirmSubscriptionPayment.rejected, (state, action) => {
        state.confirming = false;
        state.confirmError = action.payload;
      })

      // Get Subscription by ID
      .addCase(getSubscriptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionById.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally store the specific subscription if needed
      })
      .addCase(getSubscriptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get User Subscriptions
      .addCase(getUserSubscriptions.pending, (state) => {
        state.loadingSubscriptions = true;
        state.subscriptionsError = null;
      })
      .addCase(getUserSubscriptions.fulfilled, (state, action) => {
        state.loadingSubscriptions = false;
        state.userSubscriptions = action.payload.data?.subscriptions || [];
      })
      .addCase(getUserSubscriptions.rejected, (state, action) => {
        state.loadingSubscriptions = false;
        state.subscriptionsError = action.payload;
      });
  },
});

export const {
  clearSubscriptionState,
  clearSubscriptionData,
  clearErrors,
  clearSuccess,
  resetCreateSuccess,
  resetConfirmSuccess,
  setSubscriptionFromWebhook,
  updateCurrentSubscription
} = subscriptionSlice.actions;

// Selectors
export const selectSubscription = (state) => state.subscription.currentSubscription;
export const selectUserSubscriptions = (state) => state.subscription.userSubscriptions;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectSubscriptionCreating = (state) => state.subscription.creating;
export const selectSubscriptionUpdating = (state) => state.subscription.updating;
export const selectSubscriptionCanceling = (state) => state.subscription.canceling;
export const selectSubscriptionReactivating = (state) => state.subscription.reactivating;
export const selectSubscriptionConfirming = (state) => state.subscription.confirming;
export const selectSubscriptionConfirmError = (state) => state.subscription.confirmError;
export const selectSubscriptionConfirmSuccess = (state) => state.subscription.confirmSuccess;

export const selectPaymentMethods = (state) => state.subscription.paymentMethods;
export const selectPaymentMethodsLoading = (state) => state.subscription.loadingPaymentMethods;

export const selectSetupIntent = (state) => state.subscription.setupIntent;
export const selectSetupIntentCreating = (state) => state.subscription.creatingSetupIntent;

export const selectInvoices = (state) => state.subscription.invoices;
export const selectInvoicesLoading = (state) => state.subscription.loadingInvoices;

export const selectSubscriptionsLoading = (state) => state.subscription.loadingSubscriptions;

// Combined selectors
export const selectSubscriptionErrors = createSelector(
  [
    state => state.subscription.error,
    state => state.subscription.createError,
    state => state.subscription.updateError,
    state => state.subscription.cancelError,
    state => state.subscription.reactivateError,
    state => state.subscription.confirmError,
    state => state.subscription.paymentMethodsError,
    state => state.subscription.setupIntentError,
    state => state.subscription.invoicesError,
    state => state.subscription.subscriptionsError
  ],
  (error, createError, updateError, cancelError, reactivateError, confirmError, paymentMethodsError, setupIntentError, invoicesError, subscriptionsError) => ({
    error,
    createError,
    updateError,
    cancelError,
    reactivateError,
    confirmError,
    paymentMethodsError,
    setupIntentError,
    invoicesError,
    subscriptionsError
  })
);

export const selectSubscriptionSuccess = createSelector(
  [
    state => state.subscription.createSuccess,
    state => state.subscription.updateSuccess,
    state => state.subscription.cancelSuccess,
    state => state.subscription.reactivateSuccess,
    state => state.subscription.confirmSuccess
  ],
  (createSuccess, updateSuccess, cancelSuccess, reactivateSuccess, confirmSuccess) => ({
    createSuccess,
    updateSuccess,
    cancelSuccess,
    reactivateSuccess,
    confirmSuccess
  })
);

// Memoized selectors
export const selectActiveSubscription = createSelector(
  [selectSubscription],
  (subscription) => {
    if (!subscription) return null;

    const isActive =
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      (subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) > new Date());

    return isActive ? subscription : null;
  }
);

export const selectIsVIP = createSelector(
  [selectActiveSubscription],
  (activeSubscription) => !!activeSubscription
);

export const selectHasActiveSubscription = createSelector(
  [selectActiveSubscription],
  (activeSubscription) => !!activeSubscription
);

export default subscriptionSlice.reducer;