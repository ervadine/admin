import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ReportService from "../services/reportService";
import { createSelector } from "@reduxjs/toolkit";

// Async thunks
export const createReport = createAsyncThunk(
  'reports/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await ReportService.createReport(reportData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMyReports = createAsyncThunk(
  'reports/getMyReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ReportService.getMyReports(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAllReports = createAsyncThunk(
  'reports/getAllReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ReportService.getAllReports(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getReportById = createAsyncThunk(
  'reports/getReportById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await ReportService.getReportById(reportId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReportStatus = createAsyncThunk(
  'reports/updateReportStatus',
  async ({ reportId, statusData }, { rejectWithValue }) => {
    try {
      const response = await ReportService.updateReportStatus(reportId, statusData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await ReportService.deleteReport(reportId);
      return { ...response, reportId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getReportStatistics = createAsyncThunk(
  'reports/getReportStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ReportService.getReportStatistics();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const replyToReport = createAsyncThunk(
  'reports/replyToReport',
  async ({ reportId, replyData }, { rejectWithValue }) => {
    try {
      const response = await ReportService.replyToReport(reportId, replyData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getReportConversation = createAsyncThunk(
  'reports/getReportConversation',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await ReportService.getReportConversation(reportId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Reports data
  reports: [],
  myReports: [],
  currentReport: null,
  statistics: null,
  conversation: [],
  
  // Loading states
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  fetchingStats: false,
  replying: false,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  
  // Filters
  filters: {
    problem_type: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  // Errors
  error: null,
  createError: null,
  updateError: null
};

// Report slice
const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
    },
    
    // Clear current report
    clearCurrentReport: (state) => {
      state.currentReport = null;
      state.conversation = [];
    },
    
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        problem_type: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
    },
    
    // Reset state
    resetReports: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Create Report
      .addCase(createReport.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload.data?.report) {
          state.myReports.unshift(action.payload.data.report);
        }
      })
      .addCase(createReport.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      })
      
      // Get My Reports
      .addCase(getMyReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyReports.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.reports) {
          state.myReports = action.payload.data.reports;
        }
        if (action.payload.data?.pagination) {
          state.pagination = action.payload.data.pagination;
        }
      })
      .addCase(getMyReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get All Reports (Admin)
      .addCase(getAllReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReports.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.reports) {
          state.reports = action.payload.data.reports;
        }
        if (action.payload.data?.pagination) {
          state.pagination = action.payload.data.pagination;
        }
      })
      .addCase(getAllReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Report By ID
      .addCase(getReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReportById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.report) {
          state.currentReport = action.payload.data.report;
        }
      })
      .addCase(getReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Report Status
      .addCase(updateReportStatus.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        state.updating = false;
        const updatedReport = action.payload.data?.report;
        
        if (updatedReport) {
          // Update in reports array
          const reportIndex = state.reports.findIndex(r => r._id === updatedReport._id);
          if (reportIndex !== -1) {
            state.reports[reportIndex] = updatedReport;
          }
          
          // Update in myReports array
          const myReportIndex = state.myReports.findIndex(r => r._id === updatedReport._id);
          if (myReportIndex !== -1) {
            state.myReports[myReportIndex] = updatedReport;
          }
          
          // Update current report if it's the one being updated
          if (state.currentReport && state.currentReport._id === updatedReport._id) {
            state.currentReport = updatedReport;
          }
        }
      })
      .addCase(updateReportStatus.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })
      
      // Delete Report
      .addCase(deleteReport.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.deleting = false;
        const deletedReportId = action.payload.reportId;
        
        // Remove from reports array
        state.reports = state.reports.filter(r => r._id !== deletedReportId);
        
        // Remove from myReports array
        state.myReports = state.myReports.filter(r => r._id !== deletedReportId);
        
        // Clear current report if it's the one being deleted
        if (state.currentReport && state.currentReport._id === deletedReportId) {
          state.currentReport = null;
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })
      
      // Get Report Statistics
      .addCase(getReportStatistics.pending, (state) => {
        state.fetchingStats = true;
        state.error = null;
      })
      .addCase(getReportStatistics.fulfilled, (state, action) => {
        state.fetchingStats = false;
        state.statistics = action.payload.data;
      })
      .addCase(getReportStatistics.rejected, (state, action) => {
        state.fetchingStats = false;
        state.error = action.payload;
      })
      
      // Reply to Report
      .addCase(replyToReport.pending, (state) => {
        state.replying = true;
        state.error = null;
      })
      .addCase(replyToReport.fulfilled, (state, action) => {
        state.replying = false;
        if (action.payload.data?.report) {
          state.currentReport = action.payload.data.report;
        }
      })
      .addCase(replyToReport.rejected, (state, action) => {
        state.replying = false;
        state.error = action.payload;
      })
      
      // Get Report Conversation
      .addCase(getReportConversation.fulfilled, (state, action) => {
        if (action.payload.data?.conversation) {
          state.conversation = action.payload.data.conversation;
        }
      });
  }
});

// Export actions
export const {
  clearError,
  clearCurrentReport,
  setFilters,
  clearFilters,
  resetReports
} = reportSlice.actions;

// Selectors with safe fallbacks
export const selectReports = (state) => state.reports?.reports || [];
export const selectMyReports = (state) => state.reports?.myReports || [];
export const selectCurrentReport = (state) => state.reports?.currentReport || null;
export const selectStatistics = (state) => state.reports?.statistics || null;
export const selectConversation = (state) => state.reports?.conversation || [];
export const selectLoading = (state) => state.reports?.loading || false;
export const selectCreating = (state) => state.reports?.creating || false;
export const selectUpdating = (state) => state.reports?.updating || false;
export const selectDeleting = (state) => state.reports?.deleting || false;
export const selectReplying = (state) => state.reports?.replying || false;
export const selectFetchingStats = (state) => state.reports?.fetchingStats || false;
export const selectPagination = (state) => state.reports?.pagination || initialState.pagination;
export const selectFilters = (state) => state.reports?.filters || initialState.filters;
export const selectError = (state) => state.reports?.error || null;
export const selectCreateError = (state) => state.reports?.createError || null;
export const selectUpdateError = (state) => state.reports?.updateError || null;

// Memoized selectors
export const selectReportById = createSelector(
  [selectReports, (state, reportId) => reportId],
  (reports, reportId) => reports.find(report => report._id === reportId)
);

export const selectReportsByStatus = createSelector(
  [selectReports, (state, status) => status],
  (reports, status) => reports.filter(report => report.status === status)
);

export const selectReportsByProblemType = createSelector(
  [selectReports, (state, problemType) => problemType],
  (reports, problemType) => reports.filter(report => report.problem_type === problemType)
);

export default reportSlice.reducer;