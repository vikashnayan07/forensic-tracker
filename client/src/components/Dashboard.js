import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(false); // Separate loading state for evidence
  const [error, setError] = useState("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [caseForm, setCaseForm] = useState({ caseId: "", location: "" });
  const [evidenceForm, setEvidenceForm] = useState({
    item: "",
    description: "",
    location: "",
    caseId: "",
    photo: null,
  });
  const [editForm, setEditForm] = useState({
    id: "",
    item: "",
    description: "",
    location: "",
    caseId: "",
    photo: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [caseFilter, setCaseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalLoading, setModalLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6; // Match backend limit

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const profileRes = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!profileRes.ok) {
          const profileError = await profileRes.json();
          throw new Error(profileError.message || "Failed to fetch profile");
        }
        const profileData = await profileRes.json();
        setUserProfile(profileData);

        const casesRes = await fetch(`${process.env.REACT_APP_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!casesRes.ok) {
          const casesError = await casesRes.json();
          throw new Error(casesError.message || "Failed to fetch cases");
        }
        const casesData = await casesRes.json();
        setCases(casesData);

        await fetchEvidence(token, currentPage);

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
  }, [navigate, currentPage, searchQuery, caseFilter]);

  const fetchEvidence = async (token, page) => {
    setEvidenceLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: itemsPerPage,
        search: searchQuery,
        caseId: caseFilter,
      });
      const evidenceRes = await fetch(
        `${process.env.REACT_APP_API_URL}/evidence?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!evidenceRes.ok) {
        const evidenceError = await evidenceRes.json();
        throw new Error(evidenceError.message || "Failed to fetch evidence");
      }
      const evidenceData = await evidenceRes.json();
      setEvidence(evidenceData.evidence);
      setCurrentPage(evidenceData.currentPage);
      setTotalPages(evidenceData.totalPages);
      setTotalItems(evidenceData.totalItems);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/cases`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(caseForm),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create case");
      setCases([...cases, data.case]);
      setShowCaseModal(false);
      setCaseForm({ caseId: "", location: "" });
      toast.success("Case created successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      if (showEditModal) {
        setEditForm({ ...editForm, photo: acceptedFiles[0] });
      } else {
        setEvidenceForm({ ...evidenceForm, photo: acceptedFiles[0] });
      }
    },
  });

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("item", evidenceForm.item);
      formData.append("description", evidenceForm.description);
      formData.append("location", evidenceForm.location);
      formData.append("caseId", evidenceForm.caseId);
      if (evidenceForm.photo) formData.append("photo", evidenceForm.photo);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/evidence`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to upload evidence");
      setEvidence([...evidence, data.evidence]);
      setShowEvidenceModal(false);
      setEvidenceForm({
        item: "",
        description: "",
        location: "",
        caseId: "",
        photo: null,
      });
      toast.success("Evidence uploaded successfully!");
      // Refresh evidence after upload
      await fetchEvidence(token, currentPage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditForm({
      id: item._id,
      item: item.item,
      description: item.description,
      location: item.location,
      caseId: item.caseId?._id || "",
      photo: null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("item", editForm.item);
      formData.append("description", editForm.description);
      formData.append("location", editForm.location);
      if (isAdmin) {
        formData.append("caseId", editForm.caseId);
        if (editForm.photo) formData.append("photo", editForm.photo);
      }

      const url = isAdmin
        ? `${process.env.REACT_APP_API_URL}/evidence/${editForm.id}`
        : `${process.env.REACT_APP_API_URL}/evidence/${editForm.id}`;
      const method = isAdmin ? "PATCH" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update evidence");

      setEvidence(
        evidence.map((item) =>
          item._id === editForm.id ? data.evidence : item
        )
      );
      setShowEditModal(false);
      setEditForm({
        id: "",
        item: "",
        description: "",
        location: "",
        caseId: "",
        photo: null,
      });
      toast.success("Evidence updated successfully!");
      // Refresh evidence after edit
      await fetchEvidence(token, currentPage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this evidence?")) {
      return;
    }
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
      // Refresh evidence after delete
      await fetchEvidence(token, currentPage);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTimeout(() => setSearchQuery(value), 300);
    setCurrentPage(1);
  };

  const barData = {
    labels: cases.map((c) => c.caseId),
    datasets: [
      {
        label: "Evidence per Case",
        data: cases.map(
          (c) => evidence.filter((e) => e.caseId?._id === c._id).length
        ),
        backgroundColor: "rgba(236, 72, 153, 0.7)",
      },
    ],
  };

  const pieData = {
    labels: ["With Photos", "Without Photos"],
    datasets: [
      {
        data: [
          evidence.filter((e) => e.photo).length,
          evidence.filter((e) => !e.photo).length,
        ],
        backgroundColor: ["#ec4899", "#a855f7"],
      },
    ],
  };

  const lineData = {
    labels: cases
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((c) => new Date(c.date).toLocaleDateString()),
    datasets: [
      {
        label: "Cases Over Time",
        data: cases
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((_, i) => cases.slice(0, i + 1).length),
        borderColor: "#ec4899",
        fill: false,
      },
    ],
  };

  const filteredCases = cases.filter(
    (c) =>
      (c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "All" || c.status === statusFilter)
  );
  const filteredEvidence = evidence.filter(
    (e) =>
      e.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.caseId &&
        e.caseId.caseId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-900 flex">
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
              src="https://placehold.co/40x40"
              alt="User"
              className="w-10 h-10 rounded-full mr-2"
              onError={(e) => (e.target.src = "/images/default-profile.png")}
            />
            <span className="text-green-400 cyber-text">
              {userProfile?.email || localStorage.getItem("email") || "User"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 ml-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 opacity-80 animate-cyber-gradient"></div>
        <div className="absolute inset-0 cyber-rain"></div>

        <header className="bg-gray-800 bg-opacity-70 backdrop-blur-md p-4 flex justify-between items-center z-10">
          <div className="flex space-x-4 w-1/2">
            <input
              type="text"
              placeholder="Search cases or evidence..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="p-2 bg-transparent border border-green-500 rounded-lg text-white cyber-text focus:ring-2 focus:ring-green-400 flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-gray-800 border border-green-500 rounded-lg text-white cyber-text"
            >
              <option value="All">All Cases</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={caseFilter}
              onChange={(e) => {
                setCaseFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="p-2 bg-gray-800 border border-green-500 rounded-lg text-white cyber-text"
            >
              <option value="">All Evidence</option>
              {cases.map((caseItem) => (
                <option key={caseItem._id} value={caseItem._id}>
                  {caseItem.caseId}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <i className="fas fa-bell text-green-400 text-2xl hover:text-green-300 cursor-pointer"></i>
            {isAdmin && (
              <button
                onClick={() => setShowCaseModal(true)}
                className="p-2 bg-green-500 text-white rounded-lg cyber-button hover:bg-green-600"
              >
                New Case
              </button>
            )}
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="p-2 bg-blue-500 text-white rounded-lg cyber-button hover:bg-blue-600"
            >
              Upload Evidence
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative">
          {loading && (
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
          )}
          {error && (
            <p className="text-red-400 animate-glitch text-center">{error}</p>
          )}

          {!loading && !error && (
            <>
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-pink-400 cyber-text mb-6 animate-pulse">
                  Active Cases
                </h2>
                {filteredCases.length === 0 ? (
                  <p className="text-gray-200 text-center">No cases found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCases.map((caseItem) => (
                      <div
                        key={caseItem._id}
                        className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300"
                      >
                        <h3 className="text-xl font-semibold text-pink-400 cyber-text">
                          {caseItem.caseId}
                        </h3>
                        <p className="text-gray-200">
                          Status:{" "}
                          <span
                            className={
                              caseItem.status === "Closed"
                                ? "text-red-400"
                                : "text-pink-300"
                            }
                          >
                            {caseItem.status}
                          </span>
                        </p>
                        <p className="text-gray-200">
                          Date: {new Date(caseItem.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-200">
                          Location: {caseItem.location}
                        </p>
                        <p className="text-gray-200">
                          Assigned: {caseItem.staffId?.name || "Unassigned"}
                        </p>
                        <p className="text-gray-200">
                          Evidence Items:{" "}
                          {
                            evidence.filter(
                              (e) => e.caseId?._id === caseItem._id
                            ).length
                          }
                        </p>
                        <p className="text-gray-200">
                          Remarks:{" "}
                          {caseItem.remarks ? caseItem.remarks.length : 0}
                        </p>
                        <button
                          onClick={() => navigate(`/cases/${caseItem._id}`)}
                          className="mt-4 p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold text-pink-400 cyber-text mb-6 animate-pulse">
                  Evidence Gallery
                </h2>
                {evidenceLoading ? (
                  <div className="text-center text-pink-400 cyber-text">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto"
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
                    Loading evidence...
                  </div>
                ) : filteredEvidence.length === 0 ? (
                  <p className="text-gray-200 text-center">
                    No evidence found.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvidence.map((item) => (
                        <div
                          key={item._id}
                          className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300"
                        >
                          <h3 className="text-xl font-semibold text-pink-400 cyber-text">
                            {item.item}
                          </h3>
                          <p className="text-gray-200">{item.description}</p>
                          {console.log("Evidence photo URL:", item.photo)}{" "}
                          {/* Add debug logging */}
                          {item.photo ? (
                            <LazyLoadImage
                              src={
                                item.photo.startsWith("http")
                                  ? item.photo
                                  : `${process.env.REACT_APP_API_URL}/${item.photo}`
                              }
                              alt={item.item}
                              className="mt-4 w-full h-48 object-cover rounded-lg shadow-md"
                              loading="lazy"
                              onError={(e) =>
                                (e.target.src =
                                  "https://placehold.co/150x150?text=Image+Not+Found")
                              }
                            />
                          ) : (
                            <p className="text-gray-200 mt-4">
                              No photo available
                            </p>
                          )}
                          <p className="text-gray-300 mt-2">
                            Case:{" "}
                            {item.caseId && item.caseId.caseId
                              ? item.caseId.caseId
                              : "Unassigned"}
                          </p>
                          <p className="text-gray-300 mt-2">
                            Uploaded by: {item.uploadedBy?.name || "Unknown"}
                          </p>
                          <p className="text-gray-300 mt-2">
                            Date:{" "}
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                          <div className="mt-4 flex space-x-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 bg-yellow-500 text-white rounded-lg cyber-button hover:bg-yellow-600 w-full"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteClick(item._id)}
                                className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600 w-full"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    <div className="mt-6 flex justify-center items-center space-x-4">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300"
                      >
                        Previous
                      </button>
                      <span className="text-gray-200 cyber-text">
                        Page {currentPage} of {totalPages} (Total Items:{" "}
                        {totalItems})
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300"
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </section>

              <section>
                <h2 className="text-3xl font-bold text-pink-400 cyber-text mb-6 animate-pulse">
                  Analytics
                </h2>
                {cases.length === 0 ? (
                  <p className="text-gray-200 text-center">
                    No data available for analytics.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500">
                      <Bar
                        data={barData}
                        options={{
                          plugins: { legend: { labels: { color: "#fff" } } },
                          scales: {
                            x: { ticks: { color: "#fff" } },
                            y: { ticks: { color: "#fff" } },
                          },
                        }}
                      />
                    </div>
                    <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500">
                      <Pie
                        data={pieData}
                        options={{
                          plugins: { legend: { labels: { color: "#fff" } } },
                        }}
                      />
                    </div>
                    <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500">
                      <Line
                        data={lineData}
                        options={{
                          plugins: { legend: { labels: { color: "#fff" } } },
                          scales: {
                            x: { ticks: { color: "#fff" } },
                            y: { ticks: { color: "#fff" } },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {showCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-pink-500 w-full max-w-md">
              <h3 className="text-2xl text-pink-400 cyber-text mb-4">
                Create New Case
              </h3>
              <form onSubmit={handleCaseSubmit}>
                <input
                  type="text"
                  placeholder="Case ID"
                  value={caseForm.caseId}
                  onChange={(e) =>
                    setCaseForm({ ...caseForm, caseId: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={caseForm.location}
                  onChange={(e) =>
                    setCaseForm({ ...caseForm, location: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCaseModal(false)}
                    className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
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
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEvidenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-pink-500 w-full max-w-md">
              <h3 className="text-2xl text-pink-400 cyber-text mb-4">
                Upload Evidence
              </h3>
              <form onSubmit={handleEvidenceSubmit}>
                <input
                  type="text"
                  placeholder="Item"
                  value={evidenceForm.item}
                  onChange={(e) =>
                    setEvidenceForm({ ...evidenceForm, item: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={evidenceForm.description}
                  onChange={(e) =>
                    setEvidenceForm({
                      ...evidenceForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={evidenceForm.location}
                  onChange={(e) =>
                    setEvidenceForm({
                      ...evidenceForm,
                      location: e.target.value,
                    })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <select
                  value={evidenceForm.caseId}
                  onChange={(e) =>
                    setEvidenceForm({ ...evidenceForm, caseId: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
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
                  } rounded-lg text-center text-gray-200 cyber-text ${
                    modalLoading ? "opacity-50" : ""
                  }`}
                >
                  <input {...getInputProps()} disabled={modalLoading} />
                  {evidenceForm.photo ? (
                    <p>{evidenceForm.photo.name}</p>
                  ) : (
                    <p>Drag & drop an image here, or click to select</p>
                  )}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEvidenceModal(false)}
                    className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
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
                      "Upload"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-pink-500 w-full max-w-md">
              <h3 className="text-2xl text-pink-400 cyber-text mb-4">
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
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                  required
                  disabled={modalLoading}
                />
                {isAdmin && (
                  <>
                    <select
                      value={editForm.caseId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, caseId: e.target.value })
                      }
                      className="w-full p-2 mb-4 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text"
                      required
                      disabled={modalLoading}
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
                      } rounded-lg text-center text-gray-200 cyber-text ${
                        modalLoading ? "opacity-50" : ""
                      }`}
                    >
                      <input {...getInputProps()} disabled={modalLoading} />
                      {editForm.photo ? (
                        <p>{editForm.photo.name}</p>
                      ) : (
                        <p>Drag & drop a new image here, or click to select</p>
                      )}
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 disabled:bg-pink-300"
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
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
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
