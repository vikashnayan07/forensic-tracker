const express = require("express");
const app = express();
require("dotenv").config();

// Basic route to test server
app.get("/", (req, res) => {
  res.send("Forensic Evidence Tracker API is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
