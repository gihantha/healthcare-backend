// controllers/authController.js
const authService = require('../services/authService');
const { success, error } = require('../utils/response');

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, err.code || 'SERVER_ERROR', err.message || 'Server error', err.status || 500);
  }
};

exports.createUser = async (req, res) => {
  try {
    console.log('Create user request:', {
      body: req.body,
      user: req.user
    });

    const result = await authService.createUser(req.body, req.user);
    return success(res, result, result.message, 201);
  } catch (err) {
    console.error('🔥 FULL createUser error:', err); // Log full error
    return error(
      res,
      err.code || 'SERVER_ERROR',
      err.message || err.toString() || 'Server error',
      err.status || 500
    );
  }
};


exports.refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    console.error('Refresh token error:', err);
    return error(res, err.code || 'SERVER_ERROR', err.message || 'Server error', err.status || 500);
  }
};