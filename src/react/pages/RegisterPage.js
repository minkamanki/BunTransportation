import React, { useState } from "react";
import axios from "axios";

function RegisterPage() {
  const API_URL = "http://localhost:8000";
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/register`, formData)
    .then(() => {
      // Registration success
      setSuccessMessage("Registration successful. You can now login.");
      setErrorMessage("");
    })
    .catch((err) => {
      // Registration failure
      setSuccessMessage("");
      setErrorMessage("Registration failed. Please try again.");
      console.error(err);
    });;
  };

  return (
    <div>
      <h2>Register</h2>
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;
