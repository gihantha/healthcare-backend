//tests/patient.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

process.env.JWT_SECRET = "test-secret-key";

// In-memory storage
const users = [];
const patients = [];

// Helper to create JWT token
const createToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Mock middleware
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

  // Create moderator user
  const modPass = await bcrypt.hash("mod123", 10);
  users.push({
    id: 2,
    nic: "199022222222",
    password: modPass,
    name: "Moderator User",
    role: "MODERATOR",
  });
});

// Register patient endpoint
app.post(
  "/patient/register",
  authenticate,
  roleGuard("NURSE", "MODERATOR"),
  (req, res) => {
    try {
      const { name, address, phone, nic } = req.body;

      if (!nic || !name) {
        return res.status(400).json({
          error: "NIC and name are required",
        });
      }

      // Check for duplicate NIC
      if (patients.find((p) => p.nic === nic)) {
        return res.status(400).json({ error: "NIC already exists" });
      }

      // Simple NIC parsing
      let dob = new Date("1990-01-01");
      let gender = "M";
      if (nic.length === 12) {
        const year = parseInt(nic.slice(0, 4));
        const day = parseInt(nic.slice(4, 7));
        dob = new Date(year, 0, day > 500 ? day - 500 : day);
        gender = day > 500 ? "F" : "M";
      }

      const patient = {
        patientId: `P-${uuidv4()}`,
        name,
        address,
        phone,
        nic,
        dob,
        gender,
        createdAt: new Date(),
      };

      patients.push(patient);

      res.status(201).json({
        success: true,
        data: { patientId: patient.patientId },
        message: "Patient registered successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Search patient endpoint
app.get(
  "/patient/search",
  authenticate,
  roleGuard("NURSE", "MODERATOR", "DOCTOR"),
  (req, res) => {
    try {
      const { nic } = req.query;

      if (!nic) {
        return res.status(400).json({ error: "NIC is required" });
      }

      const patient = patients.find((p) => p.nic === nic);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.json({
        patientId: patient.patientId,
        name: patient.name,
        phone: patient.phone,
        address: patient.address,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

describe("Patient Management Tests", () => {
  beforeEach(() => {
    patients.length = 0;
  });

  it("should register patient successfully", async () => {
    const nurseToken = createToken(1, "NURSE");

    const response = await request(app)
      .post("/patient/register")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        name: "John Doe",
        address: "123 Main St",
        phone: "0712345678",
        nic: "199012345678",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("patientId");
  });

  it("should search patient by NIC", async () => {
    const nurseToken = createToken(1, "NURSE");

    // First register a patient
    await request(app)
      .post("/patient/register")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        name: "Jane Doe",
        nic: "199011111111",
      });

    // Then search for the patient
    const response = await request(app)
      .get("/patient/search?nic=199011111111")
      .set("Authorization", `Bearer ${nurseToken}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Jane Doe");
  });

  it("should reject duplicate NIC registration", async () => {
    const nurseToken = createToken(1, "NURSE");

    // First registration
    await request(app)
      .post("/patient/register")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        name: "Patient One",
        nic: "199022222222",
      });

    // Try duplicate
    const response = await request(app)
      .post("/patient/register")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        name: "Patient Two",
        nic: "199022222222",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("NIC already exists");
  });
});
