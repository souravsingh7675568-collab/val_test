/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState({
    totalApplications: 0,
    totalProposals: 0,
    approvedApplications: 0,
    agreementSent: 0,
    oneTimeFeePaid: 0,
    applicationsByDate: [],
    applicationsByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState([]);

  // Check if user is admin
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "admin") {
      navigate("/multi-login");
      return;
    }
    loadReportData();
  }, []);

  // Load report data from APIs
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch applications data
      const applicationsRes = await fetch(
        "https://valmodeliver.in/api/getApplication"
      );
      const applicationsData = await applicationsRes.json();

      if (applicationsData.success) {
        const applications = applicationsData.data || [];
        setApplications(applications);

        // Calculate counts
        const totalApplications = applications.length;
        const approvedApplications = applications.filter(
          (app) => app.approved
        ).length;
        const agreementSent = applications.filter(
          (app) => app.agreementSent
        ).length;
        const oneTimeFeePaid = applications.filter(
          (app) => app.oneTimeFeePaid
        ).length;

        // For proposals, we'll assume they're the same as applications for now
        // In a real scenario, you might have a separate proposals endpoint
        const totalProposals = totalApplications;

        // Group applications by date for chart
        const applicationsByDate = {};
        const applicationsByStatus = {
          pending: 0,
          approved: 0,
          agreementSent: 0,
          oneTimeFeePaid: 0,
          rejected: 0,
        };

        applications.forEach((app) => {
          // Group by date
          const date = new Date(app.createdAt).toISOString().split("T")[0];
          applicationsByDate[date] = (applicationsByDate[date] || 0) + 1;

          // Group by status
          if (app.oneTimeFeePaid) {
            applicationsByStatus.oneTimeFeePaid++;
          } else if (app.agreementSent) {
            applicationsByStatus.agreementSent++;
          } else if (app.approved) {
            applicationsByStatus.approved++;
          } else if (app.rejected) {
            applicationsByStatus.rejected++;
          } else {
            applicationsByStatus.pending++;
          }
        });

        setReportData({
          totalApplications,
          totalProposals,
          approvedApplications,
          agreementSent,
          oneTimeFeePaid,
          applicationsByDate: Object.entries(applicationsByDate).map(
            ([date, count]) => ({ date, count })
          ),
          applicationsByStatus,
        });
      }
    } catch (err) {
      console.error("Error loading report data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Submitted Date",
      "Approved Date",
      "Agreement Sent Date",
      "Fee Paid Date",
    ];

    const csvContent = [
      headers.join(","),
      ...applications.map((app) =>
        [
          `"${app.fullName || ""}"`,
          `"${app.email || ""}"`,
          `"${app.mobileNumber || ""}"`,
          `"${
            app.oneTimeFeePaid
              ? "One Time Fee Paid"
              : app.agreementSent
              ? "Agreement Sent"
              : app.approved
              ? "Approved"
              : app.rejected
              ? "Rejected"
              : "Pending"
          }"`,
          `"${
            app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""
          }"`,
          `"${
            app.approvedAt ? new Date(app.approvedAt).toLocaleDateString() : ""
          }"`,
          `"${
            app.agreementSentAt
              ? new Date(app.agreementSentAt).toLocaleDateString()
              : ""
          }"`,
          `"${
            app.feePaidAt ? new Date(app.feePaidAt).toLocaleDateString() : ""
          }"`,
        ].join(",")
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `valmo_reports_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply filters to applications
  const getFilteredApplications = () => {
    let filtered = [...applications];

    // Apply date filter
    if (dateRange.startDate) {
      filtered = filtered.filter(
        (app) => new Date(app.createdAt) >= new Date(dateRange.startDate)
      );
    }

    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setDate(endDate.getDate() + 1); // Include end date
      filtered = filtered.filter((app) => new Date(app.createdAt) < endDate);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => {
        switch (statusFilter) {
          case "pending":
            return (
              !app.approved &&
              !app.agreementSent &&
              !app.oneTimeFeePaid &&
              !app.rejected
            );
          case "approved":
            return app.approved;
          case "agreement":
            return app.agreementSent;
          case "paid":
            return app.oneTimeFeePaid;
          case "rejected":
            return app.rejected;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.fullName && app.fullName.toLowerCase().includes(term)) ||
          (app.email && app.email.toLowerCase().includes(term)) ||
          (app.mobileNumber && app.mobileNumber.includes(term))
      );
    }

    return filtered;
  };

  // Get chart data for visualization
  const getChartData = () => {
    const data = reportData.applicationsByDate.slice(-30); // Last 30 days
    return data;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <img
                src="https://www.valmo.in/static-assets/valmo-web/valmo-logo-white.svg"
                alt="VALMO"
                className="h-6 sm:h-8 filter invert"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                VALMO Admin Reports
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm"
              >
                <i className="fas fa-sign-out-alt mr-1 sm:mr-2"></i>Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Reports & Analytics
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Detailed insights and statistics
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm flex items-center"
              >
                <i className="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="agreement">Agreement Sent</option>
                <option value="paid">One Time Fee Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by applicant name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-sm"></i>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setDateRange({ startDate: "", endDate: "" });
                setStatusFilter("all");
                setSearchTerm("");
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-xl sm:text-2xl text-blue-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Applications
                </p>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {reportData.totalApplications}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-contract text-xl sm:text-2xl text-purple-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Proposals
                </p>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {reportData.totalProposals}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-xl sm:text-2xl text-green-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {reportData.approvedApplications}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-signature text-xl sm:text-2xl text-yellow-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Agreement Sent
                </p>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {reportData.agreementSent}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-xl sm:text-2xl text-indigo-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  One Time Fee Paid
                </p>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {reportData.oneTimeFeePaid}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Applications Over Time
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
              </div>
            ) : (
              <div className="h-64 flex items-end space-x-1 overflow-x-auto">
                {getChartData().map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-shrink-0"
                  >
                    <div
                      className="w-6 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{
                        height: `${
                          getChartData().length > 0
                            ? Math.min(
                                100,
                                (item.count /
                                  Math.max(
                                    ...getChartData().map((d) => d.count)
                                  )) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                      title={`${item.date}: ${item.count} applications`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                      {new Date(item.date).getDate()}
                    </div>
                  </div>
                ))}
                {getChartData().length === 0 && (
                  <div className="text-gray-500 text-center w-full py-8">
                    No data available for the selected period
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Distribution
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden">
                  {
                    Object.entries(reportData.applicationsByStatus).reduce(
                      (acc, [status, count], index, arr) => {
                        if (count === 0) return acc;
                        const total = Object.values(
                          reportData.applicationsByStatus
                        ).reduce((sum, val) => sum + val, 0);
                        const percentage = (count / total) * 100;
                        const cumulativePercentage = acc.rotation;
                        const rotation = (cumulativePercentage / 100) * 360;

                        const segment = (
                          <div
                            key={status}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${
                                50 +
                                50 * Math.cos(((rotation - 90) * Math.PI) / 180)
                              }% ${
                                50 +
                                50 * Math.sin(((rotation - 90) * Math.PI) / 180)
                              }%, ${
                                50 +
                                50 *
                                  Math.cos(
                                    ((rotation +
                                      (percentage / 100) * 360 -
                                      90) *
                                      Math.PI) /
                                      180
                                  )
                              }% ${
                                50 +
                                50 *
                                  Math.sin(
                                    ((rotation +
                                      (percentage / 100) * 360 -
                                      90) *
                                      Math.PI) /
                                      180
                                  )
                              }%, 50% 0%)`,
                            }}
                          >
                            <div
                              className={`w-full h-full ${
                                status === "pending"
                                  ? "bg-yellow-500"
                                  : status === "approved"
                                  ? "bg-green-500"
                                  : status === "agreementSent"
                                  ? "bg-blue-500"
                                  : status === "oneTimeFeePaid"
                                  ? "bg-indigo-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                          </div>
                        );

                        return {
                          segments: [...acc.segments, segment],
                          rotation: cumulativePercentage + percentage,
                        };
                      },
                      { segments: [], rotation: 0 }
                    ).segments
                  }
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full border-4 border-white"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Report Section */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Detailed Report ({getFilteredApplications().length} applications)
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="text-gray-600 hover:text-gray-900 flex items-center text-sm"
              >
                <i className="fas fa-sync-alt mr-1"></i> Refresh Data
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-spinner fa-spin text-xl sm:text-2xl text-gray-400 mb-3 sm:mb-4"></i>
                <p className="text-gray-600 text-sm sm:text-base">
                  Loading report data...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-exclamation-triangle text-3xl sm:text-4xl text-red-400 mb-3 sm:mb-4"></i>
                <p className="text-red-600 text-sm sm:text-base">{error}</p>
                <button
                  onClick={loadReportData}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        Total Applications
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        100%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        Approved Applications
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.approvedApplications}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications > 0
                          ? (
                              (reportData.approvedApplications /
                                reportData.totalApplications) *
                              100
                            ).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        Agreement Sent
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.agreementSent}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications > 0
                          ? (
                              (reportData.agreementSent /
                                reportData.totalApplications) *
                              100
                            ).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        One Time Fee Paid
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.oneTimeFeePaid}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications > 0
                          ? (
                              (reportData.oneTimeFeePaid /
                                reportData.totalApplications) *
                              100
                            ).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        Pending Applications
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications -
                          reportData.approvedApplications -
                          reportData.agreementSent -
                          reportData.oneTimeFeePaid}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {reportData.totalApplications > 0
                          ? (
                              ((reportData.totalApplications -
                                reportData.approvedApplications -
                                reportData.agreementSent -
                                reportData.oneTimeFeePaid) /
                                reportData.totalApplications) *
                              100
                            ).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Application List */}
        <div className="bg-white rounded-lg shadow-lg mt-6">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Applications List
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-spinner fa-spin text-xl sm:text-2xl text-gray-400 mb-3 sm:mb-4"></i>
                <p className="text-gray-600 text-sm sm:text-base">
                  Loading applications...
                </p>
              </div>
            ) : getFilteredApplications().length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-inbox text-3xl sm:text-4xl text-gray-400 mb-3 sm:mb-4"></i>
                <p className="text-gray-600 text-sm sm:text-base">
                  No applications found with the selected filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredApplications().map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {application.fullName}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {application.email}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {application.mobileNumber}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              application.oneTimeFeePaid
                                ? "bg-indigo-100 text-indigo-800"
                                : application.agreementSent
                                ? "bg-yellow-100 text-yellow-800"
                                : application.approved
                                ? "bg-green-100 text-green-800"
                                : application.rejected
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {application.oneTimeFeePaid
                              ? "One Time Fee Paid"
                              : application.agreementSent
                              ? "Agreement Sent"
                              : application.approved
                              ? "Approved"
                              : application.rejected
                              ? "Rejected"
                              : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs text-gray-500">
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Application Status Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Approved</span>
                  <span>
                    {reportData.approvedApplications} (
                    {reportData.totalApplications > 0
                      ? (
                          (reportData.approvedApplications /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        reportData.totalApplications > 0
                          ? (reportData.approvedApplications /
                              reportData.totalApplications) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Agreement Sent</span>
                  <span>
                    {reportData.agreementSent} (
                    {reportData.totalApplications > 0
                      ? (
                          (reportData.agreementSent /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{
                      width: `${
                        reportData.totalApplications > 0
                          ? (reportData.agreementSent /
                              reportData.totalApplications) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>One Time Fee Paid</span>
                  <span>
                    {reportData.oneTimeFeePaid} (
                    {reportData.totalApplications > 0
                      ? (
                          (reportData.oneTimeFeePaid /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        reportData.totalApplications > 0
                          ? (reportData.oneTimeFeePaid /
                              reportData.totalApplications) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pending</span>
                  <span>
                    {reportData.totalApplications -
                      reportData.approvedApplications -
                      reportData.agreementSent -
                      reportData.oneTimeFeePaid}{" "}
                    (
                    {reportData.totalApplications > 0
                      ? (
                          ((reportData.totalApplications -
                            reportData.approvedApplications -
                            reportData.agreementSent -
                            reportData.oneTimeFeePaid) /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gray-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        reportData.totalApplications > 0
                          ? ((reportData.totalApplications -
                              reportData.approvedApplications -
                              reportData.agreementSent -
                              reportData.oneTimeFeePaid) /
                              reportData.totalApplications) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="font-semibold">
                    {reportData.totalApplications > 0
                      ? (
                          (reportData.oneTimeFeePaid /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1) + "%"
                      : "0%"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-percentage text-blue-600"></i>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Approval Rate</p>
                  <p className="font-semibold">
                    {reportData.totalApplications > 0
                      ? (
                          (reportData.approvedApplications /
                            reportData.totalApplications) *
                          100
                        ).toFixed(1) + "%"
                      : "0%"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Avg. Applications/Day</p>
                  <p className="font-semibold">
                    {/* Calculate average applications per day */}
                    {reportData.applicationsByDate.length > 0
                      ? (
                          reportData.totalApplications /
                          reportData.applicationsByDate.length
                        ).toFixed(1)
                      : "0"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-purple-600"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReport;
