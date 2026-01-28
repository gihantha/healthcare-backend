const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nic: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  contact: { type: String },
  role: { type: String, enum: ['ADMIN', 'MODERATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB'], required: true },
  licenseExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
