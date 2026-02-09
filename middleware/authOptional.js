// middleware/authOptional.js
const jwt = require("jsonwebtoken");

module.exports = function authOptional(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || "jwt_secret");
    req.user = payload;
  } catch {
    req.user = null;
  }
  next();
};
