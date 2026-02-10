// middleware/validator.js
const Joi = require("joi");

const schemas = {
  registerPatient: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().max(200).optional(),
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    nic: Joi.string()
      .pattern(/^(\d{9}[VXvx]|\d{12})$/)
      .required(),
  }),

  createUser: Joi.object({
    nic: Joi.string()
      .pattern(/^(\d{9}[VXvx]|\d{12})$/)
      .required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    contact: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    role: Joi.string()
      .valid("ADMIN", "MODERATOR", "DOCTOR", "NURSE", "PHARMACIST", "LAB")
      .required(),
    licenseExpiry: Joi.date()
      .greater("now")
      .when("role", {
        is: Joi.string().valid("DOCTOR", "NURSE"),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
  }),

  login: Joi.object({
    nic: Joi.string().required(),
    password: Joi.string().required(),
  }),

  createVisit: Joi.object({
    patientId: Joi.string().pattern(/^P-/).required(),
    unit: Joi.string().valid("OPD", "SPECIAL").required(),
  }),

  addMedicalRecord: Joi.object({
    diagnosis: Joi.string().required(),
    prescriptions: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          dosage: Joi.string().required(),
          frequency: Joi.string().required(),
          duration: Joi.string().optional(),
          notes: Joi.string().optional(),
        })
      )
      .optional(),
    notes: Joi.string().optional(),
  }),
};

module.exports = (schemaName) => {
  return (req, res, next) => {
    if (!schemas[schemaName]) {
      return next(new Error(`Schema ${schemaName} not found`));
    }

    const { error } = schemas[schemaName].validate(req.body);
    if (error) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }
    next();
  };
};
