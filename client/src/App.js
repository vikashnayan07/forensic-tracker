import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CaseDetails from "./components/CaseDetails";
import Team from "./components/Team";
import AdminPanel from "./components/AdminPanel";
import CaseManagement from "./components/CaseManagement";
import Blog from "./components/Blog"; // Import the new Blog component
import BlogDetails from "./components/BlogDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        <Route path="/team" element={<Team />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route
          path="/admin/edit-staff/:id"
          element={<div>Edit Staff Page (TBD)</div>}
        />
        <Route path="/case-management" element={<CaseManagement />} />
        <Route path="/blog" element={<Blog />} /> {/* New route for Blog */}
        <Route path="/blog/:id" element={<BlogDetails />} />{" "}
        <Route path="/" element={<Login />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Router>
  );
}

export default App;
