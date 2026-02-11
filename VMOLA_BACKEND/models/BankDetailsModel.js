/** @format */

// models/BankDetails.js
const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,

      unique: true,
    },
    ifscCode: {
      type: String,

      uppercase: true,
    },
    bankName: {
      type: String,
    },
    branchName: {
      type: String,
    },
    upiId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
