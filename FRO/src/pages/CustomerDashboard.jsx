/** @format */

import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { email } = useParams();

  const [customerSession, setCustomerSession] = useState(null);
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [timer, setTimer] = useState(180);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [status, setStatus] = useState();
  const [Bank, setBank] = useState();

  // ✅ interval IDs ko state me mat rakho → useRef
  const timerIntervalRef = useRef(null);
  const statusPollingRef = useRef(null);

  // ✅ checkAuth & polling
  useEffect(() => {
    if (!checkAuth()) {
      return;
    }

    // Load initial data
    loadApplicationDetails();

    // Poll every 10 seconds
    statusPollingRef.current = setInterval(() => {
      loadApplicationDetails();
    }, 10000);

    return () => {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const checkAuth = () => {
    const session = localStorage.getItem("customerSession");
    if (!session) {
      navigate("/customer-login");
      return false;
    }
    const parsedSession = JSON.parse(session);
    setCustomerSession(parsedSession);
    loadApplicationDetails();
    return true;
  };

  const loadApplicationDetails = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      const response = await fetch(
        `${apiBase}/api/getApplication/email/${encodeURIComponent(email)}`
      );
      const result = await response.json();

      if (response.ok) {
        const enhancedDetails = {
          ...result,
          approved: !!result.approved,
          rejected: !!result.rejected,
          agreementSent: !!result.agreementSent,
          oneTimeFeePaid: !!result.oneTimeFeePaid,
        };
        setApplicationDetails(enhancedDetails);
      }
    } catch (err) {
      console.error("Error loading application:", err);
    }
  };

  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    axios
      .get(`${apiBase}/api/getApplication/${encodeURIComponent(email)}`)
      .then((res) => {
        setStatus(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [email, applicationDetails]);

  useEffect(() => {
    // Normalize bank fields from different sources (AssignedBank vs BankDetails)
    const normalizeBank = (raw) => {
      if (!raw) return null;
      return {
        accountHolderName: raw.accountHolderName || raw.accountHolder || raw.holderName || "",
        accountNumber: raw.accountNumber || raw.acNumber || raw.accNo || "",
        ifscCode: raw.ifscCode || raw.IFSC || raw.ifsc || "",
        bankName: raw.bankName || raw.bank || "",
        bankBranch: raw.bankBranch || raw.branchName || raw.bankBranchName || "",
        qrCode: raw.qrCode || raw.qr || "",
      };
    };

    const fetchAssignedBank = async (customerEmail) => {
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      try {
        const res = await axios.get(`${apiBase}/api/getAssignedBank/${encodeURIComponent(customerEmail)}`);
        if (res.data && res.data.success && res.data.bankDetails) {
          setBank(normalizeBank(res.data.bankDetails));
          return;
        }
      } catch (err) {
        // no assigned bank for this customer
        console.debug("Assigned bank not found for customer, falling back to global bank details");
      }

      try {
        const res2 = await axios.get(`${apiBase}/api/bankDetails`);
        if (res2.data && res2.data.success && Array.isArray(res2.data.data) && res2.data.data.length > 0) {
          const latest = res2.data.data[0];
          setBank(normalizeBank(latest));
          return;
        }
      } catch (err) {
        console.error("Error fetching fallback bank details:", err);
      }

      // Final fallback: try to read bank from applicationDetails keys
      if (applicationDetails) {
        if (applicationDetails.bank) setBank(normalizeBank(applicationDetails.bank));
        else if (applicationDetails.assignedBank) setBank(normalizeBank(applicationDetails.assignedBank));
      }
    };

    const customerEmail = applicationDetails?.email || email;
    if (customerEmail) fetchAssignedBank(customerEmail);
  }, [email, applicationDetails]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handlePayNow = () => {
    setShowPaymentModal(true);
    startTimer();
  };

  const startTimer = () => {
    let timeLeft = 180;
    setTimer(timeLeft);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      timeLeft--;
      setTimer(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerIntervalRef.current);
        setShowPaymentModal(false);
        showMessage("Payment session expired. Please try again.", "error");
      }
    }, 1000);
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!customerSession) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white shadow-lg py-3 sm:py-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <img
              src="https://www.valmo.in/static-assets/valmo-web/valmo-logo-white.svg"
              alt="Valmo Logo"
              className="h-6 sm:h-8 filter invert"
            />
          </div>
          <button
            onClick={handlePayNow}
            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-transform duration-200 ease-in-out text-sm sm:text-base"
          >
            <i className="fas fa-credit-card mr-2"></i>
            Pay Now
          </button>
        </div>
      </header>

      {/* Main Content - Dark themed customer portal */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Dark Banner */}
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-xl sm:text-2xl font-semibold">
                  Application No. {applicationDetails?.applicationNumber || applicationDetails?.customerId || applicationDetails?._id}
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                  Welcome, {applicationDetails?.fullName || customerSession.email} - View your application!
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <img src="/images/valmo-logo.svg" alt="logo" className="h-8" />
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="bg-gray-800 text-gray-100 rounded-xl shadow-lg p-6 mb-6">
            {applicationDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-300">Name: <span className="text-white font-medium">{applicationDetails.fullName}</span></p>
                  <p className="text-sm text-gray-300 mt-2">Email: <span className="text-white font-medium">{applicationDetails.email}</span></p>
                  <p className="text-sm text-gray-300 mt-2">Phone: <span className="text-white font-medium">{applicationDetails.mobileNumber}</span></p>
                  <p className="text-sm text-gray-300 mt-2">Address: <span className="text-white">{applicationDetails.residentialStreet}, {applicationDetails.residentialCity}, {applicationDetails.residentialState} - {applicationDetails.residentialPinCode}</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Franchise Type: <span className="text-white font-medium">{applicationDetails.businessType || 'STANDARD MODEL'}</span></p>
                  <p className="text-sm text-gray-300 mt-2">Investment Capacity: <span className="text-white">{applicationDetails.investmentCapacity}</span></p>
                  <p className="text-sm text-gray-300 mt-2">Application Date: <span className="text-white">{applicationDetails.createdAt ? new Date(applicationDetails.createdAt).toLocaleDateString() : '-'}</span></p>
                  <p className="text-sm mt-2">
                    Status: <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${applicationDetails.status === 'approved' ? 'bg-green-600 text-white' : applicationDetails.status === 'agreement' ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-white'}`}>
                      {applicationDetails.status || 'Pending'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-400">Loading your application details...</p>
              </div>
            )}
          </div>

          {/* Bank Details & Approval Letter */}
          <div className="bg-gray-900 text-gray-100 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{Bank?.companyName || 'Bank Details'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 font-medium">Account Number</td>
                    <td className="py-2">{Bank?.accountNumber || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 font-medium">IFSC Code</td>
                    <td className="py-2">{Bank?.ifscCode || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 font-medium">Branch Name</td>
                    <td className="py-2">{Bank?.bankBranch || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Bank Name</td>
                    <td className="py-2">{Bank?.bankName || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approval letter download removed per request. */}
          </div>

          {/* Map / Preview */}
          <div className="bg-gray-800 text-gray-100 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Location Preview</h3>
            <div className="w-full h-64 bg-gray-700 rounded overflow-hidden">
              {applicationDetails?.franchisePinCode ? (
                <iframe
                  title="map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(applicationDetails.franchisePinCode + ' ' + (applicationDetails.residentialCity||''))}&output=embed`}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Map not available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md sm:max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {/* Payment / QR or Bank Section */}
            {Bank?.qrCode ? (
              <>
                {/* Offer Section */}
                <div className="bg-gray-50 p-4 rounded-xl shadow-sm space-y-2 text-sm text-gray-800 inline-block text-left w-full">
                  {status.data.status === "approved" ? (
                    <>
                      <p>
                        📝 Kindly pay your booking fee of{" "}
                        <strong>₹18,600</strong>.
                      </p>
                      <p>
                        🔥 <strong>Offer:</strong> If you pay through PhonePe,
                        pay only{" "}
                        <span className="text-green-600 font-semibold">
                          ₹16,999
                        </span>
                        !
                      </p>
                      <p>
                        💸 Save{" "}
                        <span className="font-semibold text-green-600">
                          ₹1,601
                        </span>{" "}
                        by choosing PhonePe!
                      </p>
                      <p>📱 PhonePe = ₹16,999</p>
                      <p>💳 Other = ₹18,600</p>
                      <p className="text-red-600 font-medium">
                        ⏳ Hurry! Limited time offer.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        📝 Kindly pay your Agreement Fee of{" "}
                        <strong>₹90,100</strong>.
                      </p>
                      <p>
                        🔥 <strong>Offer:</strong> If you pay through PhonePe,
                        pay only{" "}
                        <span className="text-green-600 font-semibold">
                          ₹88,500
                        </span>
                        !
                      </p>
                      <p>
                        💸 Save{" "}
                        <span className="font-semibold text-green-600">
                          ₹1,600
                        </span>{" "}
                        by choosing PhonePe!
                      </p>
                      <div className="border-t border-gray-300 pt-2 space-y-1">
                        <p className="font-semibold">📌 Payment Details:</p>
                        <p>💼 Regular Fee = ₹90,100</p>
                        <p>📱 PhonePe Payment = ₹88,500</p>
                      </div>
                      <p className="text-red-600 font-medium">
                        ⏳ Hurry! Limited Time Offer
                      </p>
                    </>
                  )}
                </div>

                {/* QR Code Section */}
                <div className="text-center my-6">
                  <div className="w-full max-w-xs h-64 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <img
                      src={Bank.qrCode}
                      alt="QR Code"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Scan this QR code to pay
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Bank Details Section */}
                <div className="bg-gray-50 p-4 rounded-xl shadow-sm space-y-1 text-sm text-gray-800 inline-block text-left w-full mt-6">
                  <p className="font-semibold text-lg justify-center items-center flex flex-col mb-2">
                    Bank Details:
                  </p>
                  <p>
                    🏦 Bank Name: <strong>{Bank.bankName}</strong>
                  </p>
                  <p>
                    👤 A/C Holder: <strong>{Bank.accountHolderName}</strong>
                  </p>
                  <p>
                    🔢 A/C No.: <strong>{Bank.accountNumber}</strong>
                  </p>
                  <p>
                    🆔 IFSC Code: <strong>{Bank.ifscCode}</strong>
                  </p>
                  <p>
                    🏛 Branch: <strong>{Bank.bankBranch}</strong>
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Use these details to complete your payment.
                  </p>
                </div>
                <div className="text-sm inline-block mt-2">
                  📌 Note:💳 After payment, please send the screenshot/UTR 📸 to
                  your Valmo Agent via WhatsApp 💬/Email 📧 for verification ✅
                </div>
              </>
            )}

            {/* Timer */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Payment expires in{" "}
                <span className="font-semibold text-red-600">
                  {formatTimer(timer)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
