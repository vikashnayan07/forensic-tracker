import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Team() {
  const [staff, setStaff] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState({ caseId: "", staffId: "" });
  const [assignLoading, setAssignLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar toggle
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }
        const [staffRes, casesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/auth/staff`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL}/cases`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const staffData = await staffRes.json();
        const casesData = await casesRes.json();

        if (!staffRes.ok || !casesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        setStaff(staffData);
        setCases(casesData);
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

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/cases/${assignment.caseId}/assign`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ staffId: assignment.staffId }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to assign case");
      setCases(cases.map((c) => (c._id === assignment.caseId ? data.case : c)));
      setAssignment({ caseId: "", staffId: "" });
      toast.success("Case assigned successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] flex items-center justify-center">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] flex items-center justify-center">
        <p className="text-red-400 animate-glitch text-sm sm:text-base">
          {error}
        </p>
      </div>
    );
  }

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
          {localStorage.getItem("isAdmin") === "true" && (
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
              Team Management
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

        {/* Team Management Content */}
        <div className="p-4 sm:p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-2 sm:m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative pb-32">
          <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-pink-500 border-opacity-50 p-4 sm:p-6">
            {/* Staff List */}
            <section className="mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-pink-400 cyber-text mb-4 sm:mb-6 animate-pulse">
                Staff Members
              </h2>
              {staff.length === 0 ? (
                <p className="text-gray-200 text-center text-sm sm:text-base">
                  No staff members found.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {staff.map((member) => (
                    <div
                      key={member._id}
                      className="bg-gray-700 bg-opacity-90 p-4 sm:p-6 rounded-lg border border-pink-500 border-opacity-30 hover:shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <p className="text-gray-200 text-sm sm:text-base">
                        Name: {member.name}
                      </p>
                      <p className="text-gray-200 text-sm sm:text-base">
                        Email: {member.email}
                      </p>
                      <p className="text-gray-200 text-sm sm:text-base">
                        Assigned Cases:{" "}
                        {
                          cases.filter((c) => c.staffId?._id === member._id)
                            .length
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Assign Case Form */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-semibold text-pink-400 cyber-text mb-4 sm:mb-6">
                Assign Case
              </h2>
              <form onSubmit={handleAssign} className="space-y-4">
                <select
                  value={assignment.caseId}
                  onChange={(e) =>
                    setAssignment({ ...assignment, caseId: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  required
                  disabled={assignLoading}
                >
                  <option value="">Select Case</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem._id} value={caseItem._id}>
                      {caseItem.caseId}
                    </option>
                  ))}
                </select>
                <select
                  value={assignment.staffId}
                  onChange={(e) =>
                    setAssignment({ ...assignment, staffId: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-pink-400 text-sm sm:text-base transition-all duration-300"
                  required
                  disabled={assignLoading}
                >
                  <option value="">Select Staff</option>
                  {staff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full disabled:bg-pink-300 text-sm sm:text-base transition-all duration-300"
                  disabled={assignLoading}
                >
                  {assignLoading ? (
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
                    "Assign Case"
                  )}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Footer Component (Copied from Dashboard.js, Blog.js, BlogDetails.js, CaseDetails.js, CaseManagement.js, and AdminPanel.js)
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

export default Team;
