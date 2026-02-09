// models/MedicalRecord.js
const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema({
  patientId: { type: String, required: true, ref: "Patient" },
  visitId: { type: String, required: true, ref: "Visit" },
  diagnosis: { type: String },
  prescriptions: [
    {
      medicine: String,
      dosage: String,
      frequency: String,
      duration: String,
      notes: String,
    },
  ],
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
