const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  profilePicture: { type: String }, // Add profile picture field
});

module.exports = mongoose.model("Staff", staffSchema);
