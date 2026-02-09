const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

process.env.JWT_SECRET = 'test-secret-key';

// In-memory storage
const users = [];
const auditLogs = [];

// Helper functions
const createToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
  // Create admin user
  const adminPass = await bcrypt.hash('admin123', 10);
  users.push({
    id: 1,
    nic: '199011111111',
    password: adminPass,
    name: 'Admin User',
    role: 'ADMIN'
  });

  // Create some audit logs
  auditLogs.push(
    {
      logId: 'AUDIT-001',
      userId: 1,
      role: 'ADMIN',
      action: 'LOGIN',
      timestamp: new Date('2024-01-01'),
      ip: '127.0.0.1'
    },
    {
      logId: 'AUDIT-002',
      userId: 1,
      role: 'ADMIN',
      action: 'CREATE_USER',
      timestamp: new Date('2024-01-02'),
      ip: '127.0.0.1'
    }
  );
});

// Get audit logs
app.get('/audit/logs', authenticate, roleGuard('ADMIN'), (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, role, action } = req.query;
    
    let filteredLogs = [...auditLogs];

    // Apply filters
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }
    
    if (role) {
      filteredLogs = filteredLogs.filter(log => log.role === role);
    }
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

describe('Audit API Tests', () => {
  let adminToken;

  beforeEach(() => {
    adminToken = createToken(1, 'ADMIN');
  });

  it('should get audit logs as ADMIN', async () => {
    const response = await request(app)
      .get('/audit/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.logs)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });

  it('should filter logs by date range', async () => {
    const response = await request(app)
      .get('/audit/logs?startDate=2024-01-01&endDate=2024-01-02')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.logs.length).toBeGreaterThan(0);
  });

  it('should filter logs by action', async () => {
    const response = await request(app)
      .get('/audit/logs?action=LOGIN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.logs.every(log => log.action === 'LOGIN')).toBe(true);
  });

  it('should reject without ADMIN role', async () => {
    const nurseToken = createToken(2, 'NURSE');
    
    const response = await request(app)
      .get('/audit/logs')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(response.status).toBe(403);
  });
});