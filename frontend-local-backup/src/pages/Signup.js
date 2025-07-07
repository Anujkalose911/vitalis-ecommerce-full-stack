import React, { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // We'll create this shared style file

const Signup = () => {
  const [user, setUser] = useState({ fname: "", lname: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    // Clear error when user starts typing again
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await registerUser(user);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login"); // Redirect to login page after successful signup
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      if (typeof err === 'string') {
        setError(err);
      } else if (err.error) {
        setError(err.error);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Create Your Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Registration successful! Redirecting to login...</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fname">First Name</label>
            <input 
              type="text" 
              id="fname"
              name="fname" 
              value={user.fname}
              placeholder="Enter your first name" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lname">Last Name</label>
            <input 
              type="text" 
              id="lname"
              name="lname" 
              value={user.lname}
              placeholder="Enter your last name" 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              value={user.email}
              placeholder="Enter your email" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password" 
              value={user.password}
              placeholder="Create a password" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? "Processing..." : "Register"}
          </button>
        </form>
        
        <p className="auth-redirect">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
