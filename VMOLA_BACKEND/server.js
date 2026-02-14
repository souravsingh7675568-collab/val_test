/** @format */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config");
const NewAgentModel = require("./models/NewAgentModel");
const Proposal = require("./models/ProposalModel");
const BankDetails = require("./models/BankDetailsModel");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cloudinary = require("./models/cloudinary");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ApplicationModel = require("./models/ApplicationModel");
const Customer = require("./models/CoustmerModel");
const CoustmerModel = require("./models/CoustmerModel");
const AssignedBank = require("./models/AssignedBankModel");
const BankQr = require("./models/BankQr");
dotenv.config();
connectDB();

const app = express();

// Explicit CORS headers for all requests (DEBUG - allow all)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Preflight request handling
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Only apply Cloudinary config from environment if all vars are present.
// This avoids accidentally overriding any programmatic/default config
// (e.g., values set directly in models/cloudinary.js) with undefined.
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary env vars not set — using existing Cloudinary configuration"
  );
}

/* ---------------- Multer Storage: Local Disk (Development) & Cloudinary (Production) ---------------- */
// For local development, use disk storage; for production, use Cloudinary
const appStorage = process.env.NODE_ENV === "production" 
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "franchise_applications",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
      },
    });

const applicationUpload = multer({ storage: appStorage });

// Also add path for serving static files locally
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Setup mailer: prefer real SMTP from env; otherwise create Ethereal test account
let transporter;
(async () => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
        secure: process.env.SMTP_SECURE === "true" || true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("Mailer configured using SMTP_HOST");
    } else {
      // Ethereal (development) fallback
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Ethereal test account created. Preview emails in console.");
    }
  } catch (err) {
    console.error("Failed to initialize mailer:", err);
    transporter = null;
  }
})();

app.get("/api", async (req, res) => {
  res.send("This is check");
});

