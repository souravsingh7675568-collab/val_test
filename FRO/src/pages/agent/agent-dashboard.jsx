/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const AgentDashboard = () => {
  const { agentName } = useParams();

  const navigate = useNavigate();
  const [agentData, setAgentData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [agent, setAgent] = useState();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    pincode: "",
  });
  const [pincodes, setPincodes] = useState([""]); // For multiple pincodes
  const [pincodeLocations, setPincodeLocations] = useState({}); // Store locations for each pincode
  const [editFormData, setEditFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    pincode: "",
  });
  const [editLocation, setEditLocation] = useState("");
  const [editSelectedLocations, setEditSelectedLocations] = useState([]);
  const [location, setLocation] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredApplications(applications);
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = applications.filter((application) => {
        const n = (application.name || "").toLowerCase();
        const p = String(application.phoneNumber || "").toLowerCase();
        const l = (application.location || "").toLowerCase();
        const e = (application.email || "").toLowerCase();
        return n.includes(q) || p.includes(q) || l.includes(q) || e.includes(q);
      });
      setFilteredApplications(filtered);
    }
  }, [searchTerm, applications]);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/agent/${agentName}`
        );
        const result = await res.json(); // check karo console me
        setAgent(result.agent); // kyunki backend se "agent" object ke andar aa rha hai
        // After resolving agent, load only applications for this agent
        try {
          const identifier =
            result.agent?.agentId || result.agent?.email || result.agent?.name;
          if (identifier) {
            loadApplications(identifier);
          } else {
            loadApplications();
          }
        } catch (e) {
          console.error("Failed to load applications for agent:", e);
          loadApplications();
        }
      } catch (error) {
        console.error("Error fetching agent:", error);
      }
    };

    fetchAgent();
  }, [agentName]);

  const checkAuth = () => {
    const userType = localStorage.getItem("userType");
    if (userType !== "agent") {
      navigate("/multi-login");
      return;
    }
    const userId = localStorage.getItem("userId");
    setAgentData({ userId });
  };

  // ---------- Load applications with backend status ----------
  const loadApplications = async (agentIdentifierParam) => {
    setLoading(true);
    try {
      // Prefer explicit parameter (passed from fetchAgent) to avoid timing issues
      const agentIdentifier =
        agentIdentifierParam || agent?.agentId || agent?.email || agent?.name;
      const url = agentIdentifier
        ? `${API_BASE}/application?agentId=${encodeURIComponent(agentIdentifier)}`
        : `${API_BASE}/application`;
      const response = await fetch(url);
      const result = await response.json();
      if (response.ok && result.success) {
        const applicationsWithStatus = (result.data || []).map((app) => ({
          ...app,
          phoneNumber: app.phoneNumber || "N/A",
          location: app.location || "N/A",
          approved: app.status === "approved",
          rejected: app.status === "rejected",
          agreementSent: app.status === "agreementSent",
        }));
        setApplications(applicationsWithStatus);
        setFilteredApplications(applicationsWithStatus);
      } else {
        console.error("Failed to load applications:", result?.message);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleDeleteApplication = async (applicationId) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        const response = await fetch(
          `${API_BASE}/application/${applicationId}`,
          {
            method: "DELETE",
          }
        );
        const result = await response.json();
        if (response.ok && result.success) {
          setApplications((prev) =>
            prev.filter((app) => app._id !== applicationId)
          );
          setFilteredApplications((prev) =>
            prev.filter((app) => app._id !== applicationId)
          );
          alert("Application deleted successfully!");
        } else {
          alert(
            "Failed to delete application: " +
              (result?.message || "Unknown error")
          );
        }
      } catch (err) {
        console.error("Error deleting application:", err);
        alert("Error deleting application: " + err.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "pincode" && value.length === 6) fetchLocation(value);
  };

  const handlePincodeChange = (index, value) => {
    const newPincodes = [...pincodes];
    newPincodes[index] = value;
    setPincodes(newPincodes);

    // Fetch location for the pincode when it has 6 digits
    if (value.length === 6) {
      fetchLocation(value);
    } else if (value.length < 6) {
      // If pincode is being edited and is now less than 6 digits, remove its location
      setPincodeLocations((prev) => {
        const newLocations = { ...prev };
        delete newLocations[value];
        updateCombinedLocation();
        return newLocations;
      });
    }
  };

  const addPincodeField = () => {
    setPincodes([...pincodes, ""]);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "pincode" && value.length === 6) fetchEditLocation(value);
  };

  const fetchLocation = async (pincode) => {
    try {
      // Use the public postal pincode API directly to avoid relying on backend
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === "Success") {
        const postOffices = data[0].PostOffice || [];
        const locationStrings = postOffices.map((po) => po.Name);
        setPincodeLocations((prev) => ({
          ...prev,
          [pincode]: locationStrings.join(" | "),
        }));
      }
    } catch (err) {
      console.error("Error fetching pincode:", err);
    }
  };

  // Function to update the combined location from all pincode locations
  const updateCombinedLocation = () => {
    const allLocations = Object.values(pincodeLocations)
      .filter((loc) => loc) // Filter out empty locations
      .join(" | ");
    setLocation(allLocations);
  };

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

  const toggleLocationSelection = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const selectAllLocations = () => {
    if (location) setSelectedLocations(location.split(" | "));
  };

  useEffect(() => {
    const allLocations = Object.values(pincodeLocations)
      .filter((loc) => loc)
      .join(" | ");
    setLocation(allLocations);
    if (allLocations) {
      // Auto-select all areas for convenience so submit becomes enabled
      setSelectedLocations(allLocations.split(" | "));
    } else {
      setSelectedLocations([]);
    }
  }, [pincodeLocations]);

  const deselectAllLocations = () => setSelectedLocations([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingProposal(true);
    // Make sure we have the latest combined location
    updateCombinedLocation();

    const locationToSend =
      selectedLocations.length > 0 ? selectedLocations.join(" | ") : location;
    // Combine all pincodes into a single string
    const pincodesString = pincodes
      .filter((pin) => pin.trim() !== "")
      .join(", ");

    const newProposal = {
      ...formData,
      pincode: pincodesString,
      location: locationToSend,
      AgentName: agent.name,
      Contact: agent.phone,
    };

    // Build full proposal details (same format as Copy) to send to backend
    const pincodeForDetails = pincodesString || formData.pincode || "";
    const details = `\n\n\n\n\n\n    👋 ${newProposal.name},\n\n💥 Greetings from Valmo Logistics! 🚛📦\nAs India’s leading logistics partner, we pride ourselves on delivering reliable, fast, and cost-effective shipping solutions—ensuring smooth and efficient deliveries at the lowest cost.\n\n🔥 Great News! Your preferred location and PIN code are available for a Valmo Franchise Partnership—an incredible chance to join one of India’s fastest-growing logistics companies!\n\n✨ Why Partner with Valmo?\n✅ 🚀 9+ lakh orders shipped daily\n✅ 👥 30,000+ delivery executives\n✅ 🤝 3,000+ partners\n✅ 🌐 6,000+ PIN codes served\n\n\n📍 Preferred Location & PIN Code Availability 1 :\n🔹 PIN Code:  ${pincodeForDetails}\n🔹 Location:  ${newProposal.location}\n\n🔥 Franchise Opportunities & Earnings 💰\n\n💼 1. Basic Model\n💸 Total Investment: ₹1,08,700\n🔹 ₹18,600 ➡ Registration charge for PIN code booking\n🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)\n\n📦 Earnings:\n💰 ₹30 per shipment (300 products/day commitment)\n❌ ₹7 per parcel if cancelled at your warehouse or office\n🚪 ₹15 per parcel if a customer cancels on the doorstep\n\n🚚 2. FOCO Model (Full Company Ownership)\n💸 Total Investment: ₹3,08,700\n🔹 ₹18,600 ➡ Registration charge for PIN code booking\n🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)\n🔹 ₹2,00,000 ➡ Security deposit (refundable when you exit the franchise)\n\n📦 Earnings:\n💰 ₹30 per shipment (300 products/day commitment)\n❌ ₹7 per parcel if cancelled at your warehouse or office\n🚪 ₹15 per parcel if a customer cancels on the doorstep\n\n⭐ Additional Benefits in FOCO Model:\n👩‍💼 3 employees provided by Valmo (salaries covered by the company, approx. ₹15,000/month per employee)\n🏢 50% rent & electricity bill covered by the company\n💻 Office setup with company-designed interiors\n🖥 All necessary equipment provided (barcode machine + 3 laptops with accessories)\n\n📑 Required Documents:\n🪪 Aadhar Card / Voter ID\n🛡 PAN Card\n🏦 Bank Account Details\n📸 Location Images\n🖼 Passport-size Photograph\n\n📌 How to Proceed:\n✅ The application form is available online—upload all required documents directly through the form.\n✨ 👉 http://localhost:3000/form?email=${encodeURIComponent(newProposal.email || "")}&fullName=${encodeURIComponent(newProposal.name || "")}&mobileNumber=${encodeURIComponent(newProposal.phoneNumber || "")}&franchisePinCode=${encodeURIComponent(newProposal.pincode || "")}&location=${encodeURIComponent(newProposal.location || "")} 👈 ✨\n\n📲 For More Details, Contact Us:\n📞 ${agent.phone}  \n📧 hello@valmodeliver.in\n\n📍 Office Address:\n🏢 3rd Floor, Wing-E, Helios Business Park, Kadubeesanahalli Village, Varthur Hobli, Outer Ring Road, Bellandur, Bangalore South, Karnataka, India, 560103\n\n🚀 We look forward to a successful partnership with you and are excited to grow together!\n\n✨ Best Regards,\n🤝 ${agent.name}\n💼 Business Development Team\n🚛 Valmo Logistics`;

    // attach details to payload so backend can use it as email body
    newProposal.details = details;

    try {
      const response = await fetch(`${API_BASE}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProposal),
      });
      if (response.ok) {
        // Removed copy link functionality as per manager's request
        alert("Proposal created successfully!");
        setFormData({ name: "", phoneNumber: "", email: "", pincode: "" });
        setPincodes([""]);
        setPincodeLocations({});
        setLocation("");
        setSelectedLocations([]);
        setIsModalOpen(false);
        loadApplications();
      } else {
        const err = await response.json().catch(() => ({}));
        alert("Error: " + (err.message || "Failed"));
        setFormData({ name: "", phoneNumber: "", email: "", pincode: "" });
        setPincodes([""]);
        setPincodeLocations({});
        setLocation("");
        setSelectedLocations([]);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
      setFormData({ name: "", phoneNumber: "", email: "", pincode: "" });
      setPincodes([""]);
      setPincodeLocations({});
      setLocation("");
      setSelectedLocations([]);
      setIsModalOpen(false);
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationToSend =
        editSelectedLocations.length > 0
          ? editSelectedLocations.join(" | ")
          : editLocation;
      const formDataToSend = { ...editFormData, location: locationToSend };
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
            ? { ...app, ...formDataToSend }
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

  const handleResetForm = () => {
    setFormData({ name: "", phoneNumber: "", email: "", pincode: "" });
    setPincodes([""]);
    setPincodeLocations({});
    setLocation("");
    setSelectedLocations([]);
    setIsModalOpen(false);
    loadApplications();
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleCopyProposal = (application) => {
    const pincode =
      application.pincode ||
      application.Pincode ||
      application.residentialPinCode;
    // Create a formatted message with the proposal details that would be sent in an email
    let proposalDetails = `





    👋 ${application.name},

💥 Greetings from Valmo Logistics! 🚛📦
As India’s leading logistics partner, we pride ourselves on delivering reliable, fast, and cost-effective shipping solutions—ensuring smooth and efficient deliveries at the lowest cost.

🔥 Great News! Your preferred location and PIN code are available for a Valmo Franchise Partnership—an incredible chance to join one of India’s fastest-growing logistics companies!

✨ Why Partner with Valmo?
✅ 🚀 9+ lakh orders shipped daily
✅ 👥 30,000+ delivery executives
✅ 🤝 3,000+ partners
✅ 🌐 6,000+ PIN codes served


📍 Preferred Location & PIN Code Availability 1 :
🔹 PIN Code:  ${pincode}
🔹 Location:  ${application.location}

🔥 Franchise Opportunities & Earnings 💰

💼 1. Basic Model
💸 Total Investment: ₹1,08,700
🔹 ₹18,600 ➡ Registration charge for PIN code booking
🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)

📦 Earnings:
💰 ₹30 per shipment (300 products/day commitment)
❌ ₹7 per parcel if cancelled at your warehouse or office
🚪 ₹15 per parcel if a customer cancels on the doorstep

🚚 2. FOCO Model (Full Company Ownership)
💸 Total Investment: ₹3,08,700
🔹 ₹18,600 ➡ Registration charge for PIN code booking
🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)
🔹 ₹2,00,000 ➡ Security deposit (refundable when you exit the franchise)

