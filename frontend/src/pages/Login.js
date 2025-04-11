import React, { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // Shared styles with signup

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user starts typing again
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await loginUser(credentials);
      navigate("/"); // Redirect to home after successful login
    } catch (err) {
      console.error("Login error:", err);
      if (typeof err === 'string') {
        setError(err);
      } else if (err.error) {
        setError(err.error);
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Login to Your Account</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              value={credentials.email}
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
              value={credentials.password}
              placeholder="Enter your password" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p className="auth-redirect">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
