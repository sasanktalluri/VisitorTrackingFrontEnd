import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem("token");
  const role = localStorage.getItem("role"); 
  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); 
    navigate("/login");
  };

  return (
    <header className="bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
      <h4 className="m-0">VisTrack</h4>

      {!isLoginPage && isAuthenticated && (
        <nav className="d-flex gap-3 align-items-center">
          {role === "ADMIN" && (
            <Link to="/dashboard" className="text-white text-decoration-none">
              Dashboard
            </Link>
          )}
          <Link to="/receptionist" className="text-white text-decoration-none">
            Receptionist
          </Link>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-light">
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
