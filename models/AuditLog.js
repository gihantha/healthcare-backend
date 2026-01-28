const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true }
}, {
  versionKey: false,
  strict: true,
  collection: 'auditlogs',
  // Prevent deletion/modification via schema hooks
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
