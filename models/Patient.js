const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, required: true, immutable: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  nic: { type: String, unique: true, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['M', 'F', 'X'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);
