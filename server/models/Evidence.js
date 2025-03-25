const mongoose = require("mongoose");

const remarkSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // Changed from "User" to "Staff"
    required: true,
  },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const evidenceSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true,
  },
  item: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  photo: { type: String },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // Changed from "User" to "Staff"
    required: true,
  },
  remarks: [remarkSchema],
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Evidence", evidenceSchema);
