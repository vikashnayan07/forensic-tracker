const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

// Secret key for admin registration (store in .env later)
// const ADMIN_SECRET = "Vikash99398@"; // Replace with env variable in production

// Register first admin (requires secret key)
router.post("/register-admin", async (req, res) => {
  try {
    const { name, email, password, secret } = req.body;

    // Check if an admin already exists
    const existingAdmin = await Staff.findOne({ isAdmin: true });
    if (existingAdmin) {
      return res.status(403).json({
        message:
          "An admin already exists. Use admin credentials to manage staff.",
      });
    }

    // Verify secret key
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ message: "Invalid admin secret key" });
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Staff({
      name,
      email,
      password: hashedPassword,
      isAdmin: true,
      isApproved: true, // Admin is auto-approved
    });
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ message: "Admin registered successfully", token });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering admin", error: err.message });
  }
});
// Get logged-in user's profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select("-password");
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(staff);
  } catch (err) {
    console.error("Error in GET /auth/profile:", err);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: err.message });
  }
});

// Register staff (public)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = new Staff({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      isApproved: false,
    });
    await staff.save();

    res
      .status(201)
      .json({ message: "Registration submitted, awaiting admin approval" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering staff", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!staff.isApproved)
      return res
        .status(403)
        .json({ message: "Account awaiting admin approval" });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, email: staff.email, isAdmin: staff.isAdmin });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Get all staff (Admin only)
router.get("/staff", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const staff = await Staff.find({}, "name email isAdmin isApproved");
    res.json(staff);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching staff", error: err.message });
  }
});

// Get pending staff (Admin only)
router.get("/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingStaff = await Staff.find(
      { isApproved: false },
      "name email isAdmin isApproved"
    );
    res.json(pendingStaff);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching pending staff", error: err.message });
  }
});

// Approve/Unapprove staff (Admin only)
router.patch(
  "/approve/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { isApproved } = req.body; // Expect isApproved: true/false from request body
      const staff = await Staff.findById(req.params.id);
      if (!staff) return res.status(404).json({ message: "Staff not found" });
      if (staff.isAdmin)
        return res
          .status(403)
          .json({ message: "Cannot modify admin approval status" });

      staff.isApproved = isApproved !== undefined ? isApproved : true; // Default to approve if not specified
      await staff.save();
      res.json({
        message: `Staff ${staff.isApproved ? "approved" : "unapproved"}`,
        staff,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error updating staff approval", error: err.message });
    }
  }
);

// Update staff (Admin only)
router.patch(
  "/staff/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, email, isAdmin } = req.body;
      const staff = await Staff.findById(req.params.id);
      if (!staff) return res.status(404).json({ message: "Staff not found" });

      if (name) staff.name = name;
      if (email) staff.email = email;
      if (typeof isAdmin === "boolean") staff.isAdmin = isAdmin;

      await staff.save();
      res.json({ message: "Staff updated", staff });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error updating staff", error: err.message });
    }
  }
);

// Delete staff (Admin only)
router.delete(
  "/staff/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const staff = await Staff.findByIdAndDelete(req.params.id);
      if (!staff) return res.status(404).json({ message: "Staff not found" });
      res.json({ message: "Staff deleted" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error deleting staff", error: err.message });
    }
  }
);

module.exports = router;
