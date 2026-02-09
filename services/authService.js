// services/authService.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

function createTokens(user) {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  if (user.role === "DOCTOR" || user.role === "NURSE") {
    payload.licenseExpiry = user.licenseExpiry;
  }

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || "jwt_secret",
    { expiresIn: "45m" }
  );
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || "jwt_secret",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken, role: user.role };
}

async function login({ nic, password }) {
  if (!nic || !password) {
    throw {
      code: "BAD_REQUEST",
      message: "NIC and password are required",
      status: 400,
    };
  }

  const user = await User.findOne({ nic });
  if (!user || !(await user.comparePassword(password))) {
    throw {
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
      status: 401,
    };
  }

  if (
    (user.role === "DOCTOR" || user.role === "NURSE") &&
    user.licenseExpiry &&
    new Date(user.licenseExpiry) < new Date()
  ) {
    throw { code: "LICENSE_EXPIRED", message: "License expired", status: 403 };
  }

  return createTokens(user);
}

async function createUser(data, currentUser) {
  const { nic, password, name, contact, role, licenseExpiry } = data;

  if (!nic || !password || !role) {
    throw {
      code: "BAD_REQUEST",
      message: "NIC, password, and role are required",
      status: 400,
    };
  }

  const adminCount = await User.countDocuments({ role: "ADMIN" });

  // Bootstrap mode: first user must be ADMIN
  if (adminCount === 0 && role !== "ADMIN") {
    throw {
      code: "FORBIDDEN",
      message: "First user must be ADMIN",
      status: 403,
    };
  }

  // Normal mode: only ADMIN can create users
  if (adminCount > 0 && (!currentUser || currentUser.role !== "ADMIN")) {
    throw { code: "FORBIDDEN", message: "Forbidden", status: 403 };
  }

  try {
    const user = new User({
      nic,
      password,
      name,
      contact,
      role,
      licenseExpiry,
    });
    await user.save();
    return { userId: user._id, bootstrap: adminCount === 0 };
  } catch (err) {
    if (err.code === 11000) {
      throw { code: "NIC_EXISTS", message: "NIC already exists", status: 400 };
    }
    throw { code: "SERVER_ERROR", message: "Server error", status: 500 };
  }
}

module.exports = { login, createUser };
