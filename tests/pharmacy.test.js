// tests/pharmacy.test.js
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
const prescriptions = [];
const patients = [];

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
  // Create pharmacist user
  const pharmPass = await bcrypt.hash("pharmacy123", 10);
  users.push({
    id: 1,
    nic: "199011111111",
    password: pharmPass,
    name: "Pharmacist User",
    role: "PHARMACIST",
  });

  // Create test patient
  patients.push({
    patientId: "P-PHARM-001",
    name: "Pharmacy Patient",
    phone: "0711111111",
    nic: "199022222222",
  });

  // Create test prescription
  prescriptions.push({
    prescriptionId: "RX-TEST-001",
    visitId: "V-TEST-001",
    patientId: "P-PHARM-001",
    medicines: [
      {
        name: "Test Medicine",
        dosage: "10mg",
        frequency: "Daily",
        duration: "7 days",
      },
    ],
    issued: false,
    createdAt: new Date(),
  });
});

// Get prescription details
app.get(
  "/pharmacy/prescription/:prescriptionId",
  authenticate,
  roleGuard("PHARMACIST"),
  (req, res) => {
    try {
      const { prescriptionId } = req.params;
      const prescription = prescriptions.find(
        (p) => p.prescriptionId === prescriptionId
      );

      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      res.json({
        prescriptionId: prescription.prescriptionId,
        medicines: prescription.medicines,
        issued: prescription.issued,
        issuedAt: prescription.issuedAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Issue prescription
app.post(
  "/pharmacy/prescription/:prescriptionId/issue",
  authenticate,
  roleGuard("PHARMACIST"),
  (req, res) => {
    try {
      const { prescriptionId } = req.params;
      const prescription = prescriptions.find(
        (p) => p.prescriptionId === prescriptionId
      );

      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      if (prescription.issued) {
        return res.status(400).json({ error: "Already issued" });
      }

      prescription.issued = true;
      prescription.issuedAt = new Date();
      prescription.issuedBy = req.user.userId;

      res.json({
        success: true,
        prescriptionId: prescription.prescriptionId,
        issuedAt: prescription.issuedAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

describe("Pharmacy API Tests", () => {
  let pharmacistToken;

  beforeEach(() => {
    pharmacistToken = createToken(1, "PHARMACIST");
  });

  describe("GET /pharmacy/prescription/:id", () => {
    it("should get prescription details as PHARMACIST", async () => {
      const response = await request(app)
        .get("/pharmacy/prescription/RX-TEST-001")
        .set("Authorization", `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.prescriptionId).toBe("RX-TEST-001");
      expect(response.body.medicines).toHaveLength(1);
      expect(response.body.issued).toBe(false);
    });

    it("should reject without PHARMACIST role", async () => {
      const nurseToken = createToken(2, "NURSE");

      const response = await request(app)
        .get("/pharmacy/prescription/RX-TEST-001")
        .set("Authorization", `Bearer ${nurseToken}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 for non-existent prescription", async () => {
      const response = await request(app)
        .get("/pharmacy/prescription/RX-NOTEXIST")
        .set("Authorization", `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /pharmacy/prescription/:id/issue", () => {
    it("should issue prescription successfully", async () => {
      const response = await request(app)
        .post("/pharmacy/prescription/RX-TEST-001/issue")
        .set("Authorization", `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.prescriptionId).toBe("RX-TEST-001");
      expect(response.body.issuedAt).toBeDefined();
    });

    it("should reject issuing already issued prescription", async () => {
      // First issue
      await request(app)
        .post("/pharmacy/prescription/RX-TEST-001/issue")
        .set("Authorization", `Bearer ${pharmacistToken}`);

      // Try to issue again
      const response = await request(app)
        .post("/pharmacy/prescription/RX-TEST-001/issue")
        .set("Authorization", `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Already issued");
    });
  });
});
