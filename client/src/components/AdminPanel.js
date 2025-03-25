import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AdminPanel() {
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all staff
  const fetchAllStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/staff`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setAllStaff(data);
    } catch (err) {
      toast.error(err.message);
      if (err.message.includes("Invalid token")) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Approve/Unapprove staff
  const handleApproval = async (id, isApproved) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/approve/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isApproved }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update approval");
      toast.success(data.message);
      fetchAllStaff(); // Refresh staff list
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete staff
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?"))
      return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/staff/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete staff");
      toast.success("Staff deleted successfully");
      fetchAllStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    toast.info("Logged out successfully");
    navigate("/login");
  };

  // Fetch data on mount
  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      toast.error("Admin access required");
      navigate("/login");
    } else {
      fetchAllStaff();
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
      >
        Back to Dashboard
      </button>

      {/* Admin Panel Header */}
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Admin Panel</h1>

      {/* Staff Management Section */}
      <div className="mb-12">
        <h2 className="text-2xl text-pink-500 mb-4">Staff Management</h2>
        {loading ? (
          <div className="flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-pink-500"
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
        ) : allStaff.length === 0 ? (
          <p className="text-white">No staff registered</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allStaff.map((staff) => (
              <div
                key={staff._id}
                className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700"
              >
                <p className="text-white">
                  <span className="font-semibold">Name:</span> {staff.name}
                </p>
                <p className="text-white">
                  <span className="font-semibold">Email:</span> {staff.email}
                </p>
                <p className="text-white">
                  <span className="font-semibold">Admin:</span>{" "}
                  {staff.isAdmin ? "Yes" : "No"}
                </p>
                <p className="text-white mb-4">
                  <span className="font-semibold">Approved:</span>{" "}
                  {staff.isApproved ? "Yes" : "No"}
                </p>
                <div className="flex gap-2">
                  {staff.isAdmin ? (
                    <span className="text-gray-400">Admin (Cannot Modify)</span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproval(staff._id, true)}
                        className={`px-3 py-1 rounded-lg text-white ${
                          staff.isApproved
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                        disabled={staff.isApproved}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(staff._id, false)}
                        className={`px-3 py-1 rounded-lg text-white ${
                          !staff.isApproved
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                        disabled={!staff.isApproved}
                      >
                        Unapprove
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/admin/edit-staff/${staff._id}`)} // Placeholder for edit route
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(staff._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder for Case Management Section */}
      <div>
        <h2 className="text-2xl text-pink-500 mb-4">Case Management</h2>
        <p className="text-white">Case management features coming soon...</p>
      </div>
    </div>
  );
}

export default AdminPanel;
