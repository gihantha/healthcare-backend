// utils/response.js
exports.success = (res, data, message = "") => {
  return res.json({ success: true, message, data });
};

exports.error = (res, errorCode, message, status = 400) => {
  return res.status(status).json({ success: false, errorCode, message });
};
