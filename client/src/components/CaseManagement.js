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
  const navigate = useNavigate();

  // Fetch cases and evidence
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
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

        if (!casesRes.ok || !evidenceRes.ok) {
          throw new Error("Failed to fetch data");
        }

        setCases(casesData);
        setEvidence(evidenceData);
      } catch (err) {
        toast.error(err.message);
        if (err.message.includes("Invalid token")) navigate("/login");
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
      >
        Back to Dashboard
      </button>

      {/* Case Management Header */}
      <h1 className="text-3xl font-bold text-pink-500 mb-6">Case Management</h1>

      {/* Cases and Evidence Section */}
      <div className="mb-12">
        <h2 className="text-2xl text-pink-500 mb-4">Cases and Evidence</h2>
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
        ) : cases.length === 0 ? (
          <p className="text-white">No cases found</p>
        ) : (
          <div className="space-y-6">
            {cases.map((caseItem) => (
              <div
                key={caseItem._id}
                className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700"
              >
                <h3 className="text-xl font-semibold text-pink-500">
                  {caseItem.caseId}
                </h3>
                <p className="text-white">Location: {caseItem.location}</p>
                <p className="text-white">Status: {caseItem.status}</p>
                <p className="text-white">
                  Evidence Items:{" "}
                  {
                    evidence.filter((e) => e.caseId?._id === caseItem._id)
                      .length
                  }
                </p>

                {/* Evidence List */}
                <div className="mt-4">
                  <h4 className="text-lg text-pink-500 mb-2">Evidence</h4>
                  {evidence
                    .filter((e) => e.caseId?._id === caseItem._id)
                    .map((evidenceItem) => (
                      <div
                        key={evidenceItem._id}
                        className="bg-gray-700 p-3 rounded-lg mb-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-white">
                            <span className="font-semibold">Item:</span>{" "}
                            {evidenceItem.item}
                          </p>
                          <p className="text-white">
                            <span className="font-semibold">Description:</span>{" "}
                            {evidenceItem.description}
                          </p>
                          <p className="text-white">
                            <span className="font-semibold">Location:</span>{" "}
                            {evidenceItem.location}
                          </p>
                          {evidenceItem.photo && (
                            <img
                              src={evidenceItem.photo}
                              alt={evidenceItem.item}
                              className="mt-2 w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(evidenceItem)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(evidenceItem._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Evidence Modal */}
      {editEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-pink-500 w-full max-w-md">
            <h3 className="text-2xl text-pink-500 mb-4">Edit Evidence</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                placeholder="Item"
                value={editForm.item}
                onChange={(e) =>
                  setEditForm({ ...editForm, item: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                className="w-full p-2 mb-4 bg-transparent border border-pink-500 rounded-lg text-white"
                required
              />
              <select
                value={editForm.caseId}
                onChange={(e) =>
                  setEditForm({ ...editForm, caseId: e.target.value })
                }
                className="w-full p-2 mb-4 bg-gray-800 border border-pink-500 rounded-lg text-white"
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
                } rounded-lg text-center text-gray-200`}
              >
                <input {...getInputProps()} />
                {editForm.photo ? (
                  <p>{editForm.photo.name}</p>
                ) : (
                  <p>Drag & drop a new image, or click to select (optional)</p>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setEditEvidence(null)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseManagement;
