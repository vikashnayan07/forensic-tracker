const express = require("express");
const router = express.Router();
const path = require("path");
const Blog = require("../models/Blog");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary configuration:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set",
  });
} catch (err) {
  console.error("Error configuring Cloudinary:", err);
}

// Set up multer to store files temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    try {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(new Error("Only images (jpeg, jpg, png) are allowed"));
    } catch (err) {
      console.error("Error in fileFilter:", err);
      cb(err);
    }
  },
});

// Multer error handling middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.error("File filter error:", err);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Function to upload to Cloudinary with retries
const uploadToCloudinary = (fileBuffer, retries = 3) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "forensic-tracker/blog",
          public_id: `blog-${uuidv4()}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            if (retries > 0) {
              console.log(
                `Retrying Cloudinary upload (${retries} attempts left)...`
              );
              setTimeout(() => {
                resolve(uploadToCloudinary(fileBuffer, retries - 1));
              }, 1000);
            } else {
              reject(error);
            }
          } else {
            console.log("Cloudinary upload successful:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(fileBuffer);
    } catch (err) {
      console.error("Error in uploadToCloudinary:", err);
      reject(err);
    }
  });
};

// Add this route just before the POST / route in blog.js
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching all blog posts...");
    const blogs = await Blog.find().populate("authorId", "name email");
    console.log("Blog posts fetched:", blogs);
    res.json(blogs);
  } catch (err) {
    console.error("Error in GET /blog:", err);
    res
      .status(500)
      .json({ message: "Error fetching blog posts", error: err.message });
  }
});

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
      let photoUrl = null;

      if (req.file) {
        console.log("Uploading file to Cloudinary...");
        photoUrl = await uploadToCloudinary(req.file.buffer);
        console.log("Cloudinary URL:", photoUrl);
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
        photo: photoUrl,
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

      // If a new photo is uploaded, upload it to Cloudinary
      let photoUrl = blog.photo;
      if (req.file) {
        console.log("Uploading new file to Cloudinary...");
        photoUrl = await uploadToCloudinary(req.file.buffer);
        console.log("New Cloudinary URL:", photoUrl);
      }

      blog.title = title || blog.title;
      blog.content = content || blog.content;
      blog.category = category || blog.category;
      blog.photo = photoUrl;

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
