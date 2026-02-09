// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  nic: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  contact: { type: String },
  role: {
    type: String,
    enum: ["ADMIN", "MODERATOR", "DOCTOR", "NURSE", "PHARMACIST", "LAB"],
    required: true,
  },
  licenseExpiry: {
    type: Date,
    validate: {
      validator: function (value) {
        // Only validate if role is DOCTOR or NURSE
        if (this.role === "DOCTOR" || this.role === "NURSE") {
          return value && new Date(value) > new Date();
        }
        return true;
      },
      message: "License must be a future date for DOCTOR and NURSE roles",
    },
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
