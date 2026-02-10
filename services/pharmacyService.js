// services/pharmacyService.js
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const notify = require("../utils/notifier");

async function getPrescription(prescriptionId) {
  const prescription = await Prescription.findOne({ prescriptionId });
  if (!prescription) {
    throw { code: "NOT_FOUND", message: "Prescription not found", status: 404 };
  }
  return {
    prescriptionId: prescription.prescriptionId,
    medicines: prescription.medicines,
    issued: prescription.issued,
    issuedAt: prescription.issuedAt,
  };
}

async function getPrescriptionByQR(visitId) {
  const prescription = await Prescription.findOne({ visitId });
  if (!prescription) {
    throw {
      code: "PRESCRIPTION_NOT_FOUND",
      message: "No prescription found for this visit",
      status: 404,
    };
  }

  return {
    prescriptionId: prescription.prescriptionId,
    medicines: prescription.medicines,
    issued: prescription.issued,
    issuedAt: prescription.issuedAt,
  };
}

async function issuePrescription(prescriptionId, user) {
  const prescription = await Prescription.findOne({ prescriptionId });
  if (!prescription)
    throw { code: "NOT_FOUND", message: "Prescription not found", status: 404 };
  if (prescription.issued)
    throw { code: "ALREADY_ISSUED", message: "Already issued", status: 400 };

  prescription.issued = true;
  prescription.issuedAt = new Date();
  prescription.issuedBy = user.userId;
  await prescription.save();

  // Close the visit
  await closeVisit(prescription.visitId);

  const patient = await Patient.findOne({ patientId: prescription.patientId });
  if (patient && patient.phone) {
    notify({
      to: patient.phone,
      type: "sms",
      message: `Prescription ${prescriptionId} has been issued.`,
    });
  }

  return {
    prescriptionId: prescription.prescriptionId,
    issuedAt: prescription.issuedAt,
    visitClosed: true,
  };
}

async function issuePrescriptionByQR(visitId, user) {
  const prescription = await Prescription.findOne({ visitId });
  if (!prescription)
    throw { code: "NOT_FOUND", message: "Prescription not found", status: 404 };

  return issuePrescription(prescription.prescriptionId, user);
}

async function closeVisit(visitId) {
  const visit = await Visit.findOne({ visitId });
  if (!visit) return;

  if (!visit.closed) {
    visit.closed = true;
    visit.closedAt = new Date();
    await visit.save();
  }
}

module.exports = {
  getPrescription,
  issuePrescription,
  getPrescriptionByQR,
  issuePrescriptionByQR,
};
