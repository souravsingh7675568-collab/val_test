/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const AgentApplications = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  console.log("filteredApplication", filteredApplications);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  // Loading states for action buttons
  const [approvingApplications, setApprovingApplications] = useState(new Set());
  const [agreementApplications, setAgreementApplications] = useState(new Set());
  const [rejectingApplications, setRejectingApplications] = useState(new Set());
  // Bank selection state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [availableBanks, setAvailableBanks] = useState();
  console.log("avilable", availableBanks);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(false);
  // Edit application state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [Agent, setAgent] = useState();
  console.log("Agent", Agent);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    pincode: "",
  });
  const [editLocation, setEditLocation] = useState("");
  const [editSelectedLocations, setEditSelectedLocations] = useState([]);

  // Check if user is agent
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "agent") {
      navigate("/multi-login");
      return;
    }
    fetchApplications();
  }, []);

  // Fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/getApplication`);
      setApplications(res.data.data || []);
      setFilteredApplications(res.data.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      alert("Failed to fetch applications ❌");
    } finally {
      setLoading(false);
    }
  };

  const callApi = async (url, payload) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      const msg = data?.message || "Request failed";
      throw new Error(msg);
    }
    return data;
  };

  const optimisticUpdate = (email, name, patch) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.email === email && app.fullName === name ? { ...app, ...patch } : app
      )
    );
    setFilteredApplications((prev) =>
      prev.map((app) =>
        app.email === email && app.fullName === name ? { ...app, ...patch } : app
      )
    );
  };

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`${API_BASE}/agent/${agentId}`);
        const result = await res.json();
        console.log("Agent Data:", result); // check karo console me
        setAgent(result.agent); // kyunki backend se "agent" object ke andar aa rha hai
      } catch (error) {
        console.error("Error fetching agent:", error);
      }
    };

    fetchAgent();
  }, [agentId]);

  const handleApprove = async (appObj) => {
    // Add to approving set
    setApprovingApplications((prev) =>
      new Set([...prev, `${appObj.email}-${appObj.fullName}`])
    );

    optimisticUpdate(appObj.email, appObj.fullName, {
      approved: true,
      rejected: false,
    });
    try {
      await callApi(`${API_BASE}/application/approve`, {
        email: appObj.email,
        name: appObj.fullName,
        agentName: Agent.name,
        agentContact: Agent.phone,
      });
      fetchApplications();
      alert("Approval mail sent ✅");
    } catch (err) {
      optimisticUpdate(appObj.email, appObj.fullName, { approved: false });
      alert("Approve failed: " + err.message);
    } finally {
      // Remove from approving set
      setApprovingApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${appObj.email}-${appObj.fullName}`);
        return newSet;
      });
    }
  };

  const handleReject = async (appObj) => {
    // Add to rejecting set
    setRejectingApplications((prev) =>
      new Set([...prev, `${appObj.email}-${appObj.fullName}`])
    );

    optimisticUpdate(appObj.email, appObj.fullName, {
      rejected: true,
      approved: false,
    });
    try {
      await callApi(`${API_BASE}/application/one-time-fee`, {
        email: appObj.email,
        name: appObj.fullName,
        agentName: Agent.name,
        agentContact: Agent.phone,
      });
      fetchApplications();
      alert("Rejected successfully ✅");
    } catch (err) {
      optimisticUpdate(appObj.email, appObj.fullName, { rejected: false });
      alert("Reject failed: " + err.message);
    } finally {
      // Remove from rejecting set
      setRejectingApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${appObj.email}-${appObj.fullName}`);
        return newSet;
      });
    }
  };

  const handleAgreement = async (appObj) => {
    // Add to agreement set
    setAgreementApplications((prev) =>
      new Set([...prev, `${appObj.email}-${appObj.fullName}`])
    );

    optimisticUpdate(appObj.email, appObj.fullName, { agreementSent: true });
    try {
      await callApi(`${API_BASE}/application/agreement`, {
        email: appObj.email,
        name: appObj.fullName,
        agentName: Agent.name,
        agentContact: Agent.phone,
      });
      fetchApplications();
      alert("Agreement mail sent ✅");
    } catch (err) {
      optimisticUpdate(appObj.email, appObj.fullName, { agreementSent: false });
      alert("Agreement failed: " + err.message);
    } finally {
      // Remove from agreement set
      setAgreementApplications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${appObj.email}-${appObj.fullName}`);
        return newSet;
      });
    }
  };

  // Search and filter applications
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredApplications(applications);
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = applications.filter((application) => {
        const name = (application.fullName || "").toLowerCase();
        const email = (application.email || "").toLowerCase();
        const phone = String(application.mobileNumber || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
      setFilteredApplications(filtered);
    }
  }, [searchTerm, applications]);

  // View Application
  const handleViewApplication = (applicationId) => {
    // Navigate to view application page (expects DB _id)
    navigate(`/view-application/${encodeURIComponent(applicationId)}`);
  };

  // Edit Application
  const handleEditApplication = (applicationId) => {
    // Navigate to edit page by DB _id
    navigate(`/edit-application/${encodeURIComponent(applicationId)}`);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationToSend =
        editSelectedLocations.length > 0
          ? editSelectedLocations.join(" | ")
          : editLocation;
      const formDataToSend = {
        ...editFormData,
        location: locationToSend,
        residentialPinCode: editFormData.pincode,
      };

      // Remove the pincode field since we're using residentialPinCode
      delete formDataToSend.pincode;

      const response = await fetch(
        `${API_BASE}/application/${editingApplication._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataToSend),
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        alert("Application updated successfully!");
        const updatedApplications = applications.map((app) =>
          app._id === editingApplication._id
            ? {
                ...app,
                ...formDataToSend,
                fullName: editFormData.name,
                mobileNumber: editFormData.phoneNumber,
              }
            : app
        );
        setApplications(updatedApplications);
        setFilteredApplications(updatedApplications);
        setIsEditModalOpen(false);
        setEditingApplication(null);
      } else {
        alert(
          "Failed to update application: " +
            (result?.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error updating application: " + err.message);
    }
  };

  const loadAvailableBanks = async () => {
    try {
      setLoadingBanks(true);
      const response = await axios.get(`${API_BASE}/bankDetails`);

      let data = response.data.data;

      // ✅ force array
      if (Array.isArray(data)) {
        setAvailableBanks(data);
      } else if (data && typeof data === "object") {
        setAvailableBanks([data]); // wrap single object in array
      } else {
        setAvailableBanks([]);
      }
    } catch (error) {
      console.error("Error loading bank details:", error);
      alert("Failed to load bank details ❌");
      setAvailableBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleBankSelection = (application) => {
    setSelectedApplication(application);
    setIsBankModalOpen(true);
    loadAvailableBanks();
    // Reset selected banks
    setSelectedBanks([]);
  };

  const toggleBankSelection = (bankId) => {
    setSelectedBanks((prev) => {
      if (prev.includes(bankId)) {
        return prev.filter((id) => id !== bankId);
      } else {
        return [...prev, bankId];
      }
    });
  };

  const handleAssignBanks = async () => {
    try {
      // ✅ Case 1: QR Code selected
      if (selectedBanks.includes("qr_code")) {
        const qrRes = await fetch(`${API_BASE}/bankQr`);
        const qrData = await qrRes.json();

        const qrCodeValue = qrData?.data?.[0]?.qrCode;

        if (qrRes.ok && qrCodeValue) {
          const res = await fetch(`${API_BASE}/assignBankDetails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerEmail: selectedApplication.email, // required
              bankName: "", // dummy name
              accountNumber: "",
              ifscCode: "",
              bankBranch: "",
              accountHolderName: "",
              qrCode: qrCodeValue, // qr code link
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            alert("✅ QR code assigned successfully!");
            setIsBankModalOpen(false);
          } else {
            alert("❌ Failed: " + (data.message || "Error"));
          }
        } else {
          alert("⚠️ QR Code not found in API response");
        }
      } else {
        // ✅ Case 2: Banks selected
        const banksToAssign = availableBanks.filter((b) =>
          selectedBanks.includes(b._id)
        );

        for (const bank of banksToAssign) {
          const res = await fetch(`${API_BASE}/assignBankDetails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerEmail: selectedApplication.email, // required
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifscCode: bank.ifscCode,
              bankBranch: bank.bankBranch || "",
              accountHolderName: bank.accountHolderName,
              qrCode: "", // bank details case -> qr empty
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            alert("❌ Failed to assign " + bank.bankName);
            return;
          }
        }

        alert("✅ Bank(s) assigned successfully!");
        setIsBankModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong while assigning");
    }
  };

  // Edit helper functions
  const fetchEditLocation = async (pincode) => {
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === "Success") {
        const postOffices = data[0].PostOffice || [];
        setEditLocation(postOffices.map((po) => po.Name).join(" | "));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEditLocationSelection = (location) => {
    setEditSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const selectAllEditLocations = () => {
    if (editLocation) setEditSelectedLocations(editLocation.split(" | "));
  };

  const deselectAllEditLocations = () => setEditSelectedLocations([]);

  // Logout Function
  const logout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      <header className="bg-blue-600 shadow-md py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img
            src="/images/valmo-logo.svg"
            alt="VALMO"
            className="h-6 sm:h-8"
          />
          <h1 className="text-lg sm:text-xl font-bold">
            Application Management
          </h1>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-600 flex items-center"
          >
            <i className="fas fa-sign-out-alt mr-1 sm:mr-2" />
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 flex-grow">
        {/* Search Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-2xl font-semibold text-blue-600">
              <i className="fas fa-file-alt mr-1 sm:mr-2" />
              All Applications
            </h2>
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="w-full p-2 sm:p-3 pl-8 sm:pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-2 sm:left-3 top-2.5 sm:top-4 text-gray-400 text-xs sm:text-sm"></i>
            </div>
            <button
              onClick={fetchApplications}
              className="bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded hover:bg-green-600 flex items-center text-xs sm:text-sm"
            >
              <i className="fas fa-refresh mr-1 sm:mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Applications List Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-spinner fa-spin text-xl sm:text-2xl text-blue-600 mb-3 sm:mb-4"></i>
                <p className="text-gray-600 text-sm sm:text-base">
                  Loading applications...
                </p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-inbox text-3xl sm:text-4xl text-gray-400 mb-3 sm:mb-4"></i>
                <p className="text-gray-600 text-sm sm:text-base">
                  No applications found
                </p>
              </div>
            ) : (
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Applicant Name
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Email ID
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Phone
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Status
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Submitted Date
                    </th>
                    <th className="py-2 px-3 sm:py-3 sm:px-4 text-left font-medium text-gray-700 text-xs sm:text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr
                      key={application._id}
                      className="border-b hover:bg-gray-50 text-xs sm:text-sm"
                    >
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        {application.fullName}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        {application.email}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        {application.mobileNumber}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        <span
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                            application.approved
                              ? "bg-green-100 text-green-800"
                              : application.rejected
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {application.status == "approved"
                            ? "Approved"
                            : application.status == "agreement"
                            ? "Agreement"
                            : application.status == "one-time-fee"
                            ? "one-time-fee"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        {application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() =>
                              handleViewApplication(application._id)
                            }
                            className="text-blue-600 hover:text-blue-900 bg-gray-100 hover:bg-gray-200 p-1.5 sm:p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            title="View Application"
                          >
                            <i className="fas fa-eye text-xs sm:text-sm"></i>
                          </button>

                          <button
                            onClick={() =>
                              handleEditApplication(application._id)
                            }
                            className="text-yellow-600 hover:text-yellow-900 bg-gray-100 hover:bg-gray-200 p-1.5 sm:p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Edit Application"
                          >
                            <i className="fas fa-edit text-xs sm:text-sm"></i>
                          </button>

                          <button
                            onClick={() => handleBankSelection(application)}
                            className="text-green-600 hover:text-green-900 bg-gray-100 hover:bg-gray-200 p-1.5 sm:p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Select Bank"
                          >
                            <i className="fas fa-university text-xs sm:text-sm"></i>
                          </button>

                          <button
                            onClick={() => handleApprove(application)}
                            disabled={
                              application.approved ||
                              application.rejected ||
                              approvingApplications.has(
                                `${application.email}-${application.fullName}`
                              )
                            }
                            className={`px-2 py-1 text-xs rounded font-medium shadow-sm transition-all duration-200 ${
                              application.approved || application.rejected
                                ? "bg-green-500 text-white cursor-not-allowed opacity-75"
                                : approvingApplications.has(
                                    `${application.email}-${application.fullName}`
                                  )
                                ? "bg-green-500 text-white cursor-not-allowed opacity-75"
                                : "bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white hover:shadow-md"
                            }`}
                          >
                            {approvingApplications.has(
                              `${application.email}-${application.fullName}`
                            ) ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                                    5.291A7.962 7.962 0 014 12H0c0 
                                    3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Approving...
                              </>
                            ) : (
                              "Approve"
                            )}
                          </button>

                          <button
                            onClick={() => handleAgreement(application)}
                            disabled={
                              !application.approved ||
                              application.rejected ||
                              application.agreementSent ||
                              agreementApplications.has(
                                `${application.email}-${application.fullName}`
                              )
                            }
                            className={`px-2 py-1 text-xs rounded font-medium shadow-sm transition-all duration-200 ${
                              application.agreementSent || application.rejected
                                ? "bg-yellow-400 text-white cursor-not-allowed opacity-75"
                                : !application.approved
                                ? "bg-gray-200 text-gray-700 cursor-not-allowed opacity-75"
                                : agreementApplications.has(
                                    `${application.email}-${application.fullName}`
                                  )
                                ? "bg-yellow-400 text-white cursor-not-allowed opacity-75"
                                : "bg-gray-200 text-gray-700 hover:bg-yellow-400 hover:text-white hover:shadow-md"
                            }`}
                          >
                            {agreementApplications.has(
                              `${application.email}-${application.fullName}`
                            ) ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                                    5.291A7.962 7.962 0 014 12H0c0 
                                    3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Sending...
                              </>
                            ) : (
                              "Agreement"
                            )}
                          </button>

                          <button
                            onClick={() => handleReject(application)}
                            disabled={
                              !application.agreementSent ||
                              application.rejected ||
                              rejectingApplications.has(
                                `${application.email}-${application.fullName}`
                              )
                            }
                            className={`px-2 py-1 text-xs rounded font-medium shadow-sm transition-all duration-200 ${
                              application.rejected
                                ? "bg-red-500 text-white cursor-not-allowed opacity-75"
                                : !application.agreementSent
                                ? "bg-gray-200 text-gray-700 cursor-not-allowed opacity-75"
                                : rejectingApplications.has(
                                    `${application.email}-${application.fullName}`
                                  )
                                ? "bg-red-500 text-white cursor-not-allowed opacity-75"
                                : "bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white hover:shadow-md"
                            }`}
                          >
                            {rejectingApplications.has(
                              `${application.email}-${application.fullName}`
                            ) ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                                    5.291A7.962 7.962 0 014 12H0c0 
                                    3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              "One Time Fee"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Bank Selection Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Banks for {selectedApplication?.fullName}
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {loadingBanks ? (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin text-xl text-blue-600 mb-2"></i>
                  <p className="text-gray-600">Loading banks...</p>
                </div>
              ) : availableBanks.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-university text-2xl text-gray-400 mb-2"></i>
                  <p className="text-gray-600">No banks available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="qr_code"
                        checked={selectedBanks.includes("qr_code")}
                        onChange={() => toggleBankSelection("qr_code")}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label
                        htmlFor="qr_code"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        QR Code Payment
                      </label>
                    </div>
                  </div>
                  {availableBanks.map((bank) => (
                    <div key={bank._id} className="border rounded-lg p-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id={bank._id}
                          checked={selectedBanks.includes(bank._id)}
                          onChange={() => toggleBankSelection(bank._id)}
                          className="h-4 w-4 text-blue-600 rounded mt-1"
                        />
                        <label htmlFor={bank._id} className="ml-2">
                          <div className="font-medium text-sm">
                            {bank.bankName}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <div>Account: {bank.accountNumber}</div>
                            <div>Account Holder: {bank.accountHolderName}</div>
                            <div>IFSC: {bank.ifscCode}</div>
                            <div>UPI: {bank.upiId || "N/A"}</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignBanks}
                disabled={selectedBanks.length === 0 || loadingBanks}
                className={`px-4 py-2 rounded-md font-medium text-white ${
                  selectedBanks.length === 0 || loadingBanks
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Assign Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Application
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editFormData.phoneNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={editFormData.pincode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditFormData({ ...editFormData, pincode: value });
                      if (value.length === 6) fetchEditLocation(value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {editLocation && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Areas ({editLocation.split(" | ").length} total)
                      </label>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={selectAllEditLocations}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-1">
                        {editLocation.split(" | ").map((area, index) => (
                          <div
                            key={index}
                            className={`py-1 text-sm cursor-pointer rounded px-2 ${
                              editSelectedLocations.includes(area)
                                ? "bg-blue-500 text-white"
                                : "hover:bg-gray-200"
                            }`}
                            onClick={() => toggleEditLocationSelection(area)}
                          >
                            {area}
                          </div>
                        ))}
                      </div>
                    </div>
                    {editSelectedLocations.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: {editSelectedLocations.length} area(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-4 sm:py-6 mt-6 sm:mt-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm">
                © 2025 Valmo. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AgentApplications;
