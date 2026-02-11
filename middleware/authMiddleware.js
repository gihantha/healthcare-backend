//middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res
      .status(401)
      .json({ code: "NO_TOKEN", message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  if (!token)
    return res
      .status(401)
      .json({ code: "NO_TOKEN", message: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // attach user to request
    next();
  } catch {
    return res
      .status(403)
      .json({ code: "INVALID_TOKEN", message: "Invalid token" });
  }
};
