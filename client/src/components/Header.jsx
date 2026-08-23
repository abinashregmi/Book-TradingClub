import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaSearch,
  FaShieldAlt,
  FaBuilding,
  FaUserCheck,
  FaPlus,
  FaUserCog,
  FaFileContract,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
    // Close mobile menu automatically on route navigation
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  // Safe role normalization for badge display and RBAC navigation
  const getNormalizedRole = (role) => {
    if (!role) return 'citizen';
    const r = String(role).trim().toLowerCase();
    if (
      r === 'admin' ||
      r === 'government_officer' ||
      r === 'government officer' ||
      r === 'gov_auditor'
    ) {
      return 'admin';
    }
    if (r === 'agent') return 'agent';
    return 'citizen';
  };

  const userRole = getNormalizedRole(currentUser?.role);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="flex justify-between items-center max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        {/* Brand & Role Badge */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform duration-200">
            <FaBuilding className="text-base" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-lg sm:text-xl tracking-tight text-white">
              Civic<span className="text-emerald-400">Estate</span>
            </span>

            {/* Dynamic Clearance Role Badges */}
            {currentUser && (
              <>
                {userRole === 'admin' && (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/50 px-2.5 py-0.5 rounded-full shadow-inner">
                    <FaShieldAlt className="text-[10px] text-purple-400" />
                    <span>Gov Auditor</span>
                  </span>
                )}
                {userRole === 'agent' && (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold bg-blue-950/90 text-blue-300 border border-blue-500/50 px-2.5 py-0.5 rounded-full shadow-inner">
                    <FaBuilding className="text-[10px] text-blue-400" />
                    <span>Licensed Agent</span>
                  </span>
                )}
                {userRole === 'citizen' && (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full shadow-inner">
                    <FaUserCheck className="text-[10px] text-emerald-400" />
                    <span>Verified Citizen</span>
                  </span>
                )}
              </>
            )}
          </div>
        </Link>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="hidden sm:flex bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2 items-center gap-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all duration-200 mx-4 flex-1 max-w-xs"
        >
          <input
            type="text"
            placeholder="Search properties, Lalpurja..."
            className="bg-transparent focus:outline-none w-full text-xs sm:text-sm text-slate-100 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            aria-label="Search properties"
            className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
          >
            <FaSearch className="text-xs sm:text-sm" />
          </button>
        </form>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-semibold">
          <Link
            to="/"
            className={`transition py-1 px-2 rounded-lg ${
              location.pathname === '/'
                ? 'text-emerald-400 bg-slate-800/80 font-bold'
                : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            Home
          </Link>

          <Link
            to="/search"
            className={`transition py-1 px-2 rounded-lg ${
              location.pathname === '/search'
                ? 'text-emerald-400 bg-slate-800/80 font-bold'
                : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            Browse
          </Link>

          <Link
            to="/about"
            className={`transition py-1 px-2 rounded-lg ${
              location.pathname === '/about'
                ? 'text-emerald-400 bg-slate-800/80 font-bold'
                : 'text-slate-300 hover:text-emerald-400'
            }`}
          >
            Governance
          </Link>

          {/* Role-Specific Direct Navigation Links */}
          {currentUser && userRole === 'agent' && (
            <Link
              to="/agent/my-listings"
              className={`inline-flex items-center gap-1.5 transition py-1 px-2.5 rounded-lg border border-blue-500/30 ${
                location.pathname === '/agent/my-listings'
                  ? 'text-blue-300 bg-blue-950/90 font-bold'
                  : 'text-blue-300/90 hover:text-blue-200 bg-blue-950/40 hover:bg-blue-950/70'
              }`}
            >
              <FaBuilding className="text-xs text-blue-400" />
              <span>Portfolio</span>
            </Link>
          )}

          {currentUser && userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/audit-escrows"
                className={`inline-flex items-center gap-1.5 transition py-1 px-2.5 rounded-lg border border-purple-500/30 ${
                  location.pathname === '/admin/audit-escrows'
                    ? 'text-purple-300 bg-purple-950/90 font-bold'
                    : 'text-purple-300/90 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-950/70'
                }`}
              >
                <FaFileContract className="text-xs text-purple-400" />
                <span>Escrow Audits</span>
              </Link>
              <Link
                to="/admin/manage-users"
                className={`inline-flex items-center gap-1.5 transition py-1 px-2.5 rounded-lg border border-purple-500/30 ${
                  location.pathname === '/admin/manage-users'
                    ? 'text-purple-300 bg-purple-950/90 font-bold'
                    : 'text-purple-300/90 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-950/70'
                }`}
              >
                <FaUserCog className="text-xs text-purple-400" />
                <span>Clearances</span>
              </Link>
            </div>
          )}

          {/* Quick Create Listing for Agents/Admins */}
          {currentUser && (userRole === 'agent' || userRole === 'admin') && (
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-950 transition"
            >
              <FaPlus className="text-[10px]" />
              <span>New Listing</span>
            </Link>
          )}

          {/* User Profile Avatar / Sign In Button */}
          {currentUser ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 pl-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-full transition shadow-xs"
            >
              <span className="text-xs font-semibold text-slate-200 max-w-[90px] truncate">
                {currentUser.username}
              </span>
              <img
                src={
                  currentUser.avatar ||
                  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                }
                alt="profile"
                className="rounded-full h-7 w-7 object-cover border border-emerald-500/60 shrink-0"
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-md shadow-emerald-950/50"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Action Controls & Hamburger Toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          {currentUser ? (
            <Link to="/profile" className="flex items-center">
              <img
                src={
                  currentUser.avatar ||
                  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                }
                alt="profile"
                className="rounded-full h-8 w-8 object-cover border border-emerald-500/60"
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white p-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-base" /> : <FaBars className="text-base" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-850 border-t border-slate-800 px-4 py-4 space-y-3 animate-fadeIn">
          {/* Mobile Search Input */}
          <form onSubmit={handleSubmit} className="relative w-full pb-2">
            <input
              type="text"
              placeholder="Search properties, Lalpurja..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-4 text-slate-400 text-xs" />
          </form>

          {/* User Role Banner on Mobile */}
          {currentUser && (
            <div className="py-1 px-3 rounded-lg bg-slate-900 border border-slate-750 flex items-center justify-between text-xs">
              <span className="text-slate-400">Signed in as: <strong className="text-white">{currentUser.username}</strong></span>
              <span className="font-bold uppercase text-[10px] text-emerald-400">{userRole}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1 font-semibold text-sm">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
            >
              Home
            </Link>
            <Link
              to="/search"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
            >
              Browse Listings
            </Link>
            <Link
              to="/about"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
            >
              Governance & Standards
            </Link>

            {currentUser && (userRole === 'agent' || userRole === 'admin') && (
              <Link
                to="/create-listing"
                className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2 transition"
              >
                <FaPlus className="text-xs" />
                <span>Add New Property Listing</span>
              </Link>
            )}

            {currentUser && userRole === 'agent' && (
              <Link
                to="/agent/my-listings"
                className="p-2 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold flex items-center gap-2 transition"
              >
                <FaBuilding className="text-xs" />
                <span>Agent Property Portfolio</span>
              </Link>
            )}

            {currentUser && userRole === 'admin' && (
              <>
                <Link
                  to="/admin/audit-escrows"
                  className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-2 transition"
                >
                  <FaFileContract className="text-xs" />
                  <span>Land Registry & Escrow Audits</span>
                </Link>
                <Link
                  to="/admin/manage-users"
                  className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-2 transition"
                >
                  <FaUserCog className="text-xs" />
                  <span>Citizen & Agent Clearances</span>
                </Link>
              </>
            )}

            {currentUser && (
              <Link
                to="/profile"
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition border-t border-slate-800 mt-1"
              >
                Account Profile & Settings
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}