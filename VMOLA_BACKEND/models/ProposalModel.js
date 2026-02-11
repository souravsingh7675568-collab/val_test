/** @format */

const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      match: /^[0-9]{10}$/, 
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // simple email validation
    },
    pincode: {
      type: String,
      match: /^[0-9]{6}$/, // 6 digit pincode
    },
    location: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
