const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nic: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  contact: { 
    type: String,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['ADMIN', 'MODERATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB'], 
    required: true 
  },
  licenseExpiry: { 
    type: Date,
    validate: {
      validator: function(value) {
        // Only validate if role is DOCTOR or NURSE
        if (this.role === 'DOCTOR' || this.role === 'NURSE') {
          return value && new Date(value) > new Date();
        }
        return true;
      },
      message: 'License must be a future date for DOCTOR and NURSE roles'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// -----------------------------
// Password hashing middleware
// -----------------------------
UserSchema.pre('save', async function() {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// -----------------------------
// Update timestamp on update
// -----------------------------
UserSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

// -----------------------------
// Compare password method
// -----------------------------
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// -----------------------------
// Static method to check if any users exist (for bootstrap)
// -----------------------------
UserSchema.statics.isEmpty = async function() {
  const count = await this.countDocuments();
  return count === 0;
};

module.exports = mongoose.model('User', UserSchema);
