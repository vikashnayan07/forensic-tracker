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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        console.log("Fetching blog with ID:", id); // Debug log
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/blog/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Response status:", response.status); // Debug log
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch blog post");
        }

        const data = await response.json();
        console.log("Fetched blog data:", data); // Debug log
        setBlog(data);
        setIsAdmin(localStorage.getItem("isAdmin") === "true");
      } catch (err) {
        console.error("Error in fetchBlog:", err); // Debug log
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
        <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24">
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
    return <p className="text-red-400 animate-glitch text-center">{error}</p>;
  if (!blog)
    return <p className="text-gray-200 text-center">Blog post not found</p>;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 bg-opacity-70 backdrop-blur-md p-6 fixed h-full z-20">
        <div className="mb-8">
          <i className="fas fa-fingerprint text-4xl text-green-400"></i>
          <h2 className="text-xl font-bold text-green-400 cyber-text">
            Cyber Tracker
          </h2>
        </div>
        <ul className="space-y-4">
          <li>
            <a
              href="/dashboard"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/cases"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Cases
            </a>
          </li>
          <li>
            <a
              href="/evidence"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Evidence
            </a>
          </li>
          <li>
            <a
              href="/analytics"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Analytics
            </a>
          </li>
          <li>
            <a
              href="/team"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Team
            </a>
          </li>
          <li>
            <a
              href="/blog"
              className="text-green-400 cyber-text hover:text-green-300"
            >
              Blog
            </a>
          </li>
          {isAdmin && (
            <li>
              <a
                href="/admin"
                className="text-green-400 cyber-text hover:text-green-300"
              >
                Pending Staff
              </a>
            </li>
          )}
          {isAdmin && (
            <li>
              <a
                href="/case-management"
                className="text-green-400 cyber-text hover:text-green-300"
              >
                Case Management
              </a>
            </li>
          )}
          {isAdmin && (
            <li>
              <a
                href="/profile"
                className="text-green-400 cyber-text hover:text-green-300"
              >
                Profile
              </a>
            </li>
          )}
        </ul>
        <div className="absolute bottom-6">
          <div className="flex items-center">
            <img
              src="https://via.placeholder.com/40"
              alt="User"
              className="w-10 h-10 rounded-full mr-2"
            />
            <span className="text-green-400 cyber-text">
              {localStorage.getItem("email") || "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 opacity-80 animate-cyber-gradient"></div>
        <div className="absolute inset-0 cyber-rain"></div>

        {/* Header */}
        <header className="bg-gray-800 bg-opacity-70 backdrop-blur-md p-4 flex justify-between items-center z-10">
          <h1 className="text-2xl text-green-400 cyber-text">
            Blog Post: {blog.title}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/blog")}
              className="p-2 bg-gray-500 text-white rounded-lg cyber-button hover:bg-gray-600 transition-all duration-300"
            >
              Back to Blog
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Blog Details Content */}
        <div className="p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative">
          <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500">
            <h2 className="text-3xl font-semibold text-pink-400 cyber-text mb-4">
              {blog.title}
            </h2>
            {blog.photo ? (
              <img
                src={`${process.env.REACT_APP_API_URL}/${blog.photo.replace(
                  /^.*[\\\/]uploads[\\\/]/,
                  "uploads/"
                )}`}
                alt={blog.title}
                className="w-full h-96 object-cover rounded-lg shadow-md mb-6"
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/150?text=Image+Not+Found")
                }
              />
            ) : (
              <div className="w-full h-96 bg-gray-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
            <p className="text-gray-200 mb-4">{blog.content}</p>
            <p className="text-gray-300">Category: {blog.category}</p>
            <p className="text-gray-300">
              Author: {blog.authorId?.name || "Unknown"}
            </p>
            <p className="text-gray-300">
              Date: {new Date(blog.timestamp).toLocaleDateString()}
            </p>

            {/* Comments Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-pink-400 cyber-text mb-4">
                Comments
              </h3>
              {blog.comments.length === 0 ? (
                <p className="text-gray-200">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {blog.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-700 bg-opacity-50 p-4 rounded-lg border border-pink-500/50"
                    >
                      <p className="text-gray-200">{comment.content}</p>
                      <p className="text-gray-300 text-sm mt-2">
                        By {comment.authorId?.name || "Unknown"} on{" "}
                        {new Date(comment.timestamp).toLocaleString()}
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="mt-2 p-1 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 transition-all duration-300"
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
            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-pink-400 cyber-text mb-4">
                Add a Comment
              </h3>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  placeholder="Write your comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 transition-all duration-300"
                  rows="3"
                  disabled={commentLoading}
                />
                <button
                  type="submit"
                  className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 transition-all duration-300"
                  disabled={commentLoading}
                >
                  {commentLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 mx-auto"
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
    </div>
  );
}

export default BlogDetails;