// Temporary endpoint to reset application status for testing
app.post("/api/admin/reset-status", async (req, res) => {
  const { email, status } = req.body;
  
  if (!email || !status) {
    return res.status(400).json({
      success: false,
      message: "Email and status are required"
    });
  }

  try {
    const updated = await ApplicationModel.findOneAndUpdate(
      { email },
      { 
        status,
        approved: status === "approved" ? true : false,
        agreementSent: status === "agreement" ? true : false,
        oneTimeFeeMail: status === "one-time-fee" ? true : false,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    res.json({
      success: true,
      message: `Application status reset to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error("Reset status error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// List all applications for debugging
app.get("/api/admin/list-applications", async (req, res) => {
  try {
    const applications = await ApplicationModel.find().select("email fullName status approved agreementSent");
    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    console.error("List applications error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/api/agents", async (req, res) => {
  try {
    const { name, phone, agentId, email, password } = req.body;
    
    console.log("Creating agent with data:", { name, phone, agentId, email });

    const newAgent = new NewAgentModel({
      name,
      phone,
      agentId,
      email,
      password,
    });

    await newAgent.save();
    
    console.log("Agent created successfully:", newAgent);

    res.status(201).json({
      message: "Agent created successfully ✅",
      agent: newAgent,
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({
      message: "Error saving agent ❌",
      error: error.message,
    });
  }
});

// get agent by name (via URL param)
app.get("/api/agent/:value", async (req, res) => {
  try {
    const { value } = req.params;

    const agent = await NewAgentModel.findOne({
      $or: [{ agentId: value }, { email: value }],
    });

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found ❌" });
    }

    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agents", async (req, res) => {
  try {
    const agents = await NewAgentModel.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching agents ❌",
      error: error.message,
    });
  }
});

app.post("/api/Agentlogin", async (req, res) => {
  try {
    const { agentId, password, userType } = req.body;

    if (userType === "agent") {
      const agent = await NewAgentModel.findOne({ agentId, password });
      console.log(agent);

      if (!agent) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      return res.status(200).json({
        success: true,
        message: "Agent login successful ✅",
        userId: agent.email,
        agentId: agent.agentId,
        name: agent.name,
        contact: agent.phone,
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Unknown user type" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

app.post("/Agentlogin", async (req, res) => {
  try {
    const { agentId, password, userType } = req.body;

    if (userType === "agent") {
      const agent = await NewAgentModel.findOne({ agentId, password });
      console.log(agent);

      if (!agent) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      return res.status(200).json({
        success: true,
        message: "Agent login successful ✅",
        userId: agent.email,
        agentId: agent.agentId,
        name: agent.name,
        contact: agent.phone,
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Unknown user type" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

app.delete("/api/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await NewAgentModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Agent not found" });
    }
    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Temporarily disabled email transporter - configure mail server later
// const transporter = nodemailer.createTransport({
//   host: "mail.valmodelivers.in", // recommended host from email settings
//   port: 465, // SSL/TLS ke liye
//   secure: true, // true -> port 465 SSL
//   auth: {
//     user: "support@valmodelivers.in",
//     pass: "Sonu@12345,", // yaha actual password daalo
//   },
// });

app.post("/api/proposals", async (req, res) => {
  const { location, pincode, AgentName, Contact } = req.body;
  console.log(req.body);

  try {
    const newProposal = new Proposal(req.body);
    const savedProposal = await newProposal.save();

    // Build a concise proposal details email body
    const proposalDetails = `Hello ${req.body.name || ""},\n\n` +
      `Thank you for submitting a franchise proposal with Valmo Logistics. Here are the details we received:\n\n` +
      `Name: ${req.body.name || "-"}\n` +
      `Phone: ${req.body.phoneNumber || "-"}\n` +
      `Email: ${req.body.email || "-"}\n` +
      `Pincode(s): ${req.body.pincode || pincode || "-"}\n` +
      `Location(s): ${req.body.location || location || "-"}\n` +
      `Agent: ${AgentName || "-"} (${Contact || "-"})\n\n` +
      `We will review your submission and get back to you shortly.\n\n` +
      `Regards,\nValmo Logistics`;

    const mailOptions = {
      from: process.env.SMTP_FROM || "support@valmodelivers.in",
      to: req.body.email,
      subject: "Your Valmo Franchise Proposal - Confirmation",
      text: req.body.details || proposalDetails,
      html: req.body.details ? (req.body.details.replace(/\n/g, "<br />")) : undefined,
    };

    // If frontend provided a "copy" field (comma-separated emails), add as cc
    if (req.body.copy) {
      mailOptions.cc = req.body.copy;
    }

    if (transporter) {
      try {
        const info = await transporter.sendMail(mailOptions);
        // If using Ethereal, produce preview URL
        const previewUrl = nodemailer.getTestMessageUrl
          ? nodemailer.getTestMessageUrl(info)
          : null;
        if (previewUrl) console.log("Email preview URL:", previewUrl);
        return res.status(201).json({ success: true, data: savedProposal, emailPreview: previewUrl });
      } catch (mailErr) {
        console.error("Failed to send proposal email:", mailErr);
        // Return success for saved proposal but indicate email failure
        return res.status(201).json({ success: true, data: savedProposal, emailError: mailErr.message });
      }
    }

    // If transporter not configured yet, still return saved proposal
    res.status(201).json({ success: true, data: savedProposal, email: "not-sent" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/application", async (req, res) => {
  try {
    const { agentId } = req.query;

    if (agentId) {
      // If caller provided an agent identifier (agentId or email), resolve agent
      // to its name and return only proposals created by that agent.
      const agent = await NewAgentModel.findOne({
        $or: [{ agentId: agentId }, { email: agentId }],
      });

      if (!agent) {
        return res
          .status(200)
          .json({ success: true, data: [], message: "No agent found" });
      }

      const proposals = await Proposal.find({ AgentName: agent.name }).sort({
        createdAt: -1,
      });
      return res.status(200).json({ success: true, data: proposals });
    }

    // Fallback: return all proposals
    const proposals = await Proposal.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: proposals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get application by ID
app.get("/api/application/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const application = await ApplicationModel.findById(id);
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }
    
    res.status(200).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// routes/bank.js
app.post("/api/add-bank", async (req, res) => {
  try {
    const bank = new BankDetails(req.body);
    await bank.save();
    res.status(200).json({
      success: true,
      message: "Bank details saved successfully",
      data: bank,
    });
  } catch (err) {
    console.error("Error saving bank:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

app.put("/api/update-bank/:id", async (req, res) => {
  try {
    const { id } = req.params; // bank ka id URL se aayega
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName } =
      req.body;

    const updated = await BankDetails.findByIdAndUpdate(
      id, // yahan se id ke base par update hoga
      {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
      },
      { new: true } // new:true => updated document return karega
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Bank not found ❌" });
    }

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully ✅",
      data: updated,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/* --- Get Latest Bank Details --- */
app.get("/api/bankDetails", async (req, res) => {
  try {
    const bankDetails = await BankDetails.find().sort({ createdAt: -1 }); // sab record milenge
    res.status(200).json({ success: true, data: bankDetails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --- Update Bank Details with new QR Code --- */
app.put("/api/updateQR", upload.single("qrCode"), async (req, res) => {
  console.log("update QR call");
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "QR code file missing" });
    }

    // Cloudinary pe upload
    const result = await cloudinary.uploader.upload(req.file.path);

    // Local temp file delete
    fs.unlinkSync(req.file.path);

    // BankQr me last record update karo
    const lastRecord = await BankQr.findOne().sort({ createdAt: -1 });
    if (!lastRecord) {
      return res
        .status(404)
        .json({ success: false, error: "No QR record found to update" });
    }

    lastRecord.qrCode = result.secure_url;
    await lastRecord.save();

    res.status(200).json({ success: true, data: lastRecord });
  } catch (err) {
    console.error("❌ Error in /updateQR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/bankQr", async (req, res) => {
  try {
    const bankQr = await BankQr.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bankQr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    // 1. Cloudinary pe upload
    const result = await cloudinary.uploader.upload(req.file.path);

    // 2. Local temp file delete
    fs.unlinkSync(req.file.path);

    // 3. BankQr collection me save karo (upsert nahi, naya record bhi ban sakta hai)
    const newQr = new BankQr({ qrCode: result.secure_url });
    await newQr.save();

    // 4. Response bhejo
    res.json({ success: true, url: result.secure_url, data: newQr });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(
  "/api/createApplication",
  applicationUpload.fields([
    { name: "photo", maxCount: 1 }, // Passport size photo
    { name: "aadharCard", maxCount: 1 }, // Aadhaar front
    { name: "aadharBack", maxCount: 1 }, // Aadhaar back ✅ added
    { name: "panCard", maxCount: 1 }, // PAN card
    { name: "cancelCheque", maxCount: 1 }, // Cancelled cheque
    { name: "otherDocuments", maxCount: 10 }, // Other docs
  ]),
  async (req, res) => {
    try {
      // Defensive: ensure req.body is always an object
      const formData = req.body || {};

      // Defensive: ensure req.files is always an object
      const files = req.files || {};

      // Helper to convert file path to URL
      const getFileUrl = (file) => {
        if (!file) return "";
        if (file.path.startsWith("http")) return file.path; // Cloudinary URL
        // Local file - return relative URL
        return `/uploads/${path.basename(file.path)}`;
      };

      // Safely extract file paths or fallback to empty string / empty array
      formData.photo = getFileUrl(files.photo?.[0]);
      formData.aadharCard = getFileUrl(files.aadharCard?.[0]);
      formData.aadharBack = getFileUrl(files.aadharBack?.[0]); // ✅ added
      formData.panCard = getFileUrl(files.panCard?.[0]);
      formData.cancelCheque = getFileUrl(files.cancelCheque?.[0]);
      formData.gstCertificate = getFileUrl(files.gstCertificate?.[0]);
      formData.addressProof = getFileUrl(files.addressProof?.[0]);
      formData.otherDocuments = (files.otherDocuments || []).map((file) =>
        getFileUrl(file)
      );

      // Convert boolean strings to actual booleans
      formData.hasLoans = formData.hasLoans === "true";
      formData.hasCommercialVehicles =
        formData.hasCommercialVehicles === "true";
      formData.isFamiliarWithLogistics =
        formData.isFamiliarWithLogistics === "true";
      formData.hasLogisticsExperience =
        formData.hasLogisticsExperience === "true";
      formData.hasOtherFranchise = formData.hasOtherFranchise === "true";
      formData.hasLegalIssues = formData.hasLegalIssues === "true";

      // Convert numeric fields safely
      formData.numberOfEmployees = Number(formData.numberOfEmployees) || 0;
      formData.staffCount = Number(formData.staffCount) || 0;

      // Ensure bank details are preserved (text fields from multipart/form-data)
      // These come from req.body and should already be in formData
      // Explicit fields: bankName, bankBranch, accountHolderName, accountNumber, ifscCode, upiId
      if (req.body.bankName) formData.bankName = req.body.bankName;
      if (req.body.bankBranch) formData.bankBranch = req.body.bankBranch;
      if (req.body.accountHolderName) formData.accountHolderName = req.body.accountHolderName;
      if (req.body.accountNumber) formData.accountNumber = req.body.accountNumber;
      if (req.body.ifscCode) formData.ifscCode = req.body.ifscCode;
      if (req.body.upiId) formData.upiId = req.body.upiId;

      // Create and save new application
      const newApplication = new ApplicationModel(formData);
      await newApplication.save();

      res.status(201).json({
        success: true,
        message: "Application submitted successfully ✅",
        data: newApplication,
      });
    } catch (error) {
      console.error("❌ Error saving application:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);
app.put(
  "/api/updateApplication/:email",
  applicationUpload.fields([
    { name: "photo", maxCount: 1 }, // Passport size photo
    { name: "aadharCard", maxCount: 1 }, // Aadhaar front
    { name: "aadharBack", maxCount: 1 }, // Aadhaar back
    { name: "panCard", maxCount: 1 }, // PAN card
    { name: "cancelCheque", maxCount: 1 }, // Cancelled cheque
    { name: "otherDocuments", maxCount: 10 }, // Other docs
  ]),
  async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required for update" });
      }

      // Defensive: ensure req.body is always an object
      const formData = req.body || {};

      // Defensive: ensure req.files is always an object
      const files = req.files || {};

      // Helper to convert file path to URL
      const getFileUrl = (file) => {
        if (!file) return "";
        if (file.path.startsWith("http")) return file.path; // Cloudinary URL
        // Local file - return relative URL
        return `/uploads/${path.basename(file.path)}`;
      };

      // Replace file fields if new files uploaded
      if (files.photo) formData.photo = getFileUrl(files.photo[0]);
      if (files.aadharCard) formData.aadharCard = getFileUrl(files.aadharCard[0]);
      if (files.aadharBack) formData.aadharBack = getFileUrl(files.aadharBack[0]);
      if (files.panCard) formData.panCard = getFileUrl(files.panCard[0]);
      if (files.cancelCheque) formData.cancelCheque = getFileUrl(files.cancelCheque[0]);
      if (files.gstCertificate) formData.gstCertificate = getFileUrl(files.gstCertificate[0]);
      if (files.addressProof) formData.addressProof = getFileUrl(files.addressProof[0]);
      if (files.otherDocuments) formData.otherDocuments = files.otherDocuments.map((f) => getFileUrl(f));

      // Convert boolean strings to actual booleans
      if (formData.hasLoans !== undefined)
        formData.hasLoans = formData.hasLoans === "true";
      if (formData.hasCommercialVehicles !== undefined)
        formData.hasCommercialVehicles =
          formData.hasCommercialVehicles === "true";
      if (formData.isFamiliarWithLogistics !== undefined)
        formData.isFamiliarWithLogistics =
          formData.isFamiliarWithLogistics === "true";
      if (formData.hasLogisticsExperience !== undefined)
        formData.hasLogisticsExperience =
          formData.hasLogisticsExperience === "true";
      if (formData.hasOtherFranchise !== undefined)
        formData.hasOtherFranchise = formData.hasOtherFranchise === "true";
      if (formData.hasLegalIssues !== undefined)
        formData.hasLegalIssues = formData.hasLegalIssues === "true";

      // Convert numeric fields safely
      if (formData.numberOfEmployees !== undefined)
        formData.numberOfEmployees = Number(formData.numberOfEmployees) || 0;
      if (formData.staffCount !== undefined)
        formData.staffCount = Number(formData.staffCount) || 0;

      // Ensure bank details are preserved (text fields from multipart/form-data)
      if (req.body.bankName) formData.bankName = req.body.bankName;
      if (req.body.bankBranch) formData.bankBranch = req.body.bankBranch;
      if (req.body.accountHolderName) formData.accountHolderName = req.body.accountHolderName;
      if (req.body.accountNumber) formData.accountNumber = req.body.accountNumber;
      if (req.body.ifscCode) formData.ifscCode = req.body.ifscCode;
      if (req.body.upiId) formData.upiId = req.body.upiId;

      // Update the application
      const updatedApplication = await ApplicationModel.findOneAndUpdate(
        { email },
        { $set: formData },
        { new: true }
      );

      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: "No application found with this email",
        });
      }

      res.json({
        success: true,
        message: "Application updated successfully ✅",
        data: updatedApplication,
      });
    } catch (error) {
      console.error("❌ Error updating application:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// Update application by ID
app.put(
  "/api/updateApplication/:id",
  applicationUpload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "cancelCheque", maxCount: 1 },
    { name: "otherDocuments", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "ID is required for update" });
      }

      // Defensive: ensure req.body is always an object
      const formData = req.body || {};

      // Defensive: ensure req.files is always an object
      const files = req.files || {};

      // Replace file fields if new files uploaded
      if (files.photo) formData.photo = files.photo[0].path;
      if (files.aadharCard) formData.aadharCard = files.aadharCard[0].path;
      if (files.aadharBack) formData.aadharBack = files.aadharBack[0].path;
      if (files.panCard) formData.panCard = files.panCard[0].path;
      if (files.cancelCheque)
        formData.cancelCheque = files.cancelCheque[0].path;
      if (files.otherDocuments)
        formData.otherDocuments = files.otherDocuments.map((f) => f.path);

      // Convert numeric fields safely
      if (formData.numberOfEmployees !== undefined)
        formData.numberOfEmployees = Number(formData.numberOfEmployees) || 0;
      if (formData.staffCount !== undefined)
        formData.staffCount = Number(formData.staffCount) || 0;

      // Ensure bank details are preserved (text fields from multipart/form-data)
      if (req.body.bankName) formData.bankName = req.body.bankName;
      if (req.body.bankBranch) formData.bankBranch = req.body.bankBranch;
      if (req.body.accountHolderName) formData.accountHolderName = req.body.accountHolderName;
      if (req.body.accountNumber) formData.accountNumber = req.body.accountNumber;
      if (req.body.ifscCode) formData.ifscCode = req.body.ifscCode;
      if (req.body.upiId) formData.upiId = req.body.upiId;

      // Update the application by ID
      const updatedApplication = await ApplicationModel.findByIdAndUpdate(
        id,
        { $set: formData },
        { new: true }
      );

      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: "No application found with this ID",
        });
      }

      res.json({
        success: true,
        message: "Application updated successfully ✅",
        data: updatedApplication,
      });
    } catch (error) {
      console.error("❌ Error updating application:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

app.get("/api/getApplication", async (req, res) => {
  try {
    const applications = await ApplicationModel.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
});
// DELETE Application
app.delete("/api/deleteApplication/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedApplication = await ApplicationModel.findByIdAndDelete(id);

    if (!deletedApplication) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found ❌" });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully 🗑️",
      data: deletedApplication,
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
});

app.get("/api/getApplication/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const application = await Proposal.findOne({ email }).sort({
      createdAt: -1,
    }); // latest entry
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found for this email",
      });
    }
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  }
});

app.post("/api/application/approve", async (req, res) => {
  const { email, name, agentName, agentContact } = req.body;
  console.log(req.body);
  try {
    // user search by email + name (Proposal me check)
    const user = await ApplicationModel.findOne({ email, fullName: name });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ First update Proposal: approved flag + status
    user.approved = true;
    user.status = "approved";
    await user.save();

    // ✅ ApplicationModel se franchisePinCode nikalna
    const application = await ApplicationModel.findOne({ email });
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // random 5 digit id
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const customerId = `VOL_2025/${randomId}`;
    const password = "volma@1234"; // default password

    // ✅ Save into Customer Collection
    const newCustomer = new Customer({
      name,
      email,
      customerId,
      password,
    });
    await newCustomer.save();

    // ✅ Send mail
    try {
      const mailResult = await transporter.sendMail({
        from: "support@valmodelivers.in",
        to: email,
        subject: "🎉 Valmo Franchise Application Approved",
        text: `Dear ${name},

Greetings from Valmo Logistics.

We are delighted to inform you that your Valmo Franchise application has been successfully approved ✅ for your preferred PIN code:

📍 PIN Code: ${application.franchisePinCode}

You can now access your Valmo Partner Portal 💻 to track your onboarding status, view important resources, and complete your approval fee payment.

🔐 LOGIN CREDENTIALS:
🆔 Customer ID: ${customerId}
🔑 Password: ${password}
🌐 Partner Portal Link: http://localhost:3000/customer-login

⚠ IMMEDIATE ACTION REQUIRED – Approval Fee Payment

To confirm and secure your franchise, please log in to the Valmo Partner Portal and complete the approval fee payment of ₹18,600 💳.
All payment details and secure payment options are available inside your portal.

🚨 Your franchise PIN code will be reserved only upon successful payment.

Once your payment is confirmed ✅, our team will proceed with the final onboarding process and provide you with the official franchise agreement 📄.

For any assistance, please contact:
📞 ${agentContact}
📧 support@valmodelivers.in

We look forward to working with you and building a strong, long-term partnership 🤝.

Best Regards,
${agentName}
Business Development Team
Valmo Logistics 🚚`
      });
      console.log("Approval email sent successfully:", mailResult.messageId || mailResult.response);
      // Log Ethereal preview URL if using test account
      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(mailResult);
        if (previewUrl) {
          console.log("📧 Preview Approval Email:", previewUrl);
        }
      }
    } catch (mailErr) {
      console.error("Error sending approval email:", mailErr);
    }

    res.json({
      success: true,
      message: "Proposal approved, customer created & mail sent",
    });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// One-Time Fee (Registration) mail + status update
app.post("/api/application/one-time-fee", async (req, res) => {
  const { email, name, agentName, agentContact } = req.body;

  try {
    const proposal = await ApplicationModel.findOne({ email, fullName: name });
    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in Proposal" });
    }

    // ✅ Check agreement status
    if (proposal.status !== "agreement") {
      return res.status(400).json({
        success: false,
        message:
          "Franchise agreement not completed. One-time fee step is locked.",
      });
    }

    // ✅ Fetch customer (no new creation)
    const customer = await Customer.findOne({ email, name });
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer not found. Please complete approval first.",
      });
    }
    const application = await ApplicationModel.findOne({ email });
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }
    
    // ✅ Send email
    try {
      const mailResult = await transporter.sendMail({
        from: "support@valmodelivers.in",
        to: email,
        subject: "🚀 Complete Your One-Time Setup Fee Payment – Valmo Franchise Onboarding",
        text: `Dear ${name},

👋 Greetings from Valmo Logistics.

As part of your Valmo Franchise Onboarding process for the approved location and PIN code:

📍 PIN Code: ${application.franchisePinCode}

💳 ONE-TIME SETUP FEE PAYMENT – ₹2,00,000

You are required to complete the One-Time Setup Fee payment to activate your franchise account.

🔐 LOGIN CREDENTIALS:
🆔 Customer ID: ${customer.customerId}  
🔒 Password: ${customer.password}
🌐 Partner Portal Link: http://localhost:3000/customer-login

⚡ Important: This payment is a mandatory step to activate your franchise account.

🏢 THIS PAYMENT COVERS:
🛋 Complete office setup with company-designed interiors
💻 All necessary equipment (barcode machine, laptops, accessories, tools)
📚 Complete franchise operational playbook
🎓 Staff training and support

📦 AFTER PAYMENT CONFIRMATION:
✅ Complete your full franchise operational setup
📌 Allocate your PIN code inventory in the system
🔓 Provide access to all franchise resources via partner portal
🚀 Begin active operations

📞 FOR PAYMENT ASSISTANCE:
📱 Phone: ${agentContact}
📧 Email: support@valmodelivers.in

✨ Best Regards,
${agentName}
Business Development Team
Valmo Logistics 🚚`
      });
      console.log("One-Time Fee email sent successfully:", mailResult.messageId || mailResult.response);
      // Log Ethereal preview URL if using test account
      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(mailResult);
        if (previewUrl) {
          console.log("📧 Preview One-Time Fee Email:", previewUrl);
        }
      }
    } catch (mailErr) {
      console.error("Error sending one-time fee email:", mailErr);
      // Still proceed with status update even if email fails
    }

    // ✅ Update proposal status
    proposal.status = "one-time-fee";
    proposal.oneTimeFeeMail = true;
    proposal.oneTimeFeeSentAt = new Date();
    await proposal.save();

    res.json({
      success: true,
      message: "One-time fee mail sent & proposal status updated",
      data: {
        status: "one-time-fee",
        customerId: customer.customerId,
        email: customer.email,
      },
    });
  } catch (err) {
    console.error("One-Time Fee Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/pincode/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${code}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pincode data" });
  }
});

app.post("/api/application/agreement", async (req, res) => {
  const { email, name, agentContact, agentName } = req.body;

  try {
    // 1) Proposal lookup
    const proposal = await ApplicationModel.findOne({ email, fullName: name });
    if (!proposal) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in Proposal" });
    }

    // ✅ Only allow if already approved
    if (proposal.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Franchise is not yet approved. Agreement cannot proceed.",
      });
    }

    // 2) Customer check
    const customer = await Customer.findOne({ email, name });
    if (!customer) {
      return res.status(400).json({
        success: false,
        message:
          "Customer record not found. Please complete approval step first.",
      });
    }

    // 3) Application check
    const application = await ApplicationModel.findOne({ email });
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    // 4) Update proposal status → agreement & cumulative flag
    proposal.status = "agreement";
    proposal.agreementSent = true; // cumulative flag for frontend
    proposal.agreementSentAt = new Date();
    await proposal.save();

    // 5) Send email
    try {
      const mailResult = await transporter.sendMail({
        from: "support@valmodelivers.in",
        to: email,
        subject: "🎉 Valmo Franchise Agreement Process Initiated – Action Required",
        text: `Dear ${name},

Greetings from Valmo Logistics.

Your Valmo Franchise Agreement process has been initiated:

📍 PIN Code: ${application.franchisePinCode}

✅ NEXT STEP – AGREEMENT FEE PAYMENT

🔐 LOGIN CREDENTIALS:
🆔 Customer ID: ${customer.customerId}  
🔒 Password: ${customer.password}
🌐 Partner Portal Link: http://localhost:3000/customer-login

⚡ Important: Complete agreement fee payment to access the franchise agreement document.

Agreement Fee Details:
💳 Amount: ₹90,100
📋 This unlocks the complete franchise agreement and operational support

🏢 After Payment Confirmation:
✅ Official franchise agreement will be generated
✅ Access to complete operational playbook
✅ Training and setup support begins

📞 SUPPORT:
📱 ${agentContact}
📧 support@valmodelivers.in

Best Regards,
${agentName}
Business Development Team
Valmo Logistics 🚚`
      });
      console.log("Agreement email sent successfully:", mailResult.messageId || mailResult.response);
      // Log Ethereal preview URL if using test account
      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(mailResult);
        if (previewUrl) {
          console.log("📧 Preview Agreement Email:", previewUrl);
        }
      }
    } catch (mailErr) {
      console.error("Error sending agreement email:", mailErr);
      // Still return success even if email fails, so frontend gets response
    }

    res.json({
      success: true,
      message: "Agreement mail sent & status updated",
      data: {
        status: proposal.status,
        customerId: customer.customerId,
        email: customer.email,
      },
    });
  } catch (err) {
    console.error("Agreement Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/customer/credentials", async (req, res) => {
  try {
    const { customerId } = req.query; // ?customerId=...

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await Customer.findOne({ customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      customerId: customer.customerId,
      password: customer.password,
      email: customer.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/getApplication/email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const application = await ApplicationModel.findOne({ email: email });

    if (!application) {
      return res
        .status(404)
        .json({ message: "Application not found for this email" });
    }

    res.send(application);
  } catch (err) {
    console.error("Error fetching application by email:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// transporter.verify(function (error, success) {
//   if (error) {
//     console.log("SMTP Error:", error);
//   } else {
//     console.log("Server is ready to send emails");
//   }
// });

app.post("/api/assignBankDetails", async (req, res) => {
  try {
    const {
      customerEmail,
      bankName,
      accountNumber,
      ifscCode,
      bankBranch,
      accountHolderName,
      qrCode,
    } = req.body;

    const assigned = new AssignedBank({
      customerEmail,
      bankName,
      accountNumber,
      ifscCode,
      bankBranch,
      accountHolderName,
      qrCode,
    });

    await assigned.save();
    res.json({ success: true, message: "Bank assigned successfully" });
  } catch (err) {
    console.error("Error assigning bank:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/assignedBanks", async (req, res) => {
  try {
    const banks = await AssignedBank.find();
    res.json({ success: true, data: banks });
  } catch (err) {
    console.error("Error fetching assigned banks:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/getAssignedBank/:customerEmail", async (req, res) => {
  try {
    const { customerEmail } = req.params;

    if (!customerEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Customer email is required" });
    }

    const bankDetails = await AssignedBank.findOne({ customerEmail });

    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: "No bank details found for this customer",
      });
    }

    res.json({ success: true, bankDetails });
  } catch (err) {
    console.error("Error fetching bank details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

// /** @format */

// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const connectDB = require("./config");
// const NewAgentModel = require("./models/NewAgentModel");
// const Proposal = require("./models/ProposalModel");
// const BankDetails = require("./models/BankDetailsModel");
// const nodemailer = require("nodemailer");
// const multer = require("multer");
// const cloudinary = require("./models/cloudinary");
// const fs = require("fs");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const ApplicationModel = require("./models/ApplicationModel");
// const Customer = require("./models/CoustmerModel");
// const CoustmerModel = require("./models/CoustmerModel");
// const AssignedBank = require("./models/AssignedBankModel");
// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());

// const upload = multer({ dest: "uploads/" });

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /* ---------------- Multer Storage for Cloudinary ---------------- */
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "bank_qr_codes", // Cloudinary folder name
//     allowed_formats: ["jpg", "png", "jpeg"],
//   },
// });

// const appStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "franchise_applications", // new folder in Cloudinary
//     resource_type: "auto", // supports pdf, image etc.
//     allowed_formats: ["jpg", "jpeg", "png", "pdf"],
//   },
// });
// const applicationUpload = multer({ storage: appStorage });

// app.get("/", async (req, res) => {
//   res.send("This is check");
// });

// app.post("/agents", async (req, res) => {
//   try {
//     const { name, phone, agentId, email, password } = req.body;

//     const newAgent = new NewAgentModel({
//       name,
//       phone,
//       agentId,
//       email,
//       password,
//     });

//     await newAgent.save();

//     res.status(201).json({
//       message: "Agent created successfully ✅",
//       agent: newAgent,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error saving agent ❌",
//       error: error.message,
//     });
//   }
// });

// // get agent by name (via URL param)
// app.get("/agent/:value", async (req, res) => {
//   try {
//     const { value } = req.params;

//     const agent = await NewAgentModel.findOne({
//       $or: [{ agentId: value }, { email: value }],
//     });

//     if (!agent) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Agent not found ❌" });
//     }

//     res.json({ success: true, agent });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });
// app.get("/agents", async (req, res) => {
//   try {
//     const agents = await NewAgentModel.find();
//     res.status(200).json(agents);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching agents ❌",
//       error: error.message,
//     });
//   }
// });

// app.post("/Agentlogin", async (req, res) => {
//   try {
//     const { agentId, password, userType } = req.body;

//     if (userType === "agent") {
//       const agent = await NewAgentModel.findOne({ agentId, password });
//       console.log(agent);

//       if (!agent) {
//         return res
//           .status(401)
//           .json({ success: false, message: "Invalid credentials" });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Agent login successful ✅",
//         userId: agent.email,
//         agentId: agent.agentId,
//         name: agent.name,
//         contact: agent.phone,
//       });
//     }

//     return res
//       .status(400)
//       .json({ success: false, message: "Unknown user type" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error: error.message });
//   }
// });

// app.delete("/agents/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await NewAgentModel.deleteOne({ _id: id });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Agent not found" });
//     }
//     res.json({ message: "Agent deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// const transporter = nodemailer.createTransport({
//   host: "s3607.bom1.stableserver.net",
//   port: 465,
//   secure: true, // true for SSL
//   auth: {
//     user: "support@valmodelivers.in",
//     pass: "Sonu@8849", // Replace with the actual password
//   },
// });

// app.post("/proposals", async (req, res) => {
//   const { location, pincode, AgentName, Contact } = req.body;
//   console.log(location);
//   console.log(pincode);
//   try {
//     const newProposal = new Proposal(req.body);
//     const savedProposal = await newProposal.save();
//     const mailOptions = {
//       from: "support@valmodelivers.in",
//       to: req.body.email, // frontend से आया email
//       subject: "🌟🚀 Exciting Franchise Opportunity with Valmo Logistics! 🚀🌟",
//       text: `

// 👋 ${req.body.name},

// 💥 Greetings from Valmo Logistics! 🚛📦
// As India’s leading logistics partner, we pride ourselves on delivering reliable, fast, and cost-effective shipping solutions—ensuring smooth and efficient deliveries at the lowest cost.

// 🔥 Great News! Your preferred location and PIN code are available for a Valmo Franchise Partnership—an incredible chance to join one of India’s fastest-growing logistics companies!

// ✨ Why Partner with Valmo?
// ✅ 🚀 9+ lakh orders shipped daily
// ✅ 👥 30,000+ delivery executives
// ✅ 🤝 3,000+ partners
// ✅ 🌐 6,000+ PIN codes served

// 📍 Preferred Location & PIN Code Availability 1 :
// 🔹 PIN Code:  ${pincode}
// 🔹 Location:  ${location}

// 🔥 Franchise Opportunities & Earnings 💰

// 💼 1. Basic Model
// 💸 Total Investment: ₹1,08,700
// 🔹 ₹18,600 ➡ Registration charge for PIN code booking
// 🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)

// 📦 Earnings:
// 💰 ₹30 per shipment (300 products/day commitment)
// ❌ ₹7 per parcel if cancelled at your warehouse or office
// 🚪 ₹15 per parcel if a customer cancels on the doorstep

// 🚚 2. FOCO Model (Full Company Ownership)
// 💸 Total Investment: ₹3,08,700
// 🔹 ₹18,600 ➡ Registration charge for PIN code booking
// 🔹 ₹90,100 ➡ Agreement fee (fully refundable within 90 days)
// 🔹 ₹2,00,000 ➡ Security deposit (refundable when you exit the franchise)

// 📦 Earnings:
// 💰 ₹30 per shipment (300 products/day commitment)
// ❌ ₹7 per parcel if cancelled at your warehouse or office
// 🚪 ₹15 per parcel if a customer cancels on the doorstep

// ⭐ Additional Benefits in FOCO Model:
// 👩‍💼 3 employees provided by Valmo (salaries covered by the company, approx. ₹15,000/month per employee)
// 🏢 50% rent & electricity bill covered by the company
// 💻 Office setup with company-designed interiors
// 🖥 All necessary equipment provided (barcode machine + 3 laptops with accessories)

// 📑 Required Documents:
// 🪪 Aadhar Card / Voter ID
// 🛡 PAN Card
// 🏦 Bank Account Details
// 📸 Location Images
// 🖼 Passport-size Photograph

// 📌 How to Proceed:
// ✅ The application form is available online—upload all required documents directly through the form.
// ✨ 👉 https://valmo-frontend.vercel.app/form 👈 ✨

// 📲 For More Details, Contact Us:
// 📞 ${Contact}
// 📧 support@valmodelivers.in

// 📍 Office Address:
// 🏢 3rd Floor, Wing-E, Helios Business Park, Kadubeesanahalli Village, Varthur Hobli, Outer Ring Road, Bellandur, Bangalore South, Karnataka, India, 560103

// 🚀 We look forward to a successful partnership with you and are excited to grow together!

// ✨ Best Regards,
// 🤝 ${AgentName}
// 💼 Business Development Team
// 🚛 Valmo Logistics`,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent successfully!");
//     res.status(201).json(savedProposal);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// app.get("/application", async (req, res) => {
//   try {
//     const proposals = await Proposal.find().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, data: proposals });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // routes/bank.js
// app.post("/add-bank", async (req, res) => {
//   console.log("BODY:", req.body);

//   try {
//     const newBank = new BankDetails(req.body);
//     const savedBank = await newBank.save();

//     res.status(201).json(savedBank);
//     console.log("Response sent successfully");
//     // Do not call return here on purpose to see if error shows up
//   } catch (err) {
//     console.error("ERROR:", err);

//     if (err.code === 11000) {
//       return res.status(400).json({ error: "Account number already exists." });
//     }

//     return res.status(500).json({ error: "Internal server error." });
//   }
// });

// app.put("/addBankDetails", async (req, res) => {
//   try {
//     const {
//       accountHolderName,
//       accountNumber,
//       ifscCode,
//       bankName,
//       branchName,
//       qrCode,
//     } = req.body;

//     const updated = await BankDetails.findOneAndUpdate(
//       {}, // filter -> ek hi record ke liye
//       {
//         accountHolderName,
//         accountNumber,
//         ifscCode,
//         bankName,
//         branchName,
//         qrCode,
//       },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Bank details updated successfully",
//       data: updated,
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// });

// /* --- Get Latest Bank Details --- */
// app.get("/bankDetails", async (req, res) => {
//   try {
//     const bankDetails = await BankDetails.findOne().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, data: bankDetails });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// /* --- Update Bank Details with new QR Code --- */
// app.put("/updateQR", upload.single("qrCode"), async (req, res) => {
//   console.log("update QR call");
//   try {
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, error: "QR code file missing" });
//     }

//     // Update last record (example)
//     const lastRecord = await BankDetails.findOne().sort({ createdAt: -1 });
//     if (!lastRecord) {
//       return res
//         .status(404)
//         .json({ success: false, error: "No bank details found to update" });
//     }
//     console.log("Uploaded file:", req.file); // <-- ADD THIS
//     console.log("Uploaded file (JSON):", JSON.stringify(req.file, null, 2));
//     lastRecord.qrCode = req.file.path;
//     await lastRecord.save();

//     res.status(200).json({ success: true, data: lastRecord });
//   } catch (err) {
//     console.error("❌ Error in /updateQR:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     // 1. Cloudinary pe upload
//     const result = await cloudinary.uploader.upload(req.file.path);

//     // 2. Local temp file delete
//     fs.unlinkSync(req.file.path);

//     // 3. MongoDB me save/update karo
//     const updated = await BankDetails.findOneAndUpdate(
//       {},
//       { qrCode: result.secure_url },
//       { new: true, upsert: true }
//     );

//     // 4. Frontend ko return karo (✅ success flag add kar diya)
//     res.json({ success: true, url: result.secure_url, data: updated });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.post(
//   "/createApplication",
//   applicationUpload.fields([
//     { name: "photo", maxCount: 1 }, // Passport size photo
//     { name: "aadharCard", maxCount: 1 }, // Aadhaar front
//     { name: "aadharBack", maxCount: 1 }, // Aadhaar back ✅ added
//     { name: "panCard", maxCount: 1 }, // PAN card
//     { name: "cancelCheque", maxCount: 1 }, // Cancelled cheque
//     { name: "otherDocuments", maxCount: 10 }, // Other docs
//   ]),
//   async (req, res) => {
//     try {
//       // Defensive: ensure req.body is always an object
//       const formData = req.body || {};

//       // Defensive: ensure req.files is always an object
//       const files = req.files || {};

//       // Safely extract file paths or fallback to empty string / empty array
//       formData.photo = files.photo?.[0]?.path || "";
//       formData.aadharCard = files.aadharCard?.[0]?.path || "";
//       formData.aadharBack = files.aadharBack?.[0]?.path || ""; // ✅ added
//       formData.panCard = files.panCard?.[0]?.path || "";
//       formData.cancelCheque = files.cancelCheque?.[0]?.path || "";
//       formData.gstCertificate = files.gstCertificate?.[0]?.path || "";
//       formData.addressProof = files.addressProof?.[0]?.path || "";
//       formData.otherDocuments = (files.otherDocuments || []).map(
//         (file) => file.path
//       );

//       // Convert boolean strings to actual booleans
//       formData.hasLoans = formData.hasLoans === "true";
//       formData.hasCommercialVehicles =
//         formData.hasCommercialVehicles === "true";
//       formData.isFamiliarWithLogistics =
//         formData.isFamiliarWithLogistics === "true";
//       formData.hasLogisticsExperience =
//         formData.hasLogisticsExperience === "true";
//       formData.hasOtherFranchise = formData.hasOtherFranchise === "true";
//       formData.hasLegalIssues = formData.hasLegalIssues === "true";

//       // Convert numeric fields safely
//       formData.numberOfEmployees = Number(formData.numberOfEmployees) || 0;
//       formData.staffCount = Number(formData.staffCount) || 0;

//       // Create and save new application
//       const newApplication = new ApplicationModel(formData);
//       await newApplication.save();

//       res.status(201).json({
//         success: true,
//         message: "Application submitted successfully ✅",
//         data: newApplication,
//       });
//     } catch (error) {
//       console.error("❌ Error saving application:", error);
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }
// );
// app.get("/getApplication", async (req, res) => {
//   try {
//     const applications = await ApplicationModel.find().sort({ createdAt: -1 }); // latest first
//     res.status(200).json({
//       success: true,
//       count: applications.length,
//       data: applications,
//     });
//   } catch (error) {
//     console.error("Error fetching applications:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch applications",
//       error: error.message,
//     });
//   }
// });
// // DELETE Application
// app.delete("/deleteApplication/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedApplication = await ApplicationModel.findByIdAndDelete(id);

//     if (!deletedApplication) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Application not found ❌" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Application deleted successfully 🗑️",
//       data: deletedApplication,
//     });
//   } catch (error) {
//     console.error("Error deleting application:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete application",
//       error: error.message,
//     });
//   }
// });

// app.get("/getApplication/:email", async (req, res) => {
//   try {
//     const email = req.params.email;
//     const application = await Proposal.findOne({ email }).sort({
//       createdAt: -1,
//     }); // latest entry
//     if (!application) {
//       return res.status(404).json({
//         success: false,
//         message: "Application not found for this email",
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: application,
//     });
//   } catch (error) {
//     console.error("Error fetching application:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch application",
//       error: error.message,
//     });
//   }
// });

// app.post("/application/approve", async (req, res) => {
//   const { email, name, agentName, agentContact } = req.body;
//   console.log(req.body);
//   try {
//     // user search by email + name (Proposal me check)
//     const user = await ApplicationModel.findOne({ email, fullName: name });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // ✅ First update Proposal: approved flag + status
//     user.approved = true;
//     user.status = "approved";
//     await user.save();

//     // ✅ ApplicationModel se franchisePinCode nikalna
//     const application = await ApplicationModel.findOne({ email });
//     if (!application) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Application not found" });
//     }

//     // random 5 digit id
//     const randomId = Math.floor(10000 + Math.random() * 90000);
//     const customerId = `VOL_2025/${randomId}`;
//     const password = "volma@1234"; // default password

//     // ✅ Save into Customer Collection
//     const newCustomer = new Customer({
//       name,
//       email,
//       customerId,
//       password,
//     });
//     await newCustomer.save();

//     // ✅ Send mail
//     await transporter.sendMail({
//       from: "support@valmodelivers.in",
//       to: email,
//       subject: "🎉Valmo Franchise Application Approved",
//       text: `
// Dear ${name},

// Greetings from Valmo Logistics.

// We are delighted to inform you that your Valmo Franchise application has been successfully approved ✅ for your preferred PIN code:

// 📍 PIN Code: ${application.franchisePinCode}

// You can now access your Valmo Partner Portal 💻 to track your onboarding status, view important resources, and complete your approval fee payment.

// 🔐 Login Credentials:
// 🆔 Customer ID: ${customerId}
// 🔑 Password: ${password}
// 🌐 Partner Portal Link:

// ⚠ Immediate Action Required – Approval Fee Payment

// To confirm and secure your franchise, please log in to the Valmo Partner Portal and complete the approval fee payment of ₹18,600 💳.
// All payment details and secure payment options are available inside your portal.

// 🚨 Your franchise PIN code will be reserved only upon successful payment.

// Once your payment is confirmed ✅, our team will proceed with the final onboarding process and provide you with the official franchise agreement 📄.

// For any assistance, please contact:
// 📞 ${agentContact}
// 📧 support@valmodelivers.in

// We look forward to working with you and building a strong, long-term partnership 🤝.

// Best Regards,
// ${agentName}
// Business Development Team
// Valmo Logistics 🚚`,
//     });

//     res.json({
//       success: true,
//       message: "Proposal approved, customer created & mail sent",
//     });
//   } catch (err) {
//     console.error("Approval Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // One-Time Fee (Registration) mail + status update
// app.post("/application/one-time-fee", async (req, res) => {
//   const { email, name, agentName, agentContact } = req.body;

//   try {
//     const proposal = await ApplicationModel.findOne({ email, fullName: name });
//     if (!proposal) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found in Proposal" });
//     }

//     // ✅ Check agreement status
//     if (proposal.status !== "agreement") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Franchise agreement not completed. One-time fee step is locked.",
//       });
//     }

//     // ✅ Fetch customer (no new creation)
//     const customer = await Customer.findOne({ email, name });
//     if (!customer) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer not found. Please complete approval first.",
//       });
//     }
//     const application = await ApplicationModel.findOne({ email });
//     if (!application) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Application not found" });
//     }
//     // ✅ Send email
//     await transporter.sendMail({
//       from: "support@valmodelivers.in",
//       to: email,
//       subject:
//         "🚀 Complete Your One-Time Setup Fee Payment – Valmo Franchise Onboarding",
//       text: `
// Dear ${name},

// 👋 Greetings from Valmo Logistics.

// As part of your Valmo Franchise Onboarding process for the approved location and PIN code:

// 📍 PIN Code: ${application.franchisePinCode}

// 💳 One-Time Setup Fee Payment – ₹2,00,000

// You are required to complete the One-Time Setup Fee payment to activate your franchise account.

// 🔑 Login Credentials:
// 🆔 Customer ID: ${customer.customerId}
// 🔒 Password: ${customer.password}
// 🌐 Partner Portal Link:

// ⚡ Important: This payment is a mandatory step to activate your franchise account.

// 🏢 This payment covers:

// 🛋 Complete office setup with company-designed interiors

// 💻 All necessary equipment, including barcode machine, laptops with accessories, and other tools

// 📦 After Payment Confirmation, our onboarding team will:

// ✅ Complete your full franchise operational setup

// 📌 Allocate your PIN code inventory in the system

// 🔓 Provide access to all franchise resources via your partner portal

// 📞 For payment assistance:
// 📱 Phone: ${agentContact}
// 📧 Email: support@valmodelivers.in

// ✨ Best Regards,
// ${agentName}
// Valmo Logistics Team 🚚
// `,
//     });

//     // ✅ Update proposal status
//     proposal.status = "one-time-fee";
//     proposal.oneTimeFeeMail = true;
//     proposal.oneTimeFeeSentAt = new Date();
//     await proposal.save();

//     res.json({
//       success: true,
//       message: "One-time fee mail sent & proposal status updated",
//       data: {
//         status: "one-time-fee",
//         customerId: customer.customerId,
//         email: customer.email,
//       },
//     });
//   } catch (err) {
//     console.error("One-Time Fee Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// app.get("/pincode/:code", async (req, res) => {
//   try {
//     const { code } = req.params;
//     const response = await fetch(
//       `https://api.postalpincode.in/pincode/${code}`
//     );
//     const data = await response.json();
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch pincode data" });
//   }
// });

// app.post("/application/agreement", async (req, res) => {
//   const { email, name, agentContact, agentName } = req.body;

//   try {
//     // 1) Proposal lookup
//     const proposal = await ApplicationModel.findOne({ email, fullName: name });
//     if (!proposal) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found in Proposal" });
//     }

//     // ✅ Only allow if already approved
//     if (proposal.status !== "approved") {
//       return res.status(400).json({
//         success: false,
//         message: "Franchise is not yet approved. Agreement cannot proceed.",
//       });
//     }

//     // 2) Customer check
//     const customer = await Customer.findOne({ email, name });
//     if (!customer) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Customer record not found. Please complete approval step first.",
//       });
//     }

//     // 3) Application check
//     const application = await ApplicationModel.findOne({ email });
//     if (!application) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Application not found" });
//     }

//     // 4) Update proposal status → agreement & cumulative flag
//     proposal.status = "agreement";
//     proposal.agreementSent = true; // cumulative flag for frontend
//     proposal.agreementSentAt = new Date();
//     await proposal.save();

//     // 5) Send email
//     await transporter.sendMail({
//       from: "support@valmodelivers.in",
//       to: email,
//       subject:
//         "🎉 Valmo Franchise Agreement Process Initiated – Action Required",
//       text: `Dear ${name},

// Greetings from Valmo Logistics.

// Your Valmo Franchise Agreement process has been initiated:

// 📍 PIN Code: ${application.franchisePinCode}

// ✅ Next Step – Agreement Fee Payment

// 🔑 Login Credentials:
// 🆔 Customer ID: ${customer.customerId}
// 🔒 Password: ${customer.password}

// ⚡ Important: Complete agreement fee payment to access the franchise agreement.

// 📞 Support:
// 📱 ${agentContact}
// 📧 support@valmodelivers.in

// Best Regards,
// ${agentName}
// Valmo Logistics Team 🚚`,
//     });

//     res.json({
//       success: true,
//       message: "Agreement mail sent & status updated",
//       data: {
//         status: proposal.status,
//         customerId: customer.customerId,
//         email: customer.email,
//       },
//     });
//   } catch (err) {
//     console.error("Agreement Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// app.get("/customer/credentials", async (req, res) => {
//   try {
//     const { customerId } = req.query; // ?customerId=...

//     if (!customerId) {
//       return res.status(400).json({ message: "Customer ID is required" });
//     }

//     const customer = await Customer.findOne({ customerId });

//     if (!customer) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     res.json({
//       customerId: customer.customerId,
//       password: customer.password,
//       email: customer.email,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// app.get("/getApplication/email/:email", async (req, res) => {
//   try {
//     const { email } = req.params;

//     const application = await ApplicationModel.findOne({ email: email });

//     if (!application) {
//       return res
//         .status(404)
//         .json({ message: "Application not found for this email" });
//     }

//     res.send(application);
//   } catch (err) {
//     console.error("Error fetching application by email:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// transporter.verify(function (error, success) {
//   if (error) {
//     console.log("SMTP Error:", error);
//   } else {
//     console.log("Server is ready to send emails");
//   }
// });

// app.post("/assignBankDetails", async (req, res) => {
//   try {
//     const { customerEmail, bankName, accountNumber, ifscCode, bankBranch } =
//       req.body;

//     if (!customerEmail || !bankName) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields" });
//     }

//     const assigned = new AssignedBank({
//       customerEmail,
//       bankName,
//       accountNumber,
//       ifscCode,
//       bankBranch,
//       accountHolderName,
//       qrCode,
//     });

//     await assigned.save();
//     res.json({ success: true, message: "Bank assigned successfully" });
//   } catch (err) {
//     console.error("Error assigning bank:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// app.get("/assignedBanks", async (req, res) => {
//   try {
//     const banks = await AssignedBank.find();
//     res.json({ success: true, data: banks });
//   } catch (err) {
//     console.error("Error fetching assigned banks:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// app.get("/getAssignedBank/:customerEmail", async (req, res) => {
//   try {
//     const { customerEmail } = req.params;

//     if (!customerEmail) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Customer email is required" });
//     }

//     const bankDetails = await AssignedBank.findOne({ customerEmail });

//     if (!bankDetails) {
//       return res.status(404).json({
//         success: false,
//         message: "No bank details found for this customer",
//       });
//     }

//     res.json({ success: true, bankDetails });
//   } catch (err) {
//     console.error("Error fetching bank details:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(` Server running on http://localhost:${PORT}`);
// });
