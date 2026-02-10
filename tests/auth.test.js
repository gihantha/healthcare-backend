const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Create a simple test app
const app = express();
app.use(express.json());

// Set test environment
process.env.JWT_SECRET = "test-secret";
process.env.QR_SECRET = "test-qr-secret";

// In-memory database for testing
const users = [];

// Mock login endpoint
app.post("/auth/login", async (req, res) => {
  try {
    const { nic, password } = req.body || {};

    if (!nic || !password) {
      return res.status(400).json({
        error: "NIC and password are required",
      });
    }

    const user = users.find((u) => u.nic === nic);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // License expiry check
    if (
      (user.role === "DOCTOR" || user.role === "NURSE") &&
      user.licenseExpiry &&
      new Date(user.licenseExpiry) < new Date()
    ) {
      return res.status(403).json({ error: "License expired" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "45m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ accessToken, refreshToken, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mock create user endpoint
app.post("/auth/create-user", async (req, res) => {
  try {
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const { nic, password, name, contact, role, licenseExpiry } =
      req.body || {};

    if (!nic || !password || !role) {
      return res.status(400).json({
        error: "NIC, password, and role are required",
      });
    }

    // Check duplicate NIC
    if (users.find((u) => u.nic === nic)) {
      return res.status(400).json({ error: "NIC already exists" });
    }

    // Bootstrap mode → first user
    if (adminCount === 0) {
      if (role !== "ADMIN") {
        return res.status(403).json({
          error: "First user must be ADMIN",
        });
      }
    } else {
      // Normal mode → check admin token
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const token = authHeader.split(" ")[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== "ADMIN") {
          return res.status(403).json({ error: "Forbidden" });
        }
      } catch {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      nic,
      password: hashedPassword,
      name: name || "User",
      contact,
      role,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      userId: newUser.id,
      bootstrap: adminCount === 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

describe("Authentication API Tests", () => {
  beforeEach(() => {
    // Clear users array before each test
    users.length = 0;
  });

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      // First create a user
      const hashedPassword = await bcrypt.hash("password123", 10);
      users.push({
        id: 1,
        nic: "199012345678",
        password: hashedPassword,
        name: "Test User",
        role: "ADMIN",
      });

      const response = await request(app).post("/auth/login").send({
        nic: "199012345678",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.role).toBe("ADMIN");
    });

    it("should reject login with invalid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        nic: "wrong",
        password: "wrong",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should reject login with expired license for DOCTOR", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      users.push({
        id: 1,
        nic: "199011111111",
        password: hashedPassword,
        name: "Test Doctor",
        role: "DOCTOR",
        licenseExpiry: new Date("2020-01-01"),
      });

      const response = await request(app).post("/auth/login").send({
        nic: "199011111111",
        password: "password123",
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("License expired");
    });
  });

  describe("POST /auth/create-user", () => {
    it("should create first user as ADMIN without token (bootstrap)", async () => {
      const response = await request(app).post("/auth/create-user").send({
        nic: "199000000001",
        password: "admin123",
        name: "First Admin",
        role: "ADMIN",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.bootstrap).toBe(true);
    });

    it("should create user when ADMIN is logged in", async () => {
      // First create an admin user
      const hashedPassword = await bcrypt.hash("adminpass", 10);
      users.push({
        id: 1,
        nic: "199012345678",
        password: hashedPassword,
        name: "Admin User",
        role: "ADMIN",
      });

      // Get admin token
      const loginResponse = await request(app).post("/auth/login").send({
        nic: "199012345678",
        password: "adminpass",
      });

      const adminToken = loginResponse.body.accessToken;

      const response = await request(app)
        .post("/auth/create-user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nic: "199000000002",
          password: "doctor123",
          name: "Test Doctor",
          role: "DOCTOR",
          licenseExpiry: new Date("2030-12-31"),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject duplicate NIC", async () => {
      // First create an admin user
      const hashedPassword = await bcrypt.hash("adminpass", 10);
      users.push({
        id: 1,
        nic: "199012345678",
        password: hashedPassword,
        name: "Admin User",
        role: "ADMIN",
      });

      // Get admin token
      const loginResponse = await request(app).post("/auth/login").send({
        nic: "199012345678",
        password: "adminpass",
      });

      const adminToken = loginResponse.body.accessToken;

      // Try to create user with duplicate NIC
      const response = await request(app)
        .post("/auth/create-user")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nic: "199012345678", // Already exists
          password: "test123",
          name: "Duplicate",
          role: "DOCTOR",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("NIC already exists");
    });
  });
});
