const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config({ path: "./server/.env" });

// Import routes
const authRoutes = require("./routes/auth");
const evidenceRoutes = require("./routes/evidence");
const caseRoutes = require("./routes/cases");
const blogRoutes = require("./routes/blog");

// Enable CORS for all routes
app.use(
  cors({
    origin: "https://forensic-tracker-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
console.log("CORS middleware applied");

// Handle preflight OPTIONS requests
app.options(
  "*",
  cors({
    origin: "https://forensic-tracker-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
console.log("OPTIONS handler applied");

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/evidence", evidenceRoutes);
app.use("/cases", caseRoutes);
app.use("/blog", blogRoutes);

// Basic routes
app.get("/", (req, res) => {
  console.log("GET / request received");
  res.send("Forensic Evidence Tracker API is running!");
});

const { authMiddleware } = require("./middleware/authMiddleware");
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
