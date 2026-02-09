// services/visitService.js
const Visit = require("../models/Visit");
const Patient = require("../models/Patient");
const { v4: uuidv4 } = require("uuid");
const generateVisitQR = require("../utils/qrGenerator");

async function createVisit({ patientId, unit }) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    throw {
      code: "PATIENT_NOT_FOUND",
      message: "Patient not found",
      status: 404,
    };
  }

  const visitId = `V-${uuidv4()}`;
  const visit = new Visit({ visitId, patientId, unit });
  await visit.save();

  const { token, qrData } = await generateVisitQR({ patientId, visitId });
  return { visitId, qrToken: token, qrImage: qrData };
}

async function closeVisit(visitId) {
  const visit = await Visit.findOne({ visitId });
  if (!visit) {
    throw { code: "VISIT_NOT_FOUND", message: "Visit not found", status: 404 };
  }

  if (visit.closed) {
    throw {
      code: "VISIT_ALREADY_CLOSED",
      message: "Visit already closed",
      status: 400,
    };
  }

  visit.closed = true;
  visit.closedAt = new Date();
  await visit.save();

  return { success: true, visitId, closedAt: visit.closedAt };
}

module.exports = { createVisit, closeVisit };
