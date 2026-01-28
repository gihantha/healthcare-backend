const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Login route
router.post('/login', async (req, res) => {
  const { nic, password } = req.body;
  const user = await User.findOne({ nic });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  // License expiry check for DOCTOR/NURSE
  if ((user.role === 'DOCTOR' || user.role === 'NURSE') && user.licenseExpiry && new Date(user.licenseExpiry) < new Date()) {
    return res.status(403).json({ error: 'License expired' });
  }
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'jwt_secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'jwt_secret', { expiresIn: '7d' });
  res.json({ accessToken, refreshToken, role: user.role });
});

// Admin creates user
router.post('/create-user', async (req, res) => {
  // Only ADMIN can create users (should be protected by roleGuard in real app)
  const { nic, password, name, contact, role, licenseExpiry } = req.body;
  try {
    const user = new User({ nic, password, name, contact, role, licenseExpiry });
    await user.save();
    res.json({ success: true, userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
