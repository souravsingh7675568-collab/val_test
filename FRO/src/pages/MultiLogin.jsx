/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const MultiLogin = () => {
  const navigate = useNavigate();
  const [currentLoginType, setCurrentLoginType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const showLoginForm = (loginType) => {
    setCurrentLoginType(loginType);
    setShowForm(true);
    setFormData({ userId: "", password: "" });
    setMessage({ text: "", type: "" });
  };

  const showLoginTypeSelection = () => {
    setShowForm(false);
    setCurrentLoginType("");
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId || !formData.password) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Admin Hardcoded
      if (
        currentLoginType === "admin" &&
        formData.userId === "admin@gmail.com" &&
        formData.password === "admin@gmail.com"
      ) {
        showMessage("Login successful! Redirecting...", "success");

        localStorage.setItem("userType", "admin");
        localStorage.setItem("userId", "admin@gmail.com");

        setTimeout(() => {
          navigate("/admin/admin-home");
        }, 1500);

        return;
      }

      // Agent Login API
      const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      let endpoint = `${apiBase}/api/Agentlogin`;
      let requestBody =
        currentLoginType === "agent"
          ? {
              agentId: formData.userId,
              password: formData.password,
              userType: currentLoginType,
            }
          : {
              email: formData.userId,
              password: formData.password,
              userType: currentLoginType,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json();

      if (result.success || res.ok) {
        showMessage("Login successful! Redirecting...", "success");

        localStorage.setItem("userType", currentLoginType);
        localStorage.setItem("userId", result.userId);

        if (currentLoginType === "agent" && result.agentId) {
          localStorage.setItem("agentId", result.agentId);
        }

        if (currentLoginType === "admin") {
          setTimeout(() => navigate("/admin/admin-home"), 1500);
        } else if (currentLoginType === "agent") {
          const agentName = result?.agentId || "agent";
          setTimeout(
            () => navigate(`/agent/agent-dashboard/${agentName}`),
            1500
          );
        }
      } else {
        showMessage(result.message || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getLoginTitle = () => {
    switch (currentLoginType) {
      case "admin":
        return "Admin Login";
      case "agent":
        return "Agent Login";
      default:
        return "Login";
    }
  };

  const getUserIdLabel = () => {
    switch (currentLoginType) {
      case "admin":
        return "Email";
      case "agent":
        return "Agent ID";
      default:
        return "User ID";
    }
  };

  const getUserIdPlaceholder = () => {
    switch (currentLoginType) {
      case "admin":
        return "Enter your Email";
      case "agent":
        return "Enter your Agent ID";
      default:
        return "Enter your User ID";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
      }}
    >
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* LEFT IMAGE */}
        <div
          className="hidden lg:flex lg:w-1/2 items-center justify-center p-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%)",
          }}
        >
          <img
            src="/images/truck_image.png"
            alt="Valmo Truck"
            className="max-w-full h-auto"
          />
        </div>

        {/* RIGHT FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block bg-green-600 rounded-lg p-3 mb-4">
                <img
                  src="/images/valmo-logo.svg"
                  alt="VALMO Logo"
                  className="h-8"
                />
              </div>
              <p className="text-gray-600 text-sm">Welcome back !!</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {getLoginTitle()}
              </h2>
            </div>

            {/* Message */}
            {message.text && (
              <div
                className={`text-center py-3 mb-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Login Type Selection */}
            {!showForm && (
              <div className="space-y-4">
                <button
                  onClick={() => showLoginForm("admin")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md"
                >
                  Admin Login
                </button>
                <button
                  onClick={() => showLoginForm("agent")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition shadow-md"
                >
                  Agent Login
                </button>
              </div>
            )}

            {/* Login Form */}
            {showForm && (
              <>
                <button
                  onClick={showLoginTypeSelection}
                  className="text-blue-600 hover:underline text-sm mb-4"
                >
                  ← Back
                </button>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="userId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {getUserIdLabel()}
                    </label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: "1px solid #d1fae5",
                        backgroundColor: "#f0fdf4",
                      }}
                      placeholder={getUserIdPlaceholder()}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: "1px solid #d1fae5",
                        backgroundColor: "#f0fdf4",
                      }}
                      placeholder="Enter your Password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 text-white font-medium rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 text-lg"
                    style={{ background: "#1e293b" }}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 
                            0 5.373 0 12h4zm2 5.291A7.962 
                            7.962 0 014 12H0c0 3.042 1.135 
                            5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiLogin;
