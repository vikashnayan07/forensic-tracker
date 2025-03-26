import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function CaseDetails() {
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [remarkForms, setRemarkForms] = useState({}); // State for evidence remark inputs
  const [caseRemark, setCaseRemark] = useState(""); // State for case remark input
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const [caseRes, evidenceRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/cases/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL}/evidence`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const caseData = await caseRes.json();
        const evidenceData = await evidenceRes.json();

        if (!caseRes.ok)
          throw new Error(caseData.message || "Failed to fetch case");
        if (!evidenceRes.ok)
          throw new Error(evidenceData.message || "Failed to fetch evidence");

        setCaseItem(caseData);
        // Access the `evidence` array from the response and filter it
        setEvidence(
          evidenceData.evidence.filter((item) => item.caseId?._id === id)
        );
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
  }, [id, navigate]);

  const handleCloseCase = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/cases/${id}/close`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to close case");
      setCaseItem(data.case);
      toast.success("Case closed successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddCaseRemark = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!caseRemark.trim()) {
        toast.error("Remark text cannot be empty");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/cases/${id}/remarks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: caseRemark }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add remark");

      setCaseItem(data.case); // Update the case with the new remark
      setCaseRemark(""); // Clear the input
      toast.success("Remark added to case successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddEvidenceRemark = async (evidenceId) => {
    try {
      const token = localStorage.getItem("token");
      const text = remarkForms[evidenceId] || "";
      if (!text.trim()) {
        toast.error("Remark text cannot be empty");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/evidence/${evidenceId}/remarks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add remark");

      setEvidence((prevEvidence) =>
        prevEvidence.map((item) =>
          item._id === evidenceId ? data.evidence : item
        )
      );

      setRemarkForms((prev) => ({ ...prev, [evidenceId]: "" }));
      toast.success("Remark added to evidence successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemarkChange = (evidenceId, value) => {
    setRemarkForms((prev) => ({ ...prev, [evidenceId]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.success("Logged out successfully!");
    navigate("/login");
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
  if (!caseItem)
    return <p className="text-gray-200 text-center">Case not found</p>;

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
              src="https://placehold.co/40x40"
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
            Case Details: {caseItem.caseId}
          </h1>
          <div className="flex items-center space-x-4">
            {isAdmin && caseItem.status !== "Closed" && (
              <button
                onClick={handleCloseCase}
                className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
              >
                Close Case
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500 text-white rounded-lg cyber-button hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Case Details Content */}
        <div className="p-8 z-10 bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] rounded-xl m-4 shadow-2xl border border-pink-500 border-opacity-50 cyber-circuit relative">
          <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500">
            <h2 className="text-xl font-semibold text-pink-400 cyber-text mb-4">
              Case Information
            </h2>
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
            <p className="text-gray-200">Location: {caseItem.location}</p>
            <p className="text-gray-200">
              Assigned Staff: {caseItem.staffId?.name || "Unassigned"}
            </p>
          </div>

          {/* Add Case Remark Form */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-pink-400 cyber-text mb-4">
              Add Remark to Case
            </h2>
            <textarea
              placeholder="Add a remark to this case..."
              value={caseRemark}
              onChange={(e) => setCaseRemark(e.target.value)}
              className="w-full p-2 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
              rows="3"
            />
            <button
              onClick={handleAddCaseRemark}
              className="mt-2 p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full"
            >
              Add Remark
            </button>
          </div>

          {/* Display Case Remarks */}
          {caseItem.remarks && caseItem.remarks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-pink-400 cyber-text mb-4">
                Case Remarks
              </h2>
              <div className="space-y-4">
                {caseItem.remarks.map((remark, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 bg-opacity-90 p-4 rounded-lg border border-pink-500"
                  >
                    <p className="text-gray-200">{remark.text}</p>
                    <p className="text-gray-300 text-sm mt-2">
                      By: {remark.staffId?.name || "Unknown"} | Date:{" "}
                      {new Date(remark.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Associated with the Case */}
          {evidence.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-pink-400 cyber-text mb-4">
                Associated Evidence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evidence.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-800 bg-opacity-90 p-6 rounded-lg border border-pink-500"
                  >
                    <h3 className="text-lg font-semibold text-pink-400 cyber-text">
                      {item.item}
                    </h3>
                    <p className="text-gray-200">{item.description}</p>
                    {item.photo && (
                      <img
                        src={item.photo}
                        alt={item.item}
                        className="mt-4 w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    )}
                    <p className="text-gray-300 mt-2">
                      Uploaded by: {item.uploadedBy?.name || "Unknown"}
                    </p>
                    <p className="text-gray-300 mt-2">
                      Date: {new Date(item.timestamp).toLocaleDateString()}
                    </p>

                    {/* Evidence Remarks */}
                    {item.remarks && item.remarks.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-pink-400 cyber-text mb-2">
                          Remarks
                        </h4>
                        <div className="space-y-2">
                          {item.remarks.map((remark, index) => (
                            <div
                              key={index}
                              className="bg-gray-700 bg-opacity-90 p-3 rounded-lg border border-pink-600"
                            >
                              <p className="text-gray-200">{remark.text}</p>
                              <p className="text-gray-300 text-sm mt-1">
                                By: {remark.staffId?.name || "Unknown"} | Date:{" "}
                                {new Date(
                                  remark.timestamp
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Evidence Remark Form */}
                    <div className="mt-4">
                      <textarea
                        placeholder="Add a remark to this evidence..."
                        value={remarkForms[item._id] || ""}
                        onChange={(e) =>
                          handleRemarkChange(item._id, e.target.value)
                        }
                        className="w-full p-2 bg-transparent border border-pink-500 rounded-lg text-white cyber-text"
                        rows="2"
                      />
                      <button
                        onClick={() => handleAddEvidenceRemark(item._id)}
                        className="mt-2 p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full"
                      >
                        Add Remark
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseDetails;