📦 Earnings:
💰 ₹30 per shipment (300 products/day commitment)
❌ ₹7 per parcel if cancelled at your warehouse or office
🚪 ₹15 per parcel if a customer cancels on the doorstep

⭐ Additional Benefits in FOCO Model:
👩‍💼 3 employees provided by Valmo (salaries covered by the company, approx. ₹15,000/month per employee)
🏢 50% rent & electricity bill covered by the company
💻 Office setup with company-designed interiors
🖥 All necessary equipment provided (barcode machine + 3 laptops with accessories)

📑 Required Documents:
🪪 Aadhar Card / Voter ID
🛡 PAN Card
🏦 Bank Account Details
📸 Location Images
🖼 Passport-size Photograph

📌 How to Proceed:
✅ The application form is available online—upload all required documents directly through the form.
✨ 👉 https://valmo-frontend.vercel.app/form 👈 ✨

📲 For More Details, Contact Us:
📞 ${agent.phone}  
📧 hello@valmodeliver.in

📍 Office Address:
🏢 3rd Floor, Wing-E, Helios Business Park, Kadubeesanahalli Village, Varthur Hobli, Outer Ring Road, Bellandur, Bangalore South, Karnataka, India, 560103

🚀 We look forward to a successful partnership with you and are excited to grow together!

