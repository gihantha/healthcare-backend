// services/authService.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

function createTokens(user) {
  const payload = {
    userId: user._id,
    role: user.role,
    name: user.name
  };

  if (user.role === 'DOCTOR' || user.role === 'NURSE') {
    payload.licenseExpiry = user.licenseExpiry;
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '45m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '7d' });

  return { accessToken, refreshToken, role: user.role, name: user.name };
}

async function login({ nic, password }) {
  if (!nic || !password) {
    throw { code: 'BAD_REQUEST', message: 'NIC and password are required', status: 400 };
  }

  const user = await User.findOne({ nic: nic.trim() });
  if (!user) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', status: 401 };
  }

  // Verify password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', status: 401 };
  }

  // License expiry check for DOCTOR/NURSE
  if ((user.role === 'DOCTOR' || user.role === 'NURSE') &&
      user.licenseExpiry && new Date(user.licenseExpiry) < new Date()) {
    throw { code: 'LICENSE_EXPIRED', message: 'License expired', status: 403 };
  }

  return createTokens(user);
}

async function createUser(data, currentUser) {
  const { nic, password, name, contact, role, licenseExpiry } = data;

  if (!nic || !password || !name || !role) {
    throw { code: 'BAD_REQUEST', message: 'NIC, password, name, and role are required', status: 400 };
  }

  // Check if any users exist (bootstrap check)
  const userCount = await User.countDocuments();
  const isFirstUser = userCount === 0;

  // Bootstrap mode: first user must be ADMIN
  if (isFirstUser) {
    if (role !== 'ADMIN') {
      throw { code: 'FORBIDDEN', message: 'First user must be ADMIN', status: 403 };
    }
    console.log('🚀 Bootstrap mode: Creating first user (ADMIN)');
  } else {
    // Normal mode: only ADMIN can create users
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw { code: 'FORBIDDEN', message: 'Only ADMIN can create users', status: 403 };
    }
  }

  try {
    // Check if NIC already exists
    const existingUser = await User.findOne({ nic: nic.trim() });
    if (existingUser) {
      throw { code: 'NIC_EXISTS', message: 'NIC already exists', status: 400 };
    }

    // For DOCTOR/NURSE, validate license expiry
if (role === 'DOCTOR' || role === 'NURSE') {
  if (!licenseExpiry) {
    throw { code: 'BAD_REQUEST', message: 'License expiry is required for DOCTOR/NURSE', status: 400 };
  }

  const expiryDate = new Date(licenseExpiry);
  if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    throw { code: 'BAD_REQUEST', message: 'License expiry must be a valid future date', status: 400 };
  }
}


    // Create user
    const userData = {
      nic: nic.trim(),
      password, // Will be hashed by pre-save middleware
      name: name.trim(),
      contact: contact ? contact.trim() : undefined,
      role,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined
    };

    const user = new User(userData);
    await user.save();

    return { 
      userId: user._id, 
      nic: user.nic,
      name: user.name,
      role: user.role,
      bootstrap: isFirstUser,
      message: isFirstUser ? 'First ADMIN user created successfully' : 'User created successfully'
    };
  } catch (err) {
    console.error('Create user error:', err);
    
    if (err.code === 11000) {
      throw { code: 'NIC_EXISTS', message: 'NIC already exists', status: 400 };
    }
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      throw { code: 'VALIDATION_ERROR', message: errors.join(', '), status: 400 };
    }
    
    // Re-throw our custom errors
    if (err.code && err.status) {
      throw err;
    }
    
    throw { code: 'SERVER_ERROR', message: 'Server error', status: 500 };
  }
}

module.exports = { login, createUser };