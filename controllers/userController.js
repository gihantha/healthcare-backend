// controllers/userController.js
const User = require("../models/User");
const { success, error } = require("../utils/response");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password -__v")
      .lean();
    
    if (!user) {
      return error(res, "USER_NOT_FOUND", "User not found", 404);
    }

    return success(res, user);
  } catch (err) {
    console.error(err);
    return error(res, "SERVER_ERROR", "Server error", 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, contact } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return error(res, "USER_NOT_FOUND", "User not found", 404);
    }

    if (name) user.name = name;
    if (contact) user.contact = contact;
    
    await user.save();
    
    // Remove sensitive data
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;
    
    return success(res, userData, "Profile updated successfully");
  } catch (err) {
    console.error(err);
    return error(res, "SERVER_ERROR", "Server error", 500);
  }
};