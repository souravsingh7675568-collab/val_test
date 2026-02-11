/** @format */
const mongoose = require("mongoose");
const AssignedBankSchema = new mongoose.Schema({
  customerEmail: { type: String },
  bankName: { type: String }, // sirf naam store hoga
  accountNumber: { type: String }, // optional
  ifscCode: { type: String }, // optional
  bankBranch: { type: String }, // optional
  accountHolderName: { type: String },
  qrCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AssignedBank", AssignedBankSchema);
