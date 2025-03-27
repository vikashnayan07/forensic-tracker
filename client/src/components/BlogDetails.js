import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function BlogDetails() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar toggle
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        console.log("Fetching blog with ID:", id);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/blog/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch blog post");
        }

        const data = await response.json();
        console.log("Fetched blog data:", data);
        setBlog(data);
        setIsAdmin(localStorage.getItem("isAdmin") === "true");
      } catch (err) {
        console.error("Error in fetchBlog:", err);
        setError(err.message);
        if (
          err.message.includes("Invalid token") ||
          err.message.includes("No token found")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("email");
          localStorage.removeItem("isAdmin");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setCommentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/blog/${id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentContent }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add comment");

      setBlog(data.blog);
      setCommentContent("");
      toast.success("Comment added successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/blog/${id}/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete comment");

      setBlog(data.blog);
      toast.success("Comment deleted successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-pink-400 cyber-text">
        <svg
          className="animate-spin h-6 sm:h-8 w-6 sm:w-8 mx-auto"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </svg>
        Loading...
      </div>
    );
  }

  if (error)
    return (
      <p className="text-red-400 animate-glitch text-center text-sm sm:text-base">
        {error}
      </p>
    );
  if (!blog)
    return (
      <p className="text-gray-200 text-center text-sm sm:text-base">
        Blog post not found
      </p>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`w-64 bg-gray-800 bg-opacity-70 backdrop-blur-md p-4 sm:p-6 fixed h-full z-20 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 sm:mb-8 flex items-center space-x-2">
          <i className="fas fa-fingerprint text-3xl sm:text-4xl text-green-400"></i>
          <h2 className="text-lg sm:text-xl font-bold text-green-400 cyber-text">
            Cyber Tracker
          </h2>
        </div>
        <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
          <li>
            <a
              href="/dashboard"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/cases"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Cases
            </a>
          </li>
          <li>
            <a
              href="/evidence"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Evidence
            </a>
          </li>
          <li>
            <a
              href="/analytics"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Analytics
            </a>
          </li>
          <li>
            <a
              href="/team"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Team
            </a>
          </li>
          <li>
            <a
              href="/blog"
              className="text-green-400 cyber-text hover:text-green-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              Blog
            </a>
          </li>
          {isAdmin && (
            <>
              <li>
                <a
                  href="/admin"
                  className="text-green-400 cyber-text hover:text-green-300"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Pending Staff
                </a>
              </li>
              <li>
                <a
                  href="/case-management"
                  className="text-green-400 cyber-text hover:text-green-300"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Case Management
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-green-400 cyber-text hover:text-green-300"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Profile
                </a>
              </li>
            </>
          )}
        </ul>
        <div className="mt-6 flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/40"
            alt="User"
            className="w-8 sm:w-10 h-8 sm:h-10 rounded-full"
            onError={(e) => (e.target.src = "/images/default-profile.png")}
          />
          <span className="text-green-400 cyber-text text-sm sm:text-base truncate">
            {localStorage.getItem("email") || "User"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 relative px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 opacity-80 animate-cyber-gradient"></div>
        <div className="absolute inset-0 cyber-rain"></div>

        {/* Header */}
        <header className="bg-gray-800 bg-opacity-70 backdrop-blur-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center z-10 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {/* Hamburger Menu Button for All Devices */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-green-400 text-2xl focus:outline-none"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>
            <h1 className="text-xl sm:text-2xl text-green-400 cyber-text truncate">
              Blog Post: {blog.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/blog")}
              className="p-1 sm:p-2 bg-gray-500 text-white rounded-lg cyber-button hover:bg-gray-600 text-sm sm:text-base transition-all duration-300"
            >
              Back to Blog
            </button>
            <button
              onClick={handleLogout}
              className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Blog Details Content */}
        <div className="p-4 sm:p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-2 sm:m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative pb-32">
          <div className="bg-gray-800 bg-opacity-90 p-4 sm:p-6 rounded-lg border border-pink-500">
            <h2 className="text-2xl sm:text-3xl font-semibold text-pink-400 cyber-text mb-4 sm:mb-6">
              {blog.title}
            </h2>
            {blog.photo ? (
              <img
                src={blog.photo}
                alt={blog.title}
                className="w-full h-64 sm:h-96 object-cover rounded-lg shadow-md mb-4 sm:mb-6"
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/150?text=Image+Not+Found")
                }
              />
            ) : (
              <div className="w-full h-64 sm:h-96 bg-gray-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-gray-400 text-sm sm:text-base">
                  No Image Available
                </span>
              </div>
            )}
            <p className="text-gray-200 mb-4 text-sm sm:text-base">
              {blog.content}
            </p>
            <p className="text-gray-300 text-sm sm:text-base">
              Category: {blog.category}
            </p>
            <p className="text-gray-300 text-sm sm:text-base">
              Author: {blog.authorId?.name || "Unknown"}
            </p>
            <p className="text-gray-300 text-sm sm:text-base">
              Date: {new Date(blog.timestamp).toLocaleDateString()}
            </p>

            {/* Comments Section */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-pink-400 cyber-text mb-4">
                Comments
              </h3>
              {blog.comments.length === 0 ? (
                <p className="text-gray-200 text-sm sm:text-base">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {blog.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-pink-500/50"
                    >
                      <p className="text-gray-200 text-sm sm:text-base">
                        {comment.content}
                      </p>
                      <p className="text-gray-300 text-xs sm:text-sm mt-2">
                        By {comment.authorId?.name || "Unknown"} on{" "}
                        {new Date(comment.timestamp).toLocaleString()}
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="mt-2 p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-pink-400 cyber-text mb-4">
                Add a Comment
              </h3>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  placeholder="Write your comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  rows="3"
                  disabled={commentLoading}
                />
                <button
                  type="submit"
                  className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                  disabled={commentLoading}
                >
                  {commentLoading ? (
                    <svg
                      className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mx-auto"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    "Submit Comment"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Footer Component (Copied from Dashboard.js and Blog.js)
const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-green-900 to-gray-900 text-white py-8 sm:py-10 mt-auto border-t border-pink-500 border-opacity-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12">
          {/* Useful Links */}
          <div className="w-full lg:w-1/3">
            <h3 className="text-xl sm:text-2xl font-semibold text-pink-400 cyber-text mb-4 text-center lg:text-left">
              Useful Links
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
              {[
                { name: "About Us", href: "/about" },
                { name: "Terms of Use", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Site Map", href: "/sitemap" },
                { name: "Help", href: "/help" },
                { name: "Contact Us", href: "/contact" },
                { name: "Feedback", href: "/feedback" },
                { name: "Recruitment", href: "/recruitment" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-green-400 cyber-text transition-colors duration-300 text-center lg:text-left"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="w-full lg:w-1/3 flex justify-center">
            <div className="flex space-x-6">
              {[
                {
                  icon: "fab fa-x-twitter",
                  href: "https://twitter.com",
                  label: "Twitter",
                },
                {
                  icon: "fab fa-linkedin-in",
                  href: "https://linkedin.com",
                  label: "LinkedIn",
                },
                {
                  icon: "fab fa-facebook-f",
                  href: "https://facebook.com",
                  label: "Facebook",
                },
                {
                  icon: "fab fa-instagram",
                  href: "https://instagram.com",
                  label: "Instagram",
                },
                {
                  icon: "fab fa-youtube",
                  href: "https://youtube.com",
                  label: "YouTube",
                },
              ].map((social) => (
                <a
                  key={social.icon}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-400 transform hover:scale-110 transition-all duration-300"
                  aria-label={`Follow us on ${social.label}`}
                >
                  <i className={`${social.icon} text-2xl sm:text-3xl`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Powered By */}
          <div className="w-full lg:w-1/3 text-center lg:text-right">
            <h3 className="text-xl sm:text-2xl font-semibold text-pink-400 cyber-text mb-3">
              Powered By
            </h3>
            <p className="text-gray-300 text-base sm:text-lg">
              VikNex IT Solutions
            </p>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              Secure & Innovative Tracking Platform
            </p>
          </div>
        </div>

        {/* Copyright Strip */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm sm:text-base">
            Copyright © 2025 - All Rights Reserved
          </p>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Developed and Maintained by{" "}
            <span className="text-pink-400 cyber-text">Vikash Nayan</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BlogDetails;
