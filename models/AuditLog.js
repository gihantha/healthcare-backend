// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, required: true },
    action: { type: String, required: true },
    visitId: { type: String },
    timestamp: { type: Date, default: Date.now, immutable: true },
    ip: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  {
    versionKey: false,
    strict: true,
    collection: "auditlogs",
  }
);

// Prevent updates and deletions
AuditLogSchema.pre(
  ["updateOne", "findOneAndUpdate", "deleteOne", "findOneAndDelete"],
  function () {
    throw new Error(
      "Audit logs are immutable and cannot be modified or deleted"
    );
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
