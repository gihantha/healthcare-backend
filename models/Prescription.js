const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, unique: true, required: true },
  visitId: { type: String, required: true, ref: 'Visit' },
  patientId: { type: String, required: true, ref: 'Patient' },
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  issued: { type: Boolean, default: false },
  issuedAt: { type: Date },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
