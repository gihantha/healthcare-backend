//controllers/authController.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  try {
    const { nic, password } = req.body || {};

    if (!nic || !password) {
      return res.status(400).json({
        error: "NIC and password are required",
      });
    }

    const user = await User.findOne({ nic });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // License expiry check
    if (
      (user.role === "DOCTOR" || user.role === "NURSE") &&
      user.licenseExpiry &&
      new Date(user.licenseExpiry) < new Date()
    ) {
      return res.status(403).json({ error: "License expired" });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "jwt_secret",
      { expiresIn: "45m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "jwt_secret",
      { expiresIn: "7d" }
    );

    res.json({ accessToken, refreshToken, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// CREATE USER (ADMIN)
exports.createUser = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "ADMIN" });
    const { nic, password, name, contact, role, licenseExpiry } =
      req.body || {};

    if (!nic || !password || !role) {
      return res.status(400).json({
        error: "NIC, password, and role are required",
      });
    }

    // 🔒 Normal mode → admin already exists
    if (adminCount > 0) {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // 🟢 Bootstrap mode → first user
    if (adminCount === 0) {
      if (role !== "ADMIN") {
        return res.status(403).json({
          error: "First user must be ADMIN",
        });
      }
    }

    const user = new User({
      nic,
      password,
      name,
      contact,
      role,
      licenseExpiry,
    });

    await user.save();

    res.status(201).json({
      success: true,
      userId: user._id,
      bootstrap: adminCount === 0,
    });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({ error: "NIC already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
};
