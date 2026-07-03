/**
 * Navbar Component — Sticky top navigation
 * Logo, search bar, auth buttons / user menu
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiUser, FiLogOut, FiHome, FiCalendar, FiGrid } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, isHost, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner container">
          {/* Logo */}
          <Link to="/" className="navbar-logo" id="logo-link">
            <svg className="logo-icon" viewBox="0 0 32 32" width="32" height="32" fill="none">
              <path d="M16 2L3 14h4v14h7v-9h4v9h7V14h4L16 2z" fill="var(--color-primary)" />
              <circle cx="16" cy="13" r="3" fill="white" />
            </svg>
            <span className="logo-text">StayFinder</span>
          </Link>

          {/* Search Bar — Desktop */}
          <form className="navbar-search" onSubmit={handleSearch} id="desktop-search">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                id="search-input"
              />
              <button type="submit" className="search-btn" id="search-btn" aria-label="Search">
                <FiSearch size={16} />
              </button>
            </div>
          </form>

          {/* Right Section */}
          <div className="navbar-right">
            {isHost && (
              <Link to="/dashboard" className="navbar-host-link" id="host-dashboard-link">
                Switch to hosting
              </Link>
            )}

            {/* User Menu / Auth Buttons */}
            <div className="navbar-menu-container" ref={menuRef}>
              <button
                className="navbar-menu-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                id="user-menu-btn"
                aria-label="User menu"
              >
                <FiMenu size={16} />
                <div className="menu-avatar">
                  {isAuthenticated && user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="avatar-img" />
                  ) : (
                    <FiUser size={16} />
                  )}
                </div>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="navbar-dropdown" id="user-dropdown">
                  {isAuthenticated ? (
                    <>
                      <div className="dropdown-user-info">
                        <span className="dropdown-user-name">{user.name}</span>
                        <span className="dropdown-user-email">{user.email}</span>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/trips" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        <FiCalendar size={16} /> My Trips
                      </Link>
                      {isHost && (
                        <Link to="/dashboard" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                          <FiGrid size={16} /> Host Dashboard
                        </Link>
                      )}
                      <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        <FiUser size={16} /> Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                          <FiGrid size={16} /> Admin Panel
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                        <FiLogOut size={16} /> Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item dropdown-item-bold" onClick={() => setMenuOpen(false)}>
                        Log in
                      </Link>
                      <Link to="/register" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-btn"
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <form className="mobile-search-form" onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }}>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn" aria-label="Search">
                  <FiSearch size={16} />
                </button>
              </div>
            </form>
            <div className="mobile-menu-links">
              {isAuthenticated ? (
                <>
                  <div className="mobile-user-info">
                    <div className="menu-avatar menu-avatar-lg">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="avatar-img" />
                      ) : (
                        <FiUser size={20} />
                      )}
                    </div>
                    <div>
                      <p className="mobile-user-name">{user.name}</p>
                      <p className="mobile-user-role">{user.role}</p>
                    </div>
                  </div>
                  <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <FiHome size={18} /> Home
                  </Link>
                  <Link to="/trips" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <FiCalendar size={18} /> My Trips
                  </Link>
                  {isHost && (
                    <Link to="/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiGrid size={18} /> Host Dashboard
                    </Link>
                  )}
                  <button className="mobile-link mobile-logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                    <FiLogOut size={18} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/register" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
