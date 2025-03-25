import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("isAdmin", data.isAdmin);

      toast.success("Login successful!");
      navigate("/dashboard"); // Always redirect to dashboard
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {/* Cyber Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 opacity-80 animate-cyber-gradient"></div>
      <div className="absolute inset-0 cyber-rain"></div>

      <div className="relative bg-gray-800 bg-opacity-70 backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md border border-green-500 border-opacity-30 transform transition-all hover:scale-105 duration-300 z-10">
        {/* Fingerprint Icon with Neon Glow */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <i className="fas fa-fingerprint text-5xl text-green-400 opacity-80 animate-pulse"></i>
        </div>

        <h1 className="text-3xl font-extrabold text-green-400 text-center mb-8 tracking-wider cyber-text">
          Forensic Cyber Tracker
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="relative mb-6">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 pt-6 bg-transparent border border-green-500 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-green-400 peer"
              placeholder="Email"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-[20%] transform -translate-y-1/2 text-green-400 text-sm transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-green-300"
            >
              Email
            </label>
          </div>

          {/* Password Input */}
          <div className="relative mb-6">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 pt-6 bg-transparent border border-green-500 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-green-400 peer"
              placeholder="Password"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-[20%] transform -translate-y-1/2 text-green-400 text-sm transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-green-300"
            >
              Password
            </label>
          </div>

          {/* Role Selection */}
          <div className="relative mb-8">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-4 bg-transparent border border-green-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400 cyber-text"
            >
              <option value="staff" className="bg-gray-800">
                Staff
              </option>
              <option value="admin" className="bg-gray-800">
                Admin
              </option>
            </select>
            <label
              htmlFor="role"
              className="absolute left-4 top-[-8px] text-green-400 text-sm bg-gray-800 px-1 cyber-text"
            >
              Login As
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center animate-glitch">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full p-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 cyber-button"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
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
                Accessing...
              </span>
            ) : (
              "Access System"
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-green-400 text-sm mt-6 text-center cyber-text">
          New user?{" "}
          <a
            href="/register"
            className="text-green-300 hover:text-green-200 underline"
          >
            Signup
          </a>
        </p>

        {/* Cyber Footer */}
        <p className="text-green-400 text-sm mt-2 text-center cyber-text">
          Secure Cyber-Forensic Access
        </p>
      </div>
    </div>
  );
}

export default Login;
