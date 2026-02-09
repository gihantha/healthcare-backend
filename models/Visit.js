// models/Visit.js
const mongoose = require("mongoose");

const VisitSchema = new mongoose.Schema({
  visitId: { type: String, unique: true, required: true },
  patientId: { type: String, required: true, ref: "Patient" },
  unit: { type: String, enum: ["OPD", "SPECIAL"], required: true },
  createdAt: { type: Date, default: Date.now },
  closed: { type: Boolean, default: false },
  closedAt: { type: Date },
});

module.exports = mongoose.model("Visit", VisitSchema);
