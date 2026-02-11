/** @format */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BankDetails1 = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [qrs, setQrs] = useState([]); // ✅ QR alag state
  const [editingBankId, setEditingBankId] = useState(null);
  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
  });
  const [qrFile, setQrFile] = useState(null); // ✅ Single QR upload ke liye
  const [status, setStatus] = useState("");

  // Check auth on component mount
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "admin") {
      navigate("/multi-login");
    }
  }, [navigate]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const logout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    navigate("/");
  };

  useEffect(() => {
    fetchBankDetails();
    fetchQrs();
  }, []);

  // ✅ Banks fetch
  const fetchBankDetails = async () => {
    try {
      const res = await axios.get("https://valmodeliver.in/api/bankDetails");
      if (res?.data?.success) {
        setBanks(res.data.data || []);
      } else {
        setBanks([]);
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
      setBanks([]);
    }
  };

  // ✅ QR fetch
  const fetchQrs = async () => {
    try {
      const res = await axios.get("https://valmodeliver.in/api/bankQr");
      if (res?.data?.success) {
        setQrs(res.data.data || []);
      } else {
        setQrs([]);
      }
    } catch (err) {
      console.error("Error fetching QR codes:", err);
      setQrs([]);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddBank = () => {
    setEditingBankId("new");
    setFormData({
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      upiId: "",
    });
  };

  const handleEditBank = (bank) => {
    setEditingBankId(bank._id);
    setFormData({
      accountHolderName: bank.accountHolderName || "",
      accountNumber: bank.accountNumber || "",
      ifscCode: bank.ifscCode || "",
      bankName: bank.bankName || "",
      branchName: bank.branchName || "",
      upiId: bank.upiId || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBankId(null);
    setFormData({
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      upiId: "",
    });
  };

  // ✅ Add / Update Bank
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus("Saving...");
      let res;
      if (editingBankId === "new") {
        res = await axios.post(
          "https://valmodeliver.in/api/add-bank",
          formData
        );
      } else {
        res = await axios.put(
          `https://valmodeliver.in/api/updateBank/${editingBankId}`,
          formData
        );
      }
      if (res?.data?.success) {
        alert("Bank details saved successfully ✅");
        fetchBankDetails();
        setEditingBankId(null);
        setStatus("Saved successfully!");
      } else {
        alert("Failed to save bank details ❌");
      }
    } catch (err) {
      console.error("Error saving bank details:", err);
      alert("Error saving bank details ❌");
    }
  };

  // ✅ Delete Bank
  const handleDeleteBank = async (bankId) => {
    if (!window.confirm("Are you sure you want to delete this bank?")) return;
    try {
      const res = await axios.delete(
        `https://valmodeliver.in/api/bankDetails/${bankId}`
      );
      if (res?.data?.success) {
        alert("Bank deleted successfully ✅");
        fetchBankDetails();
      } else {
        alert("Failed to delete bank ❌");
      }
    } catch (err) {
      console.error("Error deleting bank:", err);
    }
  };

  // ✅ Upload QR
  const handleQrUpload = async () => {
    if (!qrFile) {
      alert("Please select a QR file to upload.");
      return;
    }
    try {
      const data = new FormData();
      data.append("file", qrFile);

      const res = await axios.post("https://valmodeliver.in/api/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });

      if (res?.data?.success) {
        alert("QR uploaded successfully ✅");
        setQrFile(null);
        fetchQrs();
      } else {
        alert("Failed to upload QR ❌");
      }
    } catch (err) {
      console.error("Error uploading QR:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="bg-blue-600 shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={toggleDropdown}
              className="text-white hover:text-blue-200 flex items-center"
            >
              <i className="fas fa-bars mr-2" />
              Menu
              <i className="fas fa-chevron-down ml-2" />
            </button>
            {isDropdownOpen && (
              <ul className="absolute top-14 left-4 bg-white shadow-lg rounded w-48 z-50">
                <li>
                  <a
                    href="/admin/admin-home"
                    className="block px-4 py-2 hover:bg-gray-100 flex items-center"
                  >
                    <i className="fas fa-home mr-2" />
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/admin/admin-bank-details"
                    className="block px-4 py-2 hover:bg-gray-100 bg-blue-50 flex items-center"
                  >
                    <i className="fas fa-university mr-2" />
                    Bank Details
                  </a>
                </li>
              </ul>
            )}
          </div>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            <i className="fas fa-sign-out-alt mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 px-3 sm:px-6 lg:px-8">
        {/* ✅ Bank Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-700">
            Bank Details Management
          </h2>
          <button
            onClick={handleAddBank}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full sm:w-auto"
          >
            <i className="fas fa-plus mr-2"></i> Add Bank
          </button>
        </div>

        {/* Add/Edit Form */}
        {(editingBankId === "new" || editingBankId) && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Account Holder Name", name: "accountHolderName" },
                  { label: "Account Number", name: "accountNumber" },
                  { label: "IFSC Code", name: "ifscCode" },
                  { label: "Bank Name", name: "bankName" },
                  { label: "Branch Name", name: "branchName" },
                  { label: "UPI ID (Optional)", name: "upiId" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-gray-700">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="border rounded-lg w-full p-2 mt-1"
                      required={field.name !== "upiId"}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 mt-6 space-y-3 sm:space-y-0">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border rounded w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bank List */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Bank Accounts</h3>
          {banks.length === 0 ? (
            <p className="text-gray-500">No banks added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banks.map((bank) => (
                <div key={bank._id} className="border rounded-lg p-4">
                  <h4 className="font-bold">{bank.bankName}</h4>
                  <p>{bank.accountHolderName}</p>
                  <p>{bank.accountNumber}</p>
                  <p>{bank.ifscCode}</p>
                  <p>{bank.branchName}</p>
                  {bank.upiId && <p>{bank.upiId}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleEditBank(bank)}
                      className="bg-blue-500 text-white px-3 py-1 rounded w-full sm:w-auto"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBank(bank._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded w-full sm:w-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ QR Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-xl font-bold mb-4">QR Codes</h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setQrFile(e.target.files[0])}
              className="flex-1"
            />
            <button
              onClick={handleQrUpload}
              className="bg-purple-500 text-white px-3 py-2 rounded w-full sm:w-auto"
            >
              Upload QR
            </button>
          </div>

          {qrs.length === 0 ? (
            <p className="text-gray-500">No QR uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {qrs.map((qr) => (
                <div key={qr._id} className="border p-2 rounded">
                  <img
                    src={qr.qrCode}
                    alt="QR"
                    className="w-32 h-32 object-contain mx-auto"
                  />
                  <a
                    href={qr.qrCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-blue-500 mt-2 text-sm"
                  >
                    View Full
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {status && <p className="mt-4 text-center">{status}</p>}
      </main>
    </div>
  );
};

export default BankDetails1;
