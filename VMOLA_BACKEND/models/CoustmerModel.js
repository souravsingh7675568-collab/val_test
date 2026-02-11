/** @format */

const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  customerId: { type: String },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Customer", CustomerSchema);
