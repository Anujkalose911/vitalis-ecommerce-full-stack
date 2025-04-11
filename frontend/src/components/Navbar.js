import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { cartItems, isLoggedIn } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSuggestion, setCurrentSuggestion] = useState("");
  const [user, setUser] = useState(null);
  const userMenuRef = useRef(null);
  const searchBarRef = useRef(null);

  // Sample search suggestions
  const searchSuggestions = [
    "try sunscreen",
    "or maybe protein powder",
    "vitamin supplements",
    "yoga mat",
    "threadmill",
    "body lotion",
    "wood comb",
    "singing bowl"
  ];

  // Check if user is logged in on component mount and when user state changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [isLoggedIn()]);

  // Typewriter effect for search suggestions
  useEffect(() => {
    let currentIndex = 0;
    let currentText = "";
    let isDeleting = false;
    let timeout;

    const type = () => {
      const currentSuggestion = searchSuggestions[currentIndex];
      
      if (isDeleting) {
        currentText = currentSuggestion.substring(0, currentText.length - 1);
      } else {
        currentText = currentSuggestion.substring(0, currentText.length + 1);
      }

      setCurrentSuggestion(currentText);

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && currentText === currentSuggestion) {
        // Pause at the end of typing
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % searchSuggestions.length;
      }

      timeout = setTimeout(type, typeSpeed);
    };

    if (showSearchSuggestions) {
      timeout = setTimeout(type, 500);
    }

    return () => clearTimeout(timeout);
  }, [showSearchSuggestions]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserMenu(false);
    navigate("/");
  };

  // Get cart item count
  const cartItemCount = cartItems ? cartItems.length : 0;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="brand-logo">
          <span className="brand-text">Vitalis & Co.</span>
        </Link>
      </div>

      <div className="navbar-center">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder={showSearchSuggestions ? currentSuggestion : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              ref={searchBarRef}
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </form>
      </div>

      <div className="navbar-right">
        <div className="nav-links">
          <Link to="/" className="nav-link">Products</Link>
          <Link to="/orders" className="nav-link">My Orders</Link>
          
          {/* Cart Icon with Count */}
          {user && (
            <Link to="/cart" className="nav-link cart-link">
              <div className="cart-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span className="cart-count">{cartItemCount}</span>
                )}
              </div>
            </Link>
          )}
          
          {/* User Icon with Dropdown */}
          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-icon-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                {user ? (
                  <>
                    <div className="user-info">
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="login-button">Login</Link>
                    <Link to="/signup" className="signup-button">Sign Up</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
