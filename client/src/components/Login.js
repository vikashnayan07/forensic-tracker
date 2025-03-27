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
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Cyber Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 opacity-80 animate-cyber-gradient"></div>
      <div className="absolute inset-0 cyber-rain"></div>

      <div className="relative bg-gray-800 bg-opacity-70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md border border-green-500 border-opacity-30 transform transition-all hover:scale-105 duration-300 z-10">
        {/* Fingerprint Icon with Neon Glow */}
        <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2">
          <i className="fas fa-fingerprint text-4xl sm:text-5xl text-green-400 opacity-80 animate-pulse"></i>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-green-400 text-center mt-8 sm:mt-12 mb-6 sm:mb-8 tracking-wider cyber-text">
          Forensic Cyber Tracker
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="relative mb-4 sm:mb-6">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 sm:p-4 sm:pt-6 bg-transparent border border-green-500 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-green-400 peer text-sm sm:text-base"
              placeholder="Email"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-3 sm:left-4 top-[15%] sm:top-[20%] transform -translate-y-1/2 text-green-400 text-xs sm:text-sm transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-1 sm:peer-focus:top-2 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-green-300"
            >
              Email
            </label>
          </div>

          {/* Password Input */}
          <div className="relative mb-4 sm:mb-6">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 sm:p-4 sm:pt-6 bg-transparent border border-green-500 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-green-400 peer text-sm sm:text-base"
              placeholder="Password"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-3 sm:left-4 top-[15%] sm:top-[20%] transform -translate-y-1/2 text-green-400 text-xs sm:text-sm transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-1 sm:peer-focus:top-2 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-green-300"
            >
              Password
            </label>
          </div>

          {/* Role Selection */}
          <div className="relative mb-6 sm:mb-8">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 sm:p-4 bg-transparent border border-green-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400 cyber-text text-sm sm:text-base"
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
              className="absolute left-3 sm:left-4 top-[-6px] sm:top-[-8px] text-green-400 text-xs sm:text-sm bg-gray-800 px-1 cyber-text"
            >
              Login As
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-xs sm:text-sm mb-4 text-center animate-glitch">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full p-2 sm:p-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 cyber-button text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-2 text-white"
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
        <p className="text-green-400 text-xs sm:text-sm mt-4 sm:mt-6 text-center cyber-text">
          New user?{" "}
          <a
            href="/register"
            className="text-green-300 hover:text-green-200 underline"
          >
            Signup
          </a>
        </p>

        {/* Cyber Footer */}
        <p className="text-green-400 text-xs sm:text-sm mt-2 text-center cyber-text">
          Secure Cyber-Forensic Access
        </p>
      </div>
    </div>
  );
}

export default Login;
