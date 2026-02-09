const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

process.env.JWT_SECRET = 'test-secret-key';
process.env.QR_SECRET = 'test-qr-secret';

// In-memory storage
const users = [];
const patients = [];
const visits = [];
const medicalRecords = [];
const prescriptions = [];

// Helper functions
const createToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const createQRToken = (patientId, visitId) => {
  return jwt.sign(
    { patientId, visitId, exp: Math.floor(Date.now() / 1000) + 3600 },
    process.env.QR_SECRET
  );
};

// Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

const qrValidator = (req, res, next) => {
  const qrToken = req.headers["x-qr-token"];
  if (!qrToken) return res.status(401).json({ error: "QR token required" });

  try {
    const payload = jwt.verify(qrToken, process.env.QR_SECRET);
    
    const visit = visits.find(v => v.visitId === payload.visitId);
    if (!visit || visit.closed) {
      return res.status(401).json({ error: "Visit closed or not found" });
    }

    req.qrPayload = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid QR token" });
  }
};

// Setup before tests
beforeAll(async () => {
  // Create doctor user
  const doctorPass = await bcrypt.hash('doctor123', 10);
  users.push({
    id: 1,
    nic: '199011111111',
    password: doctorPass,
    name: 'Doctor User',
    role: 'DOCTOR',
    licenseExpiry: new Date('2030-12-31')
  });

  // Create patient
  patients.push({
    patientId: 'P-TEST-001',
    name: 'Test Patient',
    nic: '199022222222',
    dob: new Date('1990-01-01'),
    gender: 'M'
  });

  // Create active visit
  const visitId = 'V-TEST-001';
  visits.push({
    visitId,
    patientId: 'P-TEST-001',
    unit: 'OPD',
    createdAt: new Date(),
    closed: false
  });

  // Create some medical records
  medicalRecords.push({
    recordId: 'MR-001',
    patientId: 'P-TEST-001',
    visitId: 'V-PREV-001',
    diagnosis: 'Common Cold',
    prescriptions: [],
    createdAt: new Date('2023-01-01')
  });
});

// Get patient history
app.get('/doctor/history', authenticate, roleGuard('DOCTOR'), qrValidator, (req, res) => {
  try {
    const patientId = req.qrPayload.patientId;
    const records = medicalRecords.filter(record => record.patientId === patientId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add medical record
app.post('/doctor/add-record', authenticate, roleGuard('DOCTOR'), qrValidator, (req, res) => {
  try {
    const { patientId, visitId } = req.qrPayload;
    const { diagnosis, prescriptions, notes } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ error: "Diagnosis is required" });
    }

    const recordId = `MR-${uuidv4().slice(0, 8)}`;
    const newRecord = {
      recordId,
      patientId,
      visitId,
      diagnosis,
      prescriptions: prescriptions || [],
      notes,
      createdBy: req.user.userId,
      createdAt: new Date()
    };

    medicalRecords.push(newRecord);

    let prescriptionId = null;
    if (prescriptions && prescriptions.length > 0) {
      prescriptionId = `RX-${uuidv4().slice(0, 8)}`;
      prescriptions.push({
        prescriptionId,
        visitId,
        patientId,
        medicines: prescriptions,
        issued: false,
        createdAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      data: { prescriptionId },
      message: "Medical record added successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

describe('Doctor API Tests', () => {
  let doctorToken;
  let qrToken;

  beforeEach(() => {
    doctorToken = createToken(1, 'DOCTOR');
    qrToken = createQRToken('P-TEST-001', 'V-TEST-001');
  });

  describe('GET /doctor/history', () => {
    it('should get patient history with valid QR token', async () => {
      const response = await request(app)
        .get('/doctor/history')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('x-qr-token', qrToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject without QR token', async () => {
      const response = await request(app)
        .get('/doctor/history')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('QR token required');
    });

    it('should reject with invalid role', async () => {
      const nurseToken = createToken(2, 'NURSE');
      
      const response = await request(app)
        .get('/doctor/history')
        .set('Authorization', `Bearer ${nurseToken}`)
        .set('x-qr-token', qrToken);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /doctor/add-record', () => {
    it('should add medical record successfully', async () => {
      const medicalData = {
        diagnosis: 'Fever',
        prescriptions: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: '3 times daily',
            duration: '3 days'
          }
        ],
        notes: 'Patient should rest'
      };

      const response = await request(app)
        .post('/doctor/add-record')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('x-qr-token', qrToken)
        .send(medicalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('prescriptionId');
    });

    it('should reject without diagnosis', async () => {
      const response = await request(app)
        .post('/doctor/add-record')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('x-qr-token', qrToken)
        .send({
          prescriptions: [{ name: 'Medicine' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Diagnosis is required');
    });
  });
});