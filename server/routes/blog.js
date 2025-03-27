const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "forensic-tracker/blog",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png) are allowed"));
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

// Get all blog posts
router.get("/", authMiddleware, async (req, res) => {
  try {
    const blogs = await Blog.find().populate("authorId", "name email");
    res.json(blogs);
  } catch (err) {
    console.error("Error in GET /blog:", err);
    res
      .status(500)
      .json({ message: "Error fetching blog posts", error: err.message });
  }
});

// Create a blog post (Admin only)
// Create a blog post (Admin only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("photo"),
  multerErrorHandler,
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);
      if (req.file) {
        console.log("Cloudinary URL:", req.file.path);
      } else {
        console.log("No file uploaded");
      }

      const { title, content, category } = req.body;
      if (!title || !content || !category) {
        return res
          .status(400)
          .json({ message: "Title, content, and category are required" });
      }

      const newBlog = new Blog({
        title,
        content,
        category,
        authorId: req.user.id,
        photo: req.file ? req.file.path : null, // Cloudinary URL
      });

      console.log("Saving blog to MongoDB...");
      await newBlog.save();
      console.log("Blog saved successfully");

      const populatedBlog = await Blog.findById(newBlog._id).populate(
        "authorId",
        "name email"
      );
      console.log("Created blog post:", populatedBlog);
      res
        .status(201)
        .json({ message: "Blog post created", blog: populatedBlog });
    } catch (err) {
      console.error("Error in POST /blog:", err);
      res
        .status(500)
        .json({ message: "Error creating blog post", error: err.message });
    }
  }
);

// Update a blog post (Admin only)
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("photo"),
  multerErrorHandler,
  async (req, res) => {
    try {
      const { title, content, category } = req.body;
      const blog = await Blog.findById(req.params.id);
      if (!blog)
        return res.status(404).json({ message: "Blog post not found" });

      // If a new photo is uploaded, delete the old one from Cloudinary
      if (req.file && blog.photo) {
        const publicId = blog.photo.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(`forensic-tracker/blog/${publicId}`);
      }

      blog.title = title || blog.title;
      blog.content = content || blog.content;
      blog.category = category || blog.category;
      if (req.file) {
        blog.photo = req.file.path; // Cloudinary URL
      }
      await blog.save();

      const populatedBlog = await Blog.findById(blog._id).populate(
        "authorId",
        "name email"
      );
      res.json({ message: "Blog post updated", blog: populatedBlog });
    } catch (err) {
      console.error("Error in PUT /blog/:id:", err);
      res
        .status(500)
        .json({ message: "Error updating blog post", error: err.message });
    }
  }
);

// Delete a blog post (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog post not found" });

    // Delete the photo from Cloudinary if it exists
    if (blog.photo) {
      const publicId = blog.photo.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(`forensic-tracker/blog/${publicId}`);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog post deleted" });
  } catch (err) {
    console.error("Error in DELETE /blog/:id:", err);
    res
      .status(500)
      .json({ message: "Error deleting blog post", error: err.message });
  }
});

// Get a single blog post by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "authorId",
      "name email"
    );
    if (!blog) return res.status(404).json({ message: "Blog post not found" });
    res.json(blog);
  } catch (err) {
    console.error("Error in GET /blog/:id:", err);
    res
      .status(500)
      .json({ message: "Error fetching blog post", error: err.message });
  }
});

// Add Comment
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content)
      return res.status(400).json({ message: "Comment content is required" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog post not found" });

    blog.comments.push({
      content,
      authorId: req.user.id,
    });
    await blog.save();

    const updatedBlog = await Blog.findById(req.params.id)
      .populate("authorId", "name email")
      .populate("comments.authorId", "name email");
    res.status(201).json({ message: "Comment added", blog: updatedBlog });
  } catch (err) {
    console.error("Error in POST /blog/:id/comment:", err);
    res
      .status(500)
      .json({ message: "Error adding comment", error: err.message });
  }
});

// Delete a comment from a blog post (Admin only)
router.delete(
  "/:id/comment/:commentId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog)
        return res.status(404).json({ message: "Blog post not found" });

      blog.comments = blog.comments.filter(
        (comment) => comment._id.toString() !== req.params.commentId
      );
      await blog.save();

      const updatedBlog = await Blog.findById(req.params.id)
        .populate("authorId", "name email")
        .populate("comments.authorId", "name email");
      res.json({ message: "Comment deleted", blog: updatedBlog });
    } catch (err) {
      console.error("Error in DELETE /blog/:id/comment/:commentId:", err);
      res
        .status(500)
        .json({ message: "Error deleting comment", error: err.message });
    }
  }
);

module.exports = router;
