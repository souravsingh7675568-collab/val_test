/** @format */

const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  agentId: String,
  email: String,
  password: String,
});

module.exports = mongoose.model("NewAgent", agentSchema);
