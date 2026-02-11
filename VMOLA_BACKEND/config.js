/** @format */

const mongoose = require("mongoose");
const dns = require("dns").promises;

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  const connect = async () => {
    try {
      console.log("Attempting to connect to MongoDB (attempt " + (retries + 1) + "/" + maxRetries + ")...");
      
      // Set custom DNS servers (Google Public DNS) to bypass Windows DNS issues
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
      
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        family: 4, // Use IPv4
      });
      console.log("✓ MongoDB connected successfully");
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.error("Connection attempt failed:", error.message);
        console.log("Retrying in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connect();
      } else {
        console.error("DB Connection Error after " + maxRetries + " attempts:", error.message);
        process.exit(1);
      }
    }
  };

  return connect();
};

module.exports = connectDB;
