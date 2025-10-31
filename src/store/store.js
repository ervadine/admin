import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Uses localStorage for web
import authReducer from './redux/authSlice';
import subscriptionReducer from './redux/subscriptionSlice';
import reportReducer from './redux/reportSlice'
// Persist configuration for auth
const authPersistConfig = {
  key: 'auth',
  storage: storage,
  timeout: null,
};

const reportConfig = {
  key: 'reports',
  storage: storage,
  timeout: null,
};


// Persist configuration for subscription
const subscriptionPersistConfig = {
  key: 'subscription',
  storage: storage,
  timeout: null,
  whitelist: [
    'currentSubscription', 
    'paymentMethods', 
    'invoices', 
    'setupIntent'
  ],
  blacklist: [
    'loading',
    'creating',
    'updating', 
    'canceling',
    'reactivating',
    'loadingPaymentMethods',
    'creatingSetupIntent',
    'loadingInvoices',
    'error',
    'createError',
    'updateError',
    'cancelError',
    'reactivateError',
    'paymentMethodsError',
    'setupIntentError',
    'invoicesError',
    'createSuccess',
    'updateSuccess',
    'cancelSuccess',
    'reactivateSuccess'
  ]
};




// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedSubscriptionReducer = persistReducer(subscriptionPersistConfig, subscriptionReducer);
const reportedReducer = persistReducer(reportConfig, reportReducer);
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    subscription: persistedSubscriptionReducer,
    reports: reportedReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // Subscription actions
          'subscription/createSubscription/fulfilled',
          'subscription/getCurrentSubscription/fulfilled',
          'subscription/updateSubscriptionPlan/fulfilled',
          'subscription/cancelSubscription/fulfilled',
          'subscription/reactivateSubscription/fulfilled',
          'subscription/getPaymentMethods/fulfilled',
          'subscription/createSetupIntent/fulfilled',
          'subscription/getInvoices/fulfilled',
          'subscription/confirmSubscriptionPayment',
        ],
        ignoredActionPaths: [
          'meta.arg', 
          'payload.timestamp',
          'payload.data.subscription.currentPeriodStart',
          'payload.data.subscription.currentPeriodEnd',
          'payload.data.subscription.createdAt',
          'payload.data.subscription.updatedAt',
          'payload.data.subscription.canceledAt',
          'payload.data.subscription.trialStart',
          'payload.data.subscription.trialEnd',
          // Block action paths
          'payload.data.blockedAt',
          'payload.data.unblockedAt',
          // Notification action paths
          'payload.data.device.lastActive',
          'payload.timestamp',
          'payload.data.notification.timestamp'
        ],
        ignoredPaths: [
          'subscription.currentSubscription.currentPeriodStart',
          'subscription.currentSubscription.currentPeriodEnd',
          'subscription.currentSubscription.createdAt',
          'subscription.currentSubscription.updatedAt',
          'subscription.currentSubscription.canceledAt',
          'subscription.currentSubscription.trialStart',
          'subscription.currentSubscription.trialEnd',
          'subscription.invoices.data.created',
          'subscription.invoices.data.period_start',
          'subscription.invoices.data.period_end',
        ],
      },
      immutableCheck: {
        ignoredPaths: [
          // Subscription paths
          'subscription.currentSubscription',
          'subscription.paymentMethods',
          'subscription.invoices',
        ],
      },
    }),
});

export const persistor = persistStore(store);