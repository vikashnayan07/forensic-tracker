import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

function Blog() {
  const [news, setNews] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsError, setNewsError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    category: "",
    photo: null,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [viewMode, setViewMode] = useState("news");
  const [newsPage, setNewsPage] = useState(1);
  const [blogsPage, setBlogsPage] = useState(1);
  const [editBlogId, setEditBlogId] = useState(null);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar toggle
  const itemsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        // Fetch admin blogs
        const blogResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/blog`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!blogResponse.ok) {
          const blogError = await blogResponse.json();
          throw new Error(blogError.message || "Failed to fetch blog posts");
        }

        const blogData = await blogResponse.json();
        console.log("Fetched blogs:", blogData);
        setBlogs(blogData);

        // Fetch news articles from backend proxy
        try {
          const newsResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/news/cybercrime-news`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!newsResponse.ok) {
            const newsError = await newsResponse.json();
            console.error("News API error:", newsError);
            throw new Error("Failed to fetch news articles");
          }
          const newsData = await newsResponse.json();
          console.log("Fetched news articles:", newsData.articles);
          const validArticles = (newsData.articles || [])
            .filter(
              (article) =>
                article.url &&
                typeof article.url === "string" &&
                article.url.startsWith("http")
            )
            .map((article) => ({
              ...article,
              source: { name: article.source?.name || "Unknown" },
              urlToImage: article.image,
              publishedAt: article.publishedAt || new Date().toISOString(),
            }));
          setNews(validArticles);
          setNewsError("");
        } catch (newsErr) {
          console.error("Error fetching news articles:", newsErr.message);
          setNews([]);
          setNewsError(newsErr.message);
          toast.error("Failed to fetch news articles. Displaying blogs only.");
        }

        setIsAdmin(localStorage.getItem("isAdmin") === "true");
      } catch (err) {
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

    fetchData();
  }, [navigate]);

  useEffect(() => {
    setNewsError("");
  }, [viewMode]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", blogForm.title);
      formData.append("content", blogForm.content);
      formData.append("category", blogForm.category);
      if (blogForm.photo) {
        formData.append("photo", blogForm.photo);
        console.log("Uploading file:", blogForm.photo);
      } else {
        console.log("No photo selected");
      }

      const url = editBlogId
        ? `${process.env.REACT_APP_API_URL}/blog/${editBlogId}`
        : `${process.env.REACT_APP_API_URL}/blog`;
      const method = editBlogId ? "PUT" : "POST";

      console.log("Submitting to URL:", url, "Method:", method);
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      console.log("Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned a non-JSON response");
      }

      const data = await response.json();
      console.log("Response data:", data);
      if (!response.ok) {
        throw new Error(data.message || "Failed to save blog post");
      }

      if (editBlogId) {
        setBlogs(
          blogs.map((blog) => (blog._id === editBlogId ? data.blog : blog))
        );
        toast.success("Blog post updated successfully!");
      } else {
        setBlogs([...blogs, data.blog]);
        toast.success("Blog post created successfully!");
      }

      setShowBlogModal(false);
      setBlogForm({ title: "", content: "", category: "", photo: null });
      setEditBlogId(null);
    } catch (err) {
      console.error("Error in handleBlogSubmit:", err);
      toast.error(err.message || "Failed to save blog post");
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditBlog = (blog) => {
    console.log("Editing blog:", blog);
    setEditBlogId(blog._id);
    setBlogForm({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      photo: null,
    });
    setShowBlogModal(true);
  };

  const handleDeleteBlog = async (blogId) => {
    try {
      console.log("Deleting blog with ID:", blogId);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/blog/${blogId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Delete response status:", response.status);
      const data = await response.json();
      console.log("Delete response data:", data);
      if (!response.ok)
        throw new Error(data.message || "Failed to delete blog post");
      setBlogs(blogs.filter((blog) => blog._id !== blogId));
      toast.success("Blog post deleted successfully!");
    } catch (err) {
      console.error("Error in handleDeleteBlog:", err);
      toast.error(err.message);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTimeout(() => setSearchQuery(value), 300);
  };

  const handlePageChange = (setPage, page, totalPages) => {
    setPaginationLoading(true);
    setTimeout(() => {
      setPage(Math.min(Math.max(page, 1), totalPages));
      setPaginationLoading(false);
    }, 500);
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (categoryFilter === "All" || blog.category === categoryFilter)
  );

  const filteredNews = useMemo(() => {
    return news.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [news, searchQuery]);

  const totalNewsPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = useMemo(() => {
    return filteredNews.slice(
      (newsPage - 1) * itemsPerPage,
      newsPage * itemsPerPage
    );
  }, [filteredNews, newsPage, itemsPerPage]);

  const totalBlogsPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (blogsPage - 1) * itemsPerPage,
    blogsPage * itemsPerPage
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
            src="https://placehold.co/40x40"
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
          <div className="flex items-center w-full sm:w-1/2 space-x-4">
            {/* Hamburger Menu Button for All Devices */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-green-400 text-2xl focus:outline-none"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>
            <input
              type="text"
              placeholder={
                viewMode === "news"
                  ? "Search news by title..."
                  : "Search blog posts by title..."
              }
              onChange={handleSearchChange}
              className="p-2 bg-transparent border border-green-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-green-400 w-full sm:flex-1 text-sm sm:text-base transition-all duration-300"
            />
            {viewMode === "adminBlogs" && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 bg-gray-800 border border-green-500 rounded-lg text-white cyber-text text-sm sm:text-base transition-all duration-300"
              >
                <option value="All">All Categories</option>
                <option value="Forensics">Forensics</option>
                <option value="Cybercrime">Cybercrime</option>
                <option value="Technology">Technology</option>
                <option value="Case Studies">Case Studies</option>
                <option value="Other">Other</option>
              </select>
            )}
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                setSearchQuery("");
                setCategoryFilter("All");
                setNewsPage(1);
                setBlogsPage(1);
              }}
              className="p-2 bg-gray-800 border border-green-500 rounded-lg text-white cyber-text text-sm sm:text-base transition-all duration-300"
            >
              <option value="news">News</option>
              <option value="adminBlogs">Admin Blogs</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            {isAdmin && viewMode === "adminBlogs" && (
              <button
                onClick={() => {
                  setEditBlogId(null);
                  setBlogForm({
                    title: "",
                    content: "",
                    category: "",
                    photo: null,
                  });
                  setShowBlogModal(true);
                }}
                className="p-2 bg-green-500 text-white rounded-lg cyber-button hover:bg-green-600 text-sm sm:text-base transition-all duration-300"
              >
                New Blog Post
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Blog/News Content */}
        <div className="p-4 sm:p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-2 sm:m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative pb-32">
          {loading && (
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
          )}
          {error && (
            <p className="text-red-400 animate-glitch text-center text-sm sm:text-base">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              {/* News Section */}
              {viewMode === "news" && (
                <section className="mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-pink-400 cyber-text mb-4 sm:mb-6 animate-pulse">
                    Cybercrime News
                  </h2>
                  {newsError && (
                    <p className="text-red-400 animate-glitch text-center mb-4 text-sm sm:text-base">
                      {newsError}
                    </p>
                  )}
                  {paginationLoading ? (
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
                  ) : paginatedNews.length === 0 && !newsError ? (
                    <p className="text-gray-200 text-center text-sm sm:text-base">
                      No news articles found.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedNews.map((article, index) => {
                          console.log("News article URL:", article.url);
                          return (
                            <div
                              key={`${article.url}-${index}`}
                              className="bg-gray-800 bg-opacity-90 p-4 sm:p-6 rounded-lg border border-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                              {article.urlToImage ? (
                                <img
                                  src={article.urlToImage}
                                  alt={article.title}
                                  className="mt-2 sm:mt-4 w-full h-40 sm:h-48 object-cover rounded-lg shadow-md"
                                  onError={(e) =>
                                    (e.target.src =
                                      "https://placehold.co/150x150?text=Image+Not+Found")
                                  }
                                />
                              ) : (
                                <div className="mt-2 sm:mt-4 w-full h-40 sm:h-48 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-400 text-sm sm:text-base">
                                    No Image Available
                                  </span>
                                </div>
                              )}
                              <h3 className="text-lg sm:text-xl font-semibold text-pink-400 cyber-text mt-4">
                                {article.title}
                              </h3>
                              <p className="text-gray-200 mt-2 text-sm sm:text-base">
                                {article.description
                                  ? article.description.length > 150
                                    ? `${article.description.substring(
                                        0,
                                        150
                                      )}...`
                                    : article.description
                                  : "No description available."}
                              </p>
                              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                                Source: {article.source?.name || "Unknown"}
                              </p>
                              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                                Date:{" "}
                                {new Date(
                                  article.publishedAt
                                ).toLocaleDateString()}
                              </p>
                              <button
                                onClick={() => {
                                  console.log(
                                    "Read More clicked for URL:",
                                    article.url
                                  );
                                  if (article.url) {
                                    window.open(
                                      article.url,
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  } else {
                                    toast.error(
                                      "No URL available for this article."
                                    );
                                  }
                                }}
                                onMouseDown={() =>
                                  console.log(
                                    "Mouse down on Read More button for URL:",
                                    article.url
                                  )
                                }
                                onTouchStart={() =>
                                  console.log(
                                    "Touch start on Read More button for URL:",
                                    article.url
                                  )
                                }
                                className="mt-2 sm:mt-4 p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full block text-center text-sm sm:text-base transition-all duration-300"
                              >
                                Read More
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() =>
                            handlePageChange(
                              setNewsPage,
                              newsPage - 1,
                              totalNewsPages
                            )
                          }
                          disabled={newsPage === 1}
                          className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                        >
                          Previous
                        </button>
                        <span className="text-gray-200 cyber-text text-sm sm:text-base">
                          Page {newsPage} of {totalNewsPages}
                        </span>
                        <button
                          onClick={() =>
                            handlePageChange(
                              setNewsPage,
                              newsPage + 1,
                              totalNewsPages
                            )
                          }
                          disabled={newsPage === totalNewsPages}
                          className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Admin Blogs Section */}
              {viewMode === "adminBlogs" && (
                <section className="mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-pink-400 cyber-text mb-4 sm:mb-6 animate-pulse">
                    Admin Blog Posts
                  </h2>
                  {paginationLoading ? (
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
                  ) : paginatedBlogs.length === 0 ? (
                    <p className="text-gray-200 text-center text-sm sm:text-base">
                      No blog posts found.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedBlogs.map((blog) => {
                          console.log("Blog ID:", blog._id);
                          console.log("Image URL:", blog.photo);
                          return (
                            <div
                              key={blog._id}
                              className="bg-gray-800 bg-opacity-90 p-4 sm:p-6 rounded-lg border border-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                              {blog.photo ? (
                                <img
                                  src={
                                    blog.photo.startsWith("http")
                                      ? blog.photo
                                      : `${process.env.REACT_APP_API_URL}/${blog.photo}`
                                  }
                                  alt={blog.title}
                                  className="mt-2 sm:mt-4 w-full h-40 sm:h-48 object-cover rounded-lg shadow-md"
                                  onError={(e) =>
                                    (e.target.src =
                                      "https://placehold.co/150x150?text=Image+Not+Found")
                                  }
                                />
                              ) : (
                                <div className="mt-2 sm:mt-4 w-full h-40 sm:h-48 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-400 text-sm sm:text-base">
                                    No Image Available
                                  </span>
                                </div>
                              )}
                              <h3 className="text-lg sm:text-xl font-semibold text-pink-400 cyber-text mt-4">
                                {blog.title}
                              </h3>
                              <p className="text-gray-200 mt-2 text-sm sm:text-base">
                                {blog.content.length > 150
                                  ? `${blog.content.substring(0, 150)}...`
                                  : blog.content}
                              </p>
                              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                                Category: {blog.category}
                              </p>
                              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                                Author: {blog.authorId?.name || "Unknown"}
                              </p>
                              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                                Date:{" "}
                                {new Date(blog.timestamp).toLocaleDateString()}
                              </p>
                              <Link
                                to={`/blog/${blog._id}`}
                                className="mt-2 sm:mt-4 p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full block text-center text-sm sm:text-base transition-all duration-300"
                              >
                                Read More
                              </Link>
                              {isAdmin && (
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-4">
                                  <button
                                    onClick={() => handleEditBlog(blog)}
                                    className="p-1 sm:p-2 bg-blue-500 text-white rounded-lg cyber-button hover:bg-blue-600 w-full text-sm sm:text-base transition-all duration-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBlog(blog._id)}
                                    className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 w-full text-sm sm:text-base transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() =>
                            handlePageChange(
                              setBlogsPage,
                              blogsPage - 1,
                              totalBlogsPages
                            )
                          }
                          disabled={blogsPage === 1}
                          className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                        >
                          Previous
                        </button>
                        <span className="text-gray-200 cyber-text text-sm sm:text-base">
                          Page {blogsPage} of {totalBlogsPages}
                        </span>
                        <button
                          onClick={() =>
                            handlePageChange(
                              setBlogsPage,
                              blogsPage + 1,
                              totalBlogsPages
                            )
                          }
                          disabled={blogsPage === totalBlogsPages}
                          className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={handleBackToTop}
            className="fixed bottom-8 right-8 p-4 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-all duration-300 z-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}

        {/* Blog Post Modal (Create/Edit) */}
        {showBlogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4 animate-fade-in">
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-pink-500 w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-95 hover:scale-100">
              <h3 className="text-xl sm:text-2xl text-pink-400 cyber-text mb-4">
                {editBlogId ? "Edit Blog Post" : "Create New Blog Post"}
              </h3>
              <form onSubmit={handleBlogSubmit}>
                <input
                  type="text"
                  placeholder="Title"
                  value={blogForm.title}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, title: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  required
                  disabled={modalLoading}
                />
                <textarea
                  placeholder="Content"
                  value={blogForm.content}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, content: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  rows="5"
                  required
                  disabled={modalLoading}
                />
                <select
                  value={blogForm.category}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, category: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  required
                  disabled={modalLoading}
                >
                  <option value="">Select Category</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Cybercrime">Cybercrime</option>
                  <option value="Technology">Technology</option>
                  <option value="Case Studies">Case Studies</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, photo: e.target.files[0] })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  disabled={modalLoading}
                />
                <div className="flex justify-end space-x-2 sm:space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBlogModal(false);
                      setEditBlogId(null);
                      setBlogForm({
                        title: "",
                        content: "",
                        category: "",
                        photo: null,
                      });
                    }}
                    className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
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
                    ) : editBlogId ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Footer Component (Copied from Dashboard.js)
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

export default Blog;
