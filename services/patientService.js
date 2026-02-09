// services/patientService.js
const Patient = require("../models/Patient");
const parseNIC = require("../utils/nicParser");
const { v4: uuidv4 } = require("uuid");
const AuditLog = require("../models/AuditLog");

async function registerPatient({ name, address, phone, nic }) {
  if (!nic || !name) {
    throw {
      code: "BAD_REQUEST",
      message: "NIC and name are required",
      status: 400,
    };
  }

  if (await Patient.findOne({ nic })) {
    throw { code: "NIC_EXISTS", message: "NIC already exists", status: 400 };
  }

  const { dob, gender } = parseNIC(nic);

  const patientId = `P-${uuidv4()}`;

  const patient = new Patient({
    patientId,
    name,
    address,
    phone,
    nic,
    dob,
    gender,
  });
  await patient.save();
  return patient;
}

async function searchPatientByNIC(nic) {
  if (!nic) {
    throw { code: "BAD_REQUEST", message: "NIC is required", status: 400 };
  }

  const patient = await Patient.findOne({ nic }).select(
    "patientId name address phone nic dob gender"
  );

  if (!patient) {
    throw {
      code: "PATIENT_NOT_FOUND",
      message: "Patient not found",
      status: 404,
    };
  }

  return patient;
}

async function reissuePatientId(nic, userId, userRole, ip) {
  const patient = await Patient.findOne({ nic }).select(
    "patientId name dob gender nic"
  );

  if (!patient) {
    throw {
      code: "PATIENT_NOT_FOUND",
      message: "Patient not found",
      status: 404,
    };
  }

  // Create audit log for reissue action
  await AuditLog.create({
    userId,
    role: userRole,
    action: "REISSUE_PATIENT_ID",
    timestamp: new Date(),
    ip,
    details: { patientId: patient.patientId, nic },
  });

  return {
    patientId: patient.patientId,
    name: patient.name,
    gender: patient.gender,
    dateOfBirth: patient.dob,
  };
}

module.exports = {
  registerPatient,
  searchPatientByNIC,
  reissuePatientId,
};
