const express = require("express");
const router = express.Router();
const Case = require("../models/Case");
const Evidence = require("../models/Evidence");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

// Get all cases (Accessible to all authenticated users)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const cases = await Case.find().populate("staffId", "name email");
    res.json(cases);
  } catch (err) {
    console.error("Error in GET /cases:", err);
    res
      .status(500)
      .json({ message: "Error fetching cases", error: err.message });
  }
});

// Get a single case by ID (Accessible to all authenticated users)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id).populate(
      "staffId",
      "name email"
    );
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    await Case.populate(caseItem, {
      path: "remarks.staffId",
      select: "name email",
    });
    res.json(caseItem);
  } catch (err) {
    console.error("Error in GET /cases/:id:", err);
    res
      .status(500)
      .json({ message: "Error fetching case", error: err.message });
  }
});

// Create a case (Accessible to all authenticated users)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { caseId, location } = req.body;
    const newCase = new Case({
      caseId,
      location,
      staffId: req.user.id,
      status: "Open",
    });
    await newCase.save();
    const populatedCase = await Case.findById(newCase._id).populate(
      "staffId",
      "name email"
    );
    res.status(201).json({ message: "Case created", case: populatedCase });
  } catch (err) {
    console.error("Error in POST /cases:", err);
    res
      .status(500)
      .json({ message: "Error creating case", error: err.message });
  }
});

// Update a case (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { caseId, location, status } = req.body;
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });

    caseItem.caseId = caseId || caseItem.caseId;
    caseItem.location = location || caseItem.location;
    if (status && ["Open", "In Progress", "Closed"].includes(status)) {
      caseItem.status = status;
    }
    await caseItem.save();

    const populatedCase = await Case.findById(caseItem._id).populate(
      "staffId",
      "name email"
    );
    await Case.populate(populatedCase, {
      path: "remarks.staffId",
      select: "name email",
    });
    res.json({ message: "Case updated", case: populatedCase });
  } catch (err) {
    console.error("Error in PUT /cases/:id:", err);
    res
      .status(500)
      .json({ message: "Error updating case", error: err.message });
  }
});

// Close a case (Admin only)
router.patch(
  "/:id/close",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const caseItem = await Case.findById(req.params.id);
      if (!caseItem) return res.status(404).json({ message: "Case not found" });

      if (caseItem.status === "Closed") {
        return res.status(400).json({ message: "Case is already closed" });
      }

      caseItem.status = "Closed";
      await caseItem.save();

      const populatedCase = await Case.findById(caseItem._id).populate(
        "staffId",
        "name email"
      );
      await Case.populate(populatedCase, {
        path: "remarks.staffId",
        select: "name email",
      });
      res.json({ message: "Case closed", case: populatedCase });
    } catch (err) {
      console.error("Error in PATCH /cases/:id/close:", err);
      res
        .status(500)
        .json({ message: "Error closing case", error: err.message });
    }
  }
);

// Add remark to a case (Accessible to all authenticated users)
router.post("/:id/remarks", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Remark text is required" });
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    caseItem.remarks.push({ staffId: req.user.id, text });
    await caseItem.save();
    const updatedCase = await Case.findById(req.params.id).populate(
      "staffId",
      "name email"
    );
    await Case.populate(updatedCase, {
      path: "remarks.staffId",
      select: "name email",
    });
    res.json({ message: "Remark added", case: updatedCase });
  } catch (err) {
    console.error("Error in POST /cases/:id/remarks:", err);
    res
      .status(500)
      .json({ message: "Error adding remark", error: err.message });
  }
});

// Assign case to staff (Admin only)
router.patch(
  "/assign/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { staffId } = req.body;
      if (!staffId)
        return res.status(400).json({ message: "Staff ID is required" });
      const caseItem = await Case.findById(req.params.id);
      if (!caseItem) return res.status(404).json({ message: "Case not found" });
      caseItem.staffId = staffId;
      await caseItem.save();
      const updatedCase = await Case.findById(req.params.id).populate(
        "staffId",
        "name email"
      );
      await Case.populate(updatedCase, {
        path: "remarks.staffId",
        select: "name email",
      });
      res.json({ message: "Case assigned", case: updatedCase });
    } catch (err) {
      console.error("Error in PATCH /cases/assign/:id:", err);
      res
        .status(500)
        .json({ message: "Error assigning case", error: err.message });
    }
  }
);

// Delete a case (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const caseItem = await Case.findByIdAndDelete(req.params.id);
    if (!caseItem) return res.status(404).json({ message: "Case not found" });
    await Evidence.deleteMany({ caseId: req.params.id });
    res.json({ message: "Case and associated evidence deleted" });
  } catch (err) {
    console.error("Error in DELETE /cases/:id:", err);
    res
      .status(500)
      .json({ message: "Error deleting case", error: err.message });
  }
});

module.exports = router;
