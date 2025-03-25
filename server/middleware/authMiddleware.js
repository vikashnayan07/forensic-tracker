const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await Staff.findById(decoded.id);
    if (!staff) return res.status(401).json({ message: "Invalid token" });
    req.user = staff;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
