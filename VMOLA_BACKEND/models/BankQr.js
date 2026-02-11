/** @format */

// models/BankQr.js
const mongoose = require("mongoose");

const bankQrSchema = new mongoose.Schema(
  {
    qrCode: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankQr", bankQrSchema);
