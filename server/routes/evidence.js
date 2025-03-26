const express = require("express");
const router = express.Router();
const Evidence = require("../models/Evidence");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
});

// Set up multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "forensic-tracker/evidence",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png) and PDFs are allowed"));
  },
});

// Multer error handling middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Create evidence
router.post(
  "/",
  authMiddleware,
  upload.single("photo"),
  multerErrorHandler,
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      const { caseId, description, item, location } = req.body;
      if (!caseId || !description || !item || !location) {
        return res.status(400).json({
          message: "Case ID, description, item, and location are required",
        });
      }

      const newEvidence = new Evidence({
        caseId,
        description,
        item,
        location,
        photo: req.file ? req.file.path : null, // Cloudinary URL
        uploadedBy: req.user.id,
      });
      await newEvidence.save();
      console.log("Created evidence:", newEvidence);
      res
        .status(201)
        .json({ message: "Evidence uploaded", evidence: newEvidence });
    } catch (err) {
      console.error("Error in POST /evidence:", err);
      res
        .status(500)
        .json({ message: "Error uploading evidence", error: err.message });
    }
  }
);

// Get all evidence (with pagination, search, and filter)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const caseId = req.query.caseId || "";

    let query = {};
    if (search) {
      query.$or = [
        { item: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "caseId.caseId": { $regex: search, $options: "i" } },
      ];
    }
    if (caseId) {
      query.caseId = caseId;
    }

    const total = await Evidence.countDocuments(query);
    const evidence = await Evidence.find(query)
      .populate("caseId", "caseId")
      .populate("uploadedBy", "name")
      .skip(skip)
      .limit(limit);

    res.json({
      evidence,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    console.error("Error in GET /evidence:", err);
    res
      .status(500)
      .json({ message: "Error fetching evidence", error: err.message });
  }
});

// Get single evidence by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id).populate(
      "uploadedBy",
      "name email"
    );
    if (!evidence)
      return res.status(404).json({ message: "Evidence not found" });
    res.json(evidence);
  } catch (err) {
    console.error("Error in GET /evidence/:id:", err);
    res
      .status(500)
      .json({ message: "Error fetching evidence", error: err.message });
  }
});

// Add remark to evidence
router.post("/:id/remarks", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Remark text is required" });
    const evidenceItem = await Evidence.findById(req.params.id);
    if (!evidenceItem)
      return res.status(404).json({ message: "Evidence not found" });
    evidenceItem.remarks.push({ staffId: req.user.id, text });
    await evidenceItem.save();
    const updatedEvidence = await Evidence.findById(req.params.id)
      .populate("caseId", "caseId")
      .populate("uploadedBy", "name email")
      .populate("remarks.staffId", "name email");
    res.json({
      message: "Remark added to evidence",
      evidence: updatedEvidence,
    });
  } catch (err) {
    console.error("Error in POST /evidence/:id/remarks:", err);
    res
      .status(500)
      .json({ message: "Error adding remark to evidence", error: err.message });
  }
});

// Update evidence (Staff who created it)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { item, description, location } = req.body;
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence)
      return res.status(404).json({ message: "Evidence not found" });
    if (evidence.uploadedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this evidence" });
    }
    evidence.item = item || evidence.item;
    evidence.description = description || evidence.description;
    evidence.location = location || evidence.location;
    await evidence.save();
    res.json({ message: "Evidence updated", evidence });
  } catch (err) {
    console.error("Error in PUT /evidence/:id:", err);
    res
      .status(500)
      .json({ message: "Error updating evidence", error: err.message });
  }
});

// Update evidence (Admin only, with photo support)
router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("photo"),
  multerErrorHandler,
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      const { item, description, location, caseId } = req.body;
      const evidence = await Evidence.findById(req.params.id);
      if (!evidence)
        return res.status(404).json({ message: "Evidence not found" });

      // If a new photo is uploaded, delete the old one from Cloudinary
      if (req.file && evidence.photo) {
        const publicId = evidence.photo.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(
          `forensic-tracker/evidence/${publicId}`
        );
      }

      evidence.item = item || evidence.item;
      evidence.description = description || evidence.description;
      evidence.location = location || evidence.location;
      evidence.caseId = caseId || evidence.caseId;
      if (req.file) {
        evidence.photo = req.file.path; // Cloudinary URL
      }

      await evidence.save();
      const populatedEvidence = await Evidence.findById(evidence._id)
        .populate("uploadedBy", "name email")
        .populate("caseId", "caseId status");
      console.log("Updated evidence:", populatedEvidence);
      res.json({ message: "Evidence updated", evidence: populatedEvidence });
    } catch (err) {
      console.error("Error in PATCH /evidence/:id:", err);
      res
        .status(500)
        .json({ message: "Error updating evidence", error: err.message });
    }
  }
);

// Delete evidence (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence)
      return res.status(404).json({ message: "Evidence not found" });

    // Delete the photo from Cloudinary if it exists
    if (evidence.photo) {
      const publicId = evidence.photo.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(
        `forensic-tracker/evidence/${publicId}`
      );
    }

    await Evidence.findByIdAndDelete(req.params.id);
    res.json({ message: "Evidence deleted" });
  } catch (err) {
    console.error("Error in DELETE /evidence/:id:", err);
    res
      .status(500)
      .json({ message: "Error deleting evidence", error: err.message });
  }
});

module.exports = router;
