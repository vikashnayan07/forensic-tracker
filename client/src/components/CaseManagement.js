import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";

function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editEvidence, setEditEvidence] = useState(null);
  const [editForm, setEditForm] = useState({
    item: "",
    description: "",
    location: "",
    caseId: "",
    photo: null,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar toggle
  const navigate = useNavigate();

  // Fetch cases and evidence
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const [casesRes, evidenceRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL}/evidence`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const casesData = await casesRes.json();
        const evidenceData = await evidenceRes.json();

        console.log("Cases response:", casesRes.status, casesData);
        console.log("Evidence response:", evidenceRes.status, evidenceData);

        if (!casesRes.ok || !evidenceRes.ok) {
          throw new Error("Failed to fetch data");
        }

        setCases(casesData);
        setEvidence(evidenceData.evidence || []);
      } catch (err) {
        toast.error(err.message);
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

    if (localStorage.getItem("isAdmin") !== "true") {
      toast.error("Admin access required");
      navigate("/dashboard");
    } else {
      fetchData();
    }
  }, [navigate]);

  // Handle edit evidence
  const handleEdit = (evidenceItem) => {
    setEditEvidence(evidenceItem);
    setEditForm({
      item: evidenceItem.item,
      description: evidenceItem.description,
      location: evidenceItem.location,
      caseId: evidenceItem.caseId?._id || "",
      photo: null,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setEditForm({ ...editForm, photo: acceptedFiles[0] });
    },
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("item", editForm.item);
      formData.append("description", editForm.description);
      formData.append("location", editForm.location);
      formData.append("caseId", editForm.caseId);
      if (editForm.photo) formData.append("photo", editForm.photo);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/evidence/${editEvidence._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update evidence");

      setEvidence(
        evidence.map((item) =>
          item._id === editEvidence._id ? { ...item, ...data.evidence } : item
        )
      );
      setEditEvidence(null);
      toast.success("Evidence updated successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle delete evidence
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this evidence?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/evidence/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete evidence");

      setEvidence(evidence.filter((item) => item._id !== id));
      toast.success("Evidence deleted successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

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
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {/* Hamburger Menu Button for All Devices */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-green-400 text-2xl focus:outline-none"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              <i className={isSidebarOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-green-400 cyber-text">
              Case Management
            </h1>
          </div>
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 text-sm sm:text-base transition-all duration-300"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Case Management Content */}
        <div className="p-4 sm:p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-2 sm:m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative pb-32">
          {/* Cases and Evidence Section */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-pink-400 cyber-text mb-4 sm:mb-6 animate-pulse">
              Cases and Evidence
            </h2>
            {loading ? (
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-6 sm:h-8 w-6 sm:w-8 text-pink-400"
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
              </div>
            ) : cases.length === 0 ? (
              <p className="text-gray-200 text-center text-sm sm:text-base">
                No cases found
              </p>
            ) : (
              <div className="space-y-6">
                {cases.map((caseItem) => (
                  <div
                    key={caseItem._id}
                    className="bg-gray-800 bg-opacity-90 p-4 sm:p-6 rounded-lg shadow-lg border border-pink-500"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-pink-400 cyber-text">
                      {caseItem.caseId}
                    </h3>
                    <p className="text-gray-200 text-sm sm:text-base">
                      Location: {caseItem.location}
                    </p>
                    <p className="text-gray-200 text-sm sm:text-base">
                      Status: {caseItem.status}
                    </p>
                    <p className="text-gray-200 text-sm sm:text-base">
                      Evidence Items:{" "}
                      {
                        evidence.filter((e) => e.caseId?._id === caseItem._id)
                          .length
                      }
                    </p>

                    {/* Evidence List */}
                    <div className="mt-4">
                      <h4 className="text-md sm:text-lg text-pink-400 cyber-text mb-2">
                        Evidence
                      </h4>
                      {evidence.filter((e) => e.caseId?._id === caseItem._id)
                        .length === 0 ? (
                        <p className="text-gray-200 text-sm sm:text-base">
                          No evidence found for this case.
                        </p>
                      ) : (
                        evidence
                          .filter((e) => e.caseId?._id === caseItem._id)
                          .map((evidenceItem) => (
                            <div
                              key={evidenceItem._id}
                              className="bg-gray-700 bg-opacity-90 p-3 sm:p-4 rounded-lg mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-pink-500/50"
                            >
                              <div className="w-full sm:w-3/4">
                                <p className="text-gray-200 text-sm sm:text-base">
                                  <span className="font-semibold">Item:</span>{" "}
                                  {evidenceItem.item}
                                </p>
                                <p className="text-gray-200 text-sm sm:text-base">
                                  <span className="font-semibold">
                                    Description:
                                  </span>{" "}
                                  {evidenceItem.description}
                                </p>
                                <p className="text-gray-200 text-sm sm:text-base">
                                  <span className="font-semibold">
                                    Location:
                                  </span>{" "}
                                  {evidenceItem.location}
                                </p>
                                {evidenceItem.photo && (
                                  <img
                                    src={
                                      evidenceItem.photo.startsWith("http")
                                        ? evidenceItem.photo
                                        : `${process.env.REACT_APP_API_URL}/${evidenceItem.photo}`
                                    }
                                    alt={evidenceItem.item}
                                    className="mt-2 w-24 sm:w-32 h-24 sm:h-32 object-cover rounded-lg"
                                    onError={(e) =>
                                      (e.target.src =
                                        "https://placehold.co/150x150?text=Image+Not+Found")
                                    }
                                  />
                                )}
                              </div>
                              <div className="flex gap-2 mt-2 sm:mt-0">
                                <button
                                  onClick={() => handleEdit(evidenceItem)}
                                  className="p-1 sm:p-2 bg-blue-500 text-white rounded-lg cyber-button hover:bg-blue-600 text-sm sm:text-base transition-all duration-300"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(evidenceItem._id)}
                                  className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Evidence Modal */}
      {editEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-pink-500 w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-95 hover:scale-100">
            <h3 className="text-xl sm:text-2xl text-pink-400 cyber-text mb-4">
              Edit Evidence
            </h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                placeholder="Item"
                value={editForm.item}
                onChange={(e) =>
                  setEditForm({ ...editForm, item: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                required
              />
              <select
                value={editForm.caseId}
                onChange={(e) =>
                  setEditForm({ ...editForm, caseId: e.target.value })
                }
                className="w-full p-2 mb-4 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                required
              >
                <option value="">Select Case</option>
                {cases.map((caseItem) => (
                  <option key={caseItem._id} value={caseItem._id}>
                    {caseItem.caseId}
                  </option>
                ))}
              </select>
              <div
                {...getRootProps()}
                className={`p-4 mb-4 border-2 border-dashed ${
                  isDragActive ? "border-pink-400" : "border-pink-500"
                } rounded-lg text-center text-gray-200 text-sm sm:text-base transition-all duration-300`}
              >
                <input {...getInputProps()} />
                {editForm.photo ? (
                  <p>{editForm.photo.name}</p>
                ) : (
                  <p>Drag & drop a new image, or click to select (optional)</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setEditEvidence(null)}
                  className="p-1 sm:p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 text-sm sm:text-base transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="p-1 sm:p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 text-sm sm:text-base transition-all duration-300"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Footer Component (Copied from Dashboard.js, Blog.js, BlogDetails.js, and CaseDetails.js)
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

export default CaseManagement;
