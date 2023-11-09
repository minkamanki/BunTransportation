import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import LoginPage, { setAuthToken } from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const loggedIn = localStorage.getItem("token");

  const handleLogOut = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    window.location.href = "/";
  };
  return (
    <Router>
      {loggedIn ? (
        <button onClick={handleLogOut}>Log Out</button>
      ) : (
        <nav>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
