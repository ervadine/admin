import api from "../api/appApi";

class ReportService {
  // Create a new report
  async createReport(reportData) {
    try {
      const response = await api.post('/reports/create-reports', reportData);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get all reports (admin only)
  async getAllReports(params = {}) {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get current user's reports
  async getMyReports(params = {}) {
    try {
      const response = await api.get('/reports/my-reports', { params });
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get report by ID
  async getReportById(reportId) {
    try {
      const response = await api.get(`/reports/report/${reportId}`);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Update report status (admin only)
  async updateReportStatus(reportId, statusData) {
    try {
      const response = await api.put(`/reports/report/${reportId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Delete report (admin only)
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/reports/delete-report/${reportId}`);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get report statistics (admin only)
  async getReportStatistics() {
    try {
      const response = await api.get('/reports/report/stats/statistics');
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Reply to user report (admin only)
  async replyToReport(reportId, replyData) {
    try {
      const response = await api.post(`/reports/report/${reportId}/reply`, replyData);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get report conversation
  async getReportConversation(reportId) {
    try {
      const response = await api.get(`/reports/report/${reportId}/conversation`);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Get report with replies
  async getReportWithReplies(reportId) {
    try {
      const response = await api.get(`/reports/report/${reportId}/replies`);
      return response.data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  // Error handling
  handleError(error) {
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
  }
}

export default new ReportService();