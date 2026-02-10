const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

process.env.JWT_SECRET = "test-secret-key";
process.env.QR_SECRET = "test-qr-secret";

// In-memory storage
const users = [];
const patients = [];
const visits = [];

// Helper functions
const createToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
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

// Setup before tests
beforeAll(async () => {
  // Create nurse user
  const nursePass = await bcrypt.hash("nurse123", 10);
  users.push({
    id: 1,
    nic: "199011111111",
    password: nursePass,
    name: "Nurse User",
    role: "NURSE",
  });

  // Create test patient
  patients.push({
    patientId: "P-VISIT-001",
    name: "Visit Patient",
    nic: "199022222222",
  });
});

// Create visit endpoint
app.post(
  "/visit/create",
  authenticate,
  roleGuard("NURSE", "MODERATOR"),
  (req, res) => {
    try {
      const { patientId, unit } = req.body;

      if (!patientId || !unit) {
        return res
          .status(400)
          .json({ error: "patientId and unit are required" });
      }

      // Check if patient exists
      const patient = patients.find((p) => p.patientId === patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const visitId = `V-${uuidv4().slice(0, 8)}`;
      const newVisit = {
        visitId,
        patientId,
        unit,
        createdAt: new Date(),
        closed: false,
      };

      visits.push(newVisit);

      // Generate QR token
      const qrToken = jwt.sign(
        { patientId, visitId, exp: Math.floor(Date.now() / 1000) + 3600 },
        process.env.QR_SECRET
      );

      res.status(201).json({
        success: true,
        data: {
          visitId,
          qrToken,
          qrImage: `data:image/png;base64,mock-qr-${qrToken}`,
        },
        message: "Visit created successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

describe("Visit Management Tests", () => {
  let nurseToken;

  beforeEach(() => {
    nurseToken = createToken(1, "NURSE");
  });

  it("should create visit successfully", async () => {
    const response = await request(app)
      .post("/visit/create")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        patientId: "P-VISIT-001",
        unit: "OPD",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("visitId");
    expect(response.body.data).toHaveProperty("qrToken");
    expect(response.body.data).toHaveProperty("qrImage");
  });

  it("should create visit for SPECIAL unit", async () => {
    const response = await request(app)
      .post("/visit/create")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        patientId: "P-VISIT-001",
        unit: "SPECIAL",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.visitId).toBeDefined();
  });

  it("should reject with invalid patient ID", async () => {
    const response = await request(app)
      .post("/visit/create")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        patientId: "INVALID-ID",
        unit: "OPD",
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Patient not found");
  });

  it("should reject without proper role", async () => {
    const doctorToken = createToken(2, "DOCTOR");

    const response = await request(app)
      .post("/visit/create")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: "P-VISIT-001",
        unit: "OPD",
      });

    expect(response.status).toBe(403);
  });
});
