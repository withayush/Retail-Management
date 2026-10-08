const mongoose = require("mongoose");
const { Account } = require("../models");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected🚀🌳`);
    Account.syncIndexes().catch((err) => {
      console.warn("Account index sync warning:", err.message);
    });
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
