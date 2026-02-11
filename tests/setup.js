//tests/setup.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/User");

async function setupFirstAdmin() {
  try {
    console.log("🔧 Setting up first admin user...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log("🔄 No users found. Creating first admin user...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      const adminUser = new User({
        nic: "961001730V",
        name: "Kaveen",
        password: hashedPassword,
        role: "ADMIN",
        contact: "+94719223365",
      });

      await adminUser.save();
      console.log("✅ First admin user created successfully!");
      console.log("📋 User details:");
      console.log(`   NIC: ${adminUser.nic}`);
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Contact: ${adminUser.contact}`);
    } else {
      console.log(
        "⚠️  Users already exist in database. Skipping first admin setup."
      );
      const users = await User.find().select("nic name role");
      console.log("📋 Existing users:");
      users.forEach((user) => {
        console.log(`   - ${user.nic} (${user.name}) - ${user.role}`);
      });
    }

    await mongoose.disconnect();
    console.log("✅ Setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run setup
setupFirstAdmin();
