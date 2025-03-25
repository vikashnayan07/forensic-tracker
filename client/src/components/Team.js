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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
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
        if (err.message.includes("Invalid token")) {
          localStorage.removeItem("token");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] flex items-center justify-center">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] flex items-center justify-center">
        <p className="text-red-400 animate-glitch">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_#1a0033_0%,_#0d001a_70%)] cyber-circuit p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-pink-500 border-opacity-50 p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600"
        >
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-pink-400 cyber-text mb-6">
          Team Management
        </h1>

        {/* Staff List */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-pink-400 cyber-text mb-4">
            Staff Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((member) => (
              <div
                key={member._id}
                className="bg-gray-700 p-4 rounded-lg border border-pink-500 border-opacity-30"
              >
                <p className="text-gray-200">Name: {member.name}</p>
                <p className="text-gray-200">Email: {member.email}</p>
                <p className="text-gray-200">
                  Assigned Cases:{" "}
                  {cases.filter((c) => c.staffId?._id === member._id).length}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Assign Case Form */}
        <section>
          <h2 className="text-2xl font-semibold text-pink-400 cyber-text mb-4">
            Assign Case
          </h2>
          <form onSubmit={handleAssign} className="space-y-4">
            <select
              value={assignment.caseId}
              onChange={(e) =>
                setAssignment({ ...assignment, caseId: e.target.value })
              }
              className="w-full p-2 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text"
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
              className="w-full p-2 bg-gray-800 border border-pink-500 rounded-lg text-white cyber-text"
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
              className="p-2 bg-pink-500 text-white rounded-lg cyber-button hover:bg-pink-600 w-full disabled:bg-pink-300"
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
  );
}

export default Team;
