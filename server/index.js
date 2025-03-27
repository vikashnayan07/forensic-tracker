const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
require("dotenv").config({ path: "./server/.env" });

// Import routes
const authRoutes = require("./routes/auth");
const evidenceRoutes = require("./routes/evidence");
const caseRoutes = require("./routes/cases");
const blogRoutes = require("./routes/blog");
const newsRoutes = require("./routes/news");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Global error handling for uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Global error handling for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Enable CORS for all routes
const corsOptions = {
  origin: "https://forensic-tracker-frontend.onrender.com",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware to all routes, including OPTIONS
app.use(cors(corsOptions));

// Log CORS middleware application
console.log("CORS middleware applied with options:", corsOptions);

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} request received`);
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.url} responded with status: ${res.statusCode}`
    );
  });
  next();
});

app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Routes without /api prefix
app.use("/auth", authRoutes);
app.use("/evidence", evidenceRoutes);
app.use("/cases", caseRoutes);
app.use("/blog", blogRoutes);
app.use("/news", newsRoutes);

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

// Error handling middleware for Express
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