✨ Best Regards,
🤝 ${agent.name}
💼 Business Development Team
🚛 Valmo Logistics`;

    navigator.clipboard
      .writeText(proposalDetails)
      .then(() => {
        alert("Proposal details copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy proposal details");
      });
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
                VALMO Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">
                Welcome{agentData?.userId ? `, ${agentData.userId}` : ", Agent"}
              </span>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Agent Dashboard
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage and review franchise applications
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-file-contract text-xl sm:text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              Create Proposal
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
              Help customers submit new franchise proposals
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Create Proposal
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fas fa-list text-xl sm:text-2xl text-green-600"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              All Applications
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
              View all franchise applications
            </p>
            <button
              onClick={() => navigate(`/agent-applications/${agentName}`)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              View All
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Recent Proposals
            </h3>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by name, phone, email, or location..."
                className="pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <i className="fas fa-search absolute left-2.5 top-2 sm:top-2.5 text-gray-400 text-xs sm:text-sm"></i>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-spinner fa-spin text-xl sm:text-2xl text-gray-400 mb-3 sm:mb-4"></i>
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant Name
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted Date
                      </th>
                      <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {application.name}
                          <div className="text-xs text-gray-500">
                            {application.phoneNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {application.email}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              application.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : application.status === "one-time-fee"
                                ? "bg-red-100 text-red-800"
                                : application.status === "agreementSent"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {application.status
                              ? application.status.charAt(0).toUpperCase() +
                                application.status.slice(1)
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
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs text-gray-500">
                          <button
                            onClick={() => handleCopyProposal(application)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Proposal Modal */}
      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Proposal
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    name: "",
                    phoneNumber: "",
                    email: "",
                    pincode: "",
                  });
                  setPincodes([""]);
                  setPincodeLocations({});
                  setLocation("");
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Scrollable Content */}
              <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
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
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincodes
                  </label>
                  {pincodes.map((pincode, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) =>
                          handlePincodeChange(index, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Pincode ${index + 1}`}
                      />
                      {index === pincodes.length - 1 && (
                        <button
                          type="button"
                          onClick={addPincodeField}
                          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {location && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Areas ({location.split(" | ").length} total)
                      </label>
                      <button
                        type="button"
                        onClick={selectAllLocations}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Select All
                      </button>
                    </div>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-1">
                        {location.split(" | ").map((area, index) => (
                          <div
                            key={index}
                            className={`py-1 text-sm cursor-pointer rounded px-2 ${
                              selectedLocations.includes(area)
                                ? "bg-blue-500 text-white"
                                : "hover:bg-gray-200"
                            }`}
                            onClick={() => toggleLocationSelection(area)}
                          >
                            {area}
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedLocations.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: {selectedLocations.length} area(s)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-white flex-shrink-0 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingProposal || selectedLocations.length === 0
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isCreatingProposal ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                          d="M4 12a8 8 0 018-8V0C5.373 
                       0 0 5.373 0 12h4zm2 
                       5.291A7.962 7.962 0 014 12H0c0 
                       3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
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

            {/* Form */}
            <form
              onSubmit={handleEditSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Scrollable Content */}
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editFormData.phoneNumber}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={editFormData.pincode}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Areas */}
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

              {/* Sticky Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-white flex-shrink-0">
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
    </div>
  );
};

export default AgentDashboard;
