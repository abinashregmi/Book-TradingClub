import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
} from '../redux/user/userSlice';

export default function Profile() {
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Normalize role string safely
  const getNormalizedRole = (role) => {
    if (!role) return 'citizen';
    const r = String(role).trim().toLowerCase();
    if (r === 'user' || r === 'citizen') return 'citizen';
    if (r === 'agent') return 'agent';
    if (r === 'admin' || r === 'government_officer' || r === 'government officer' || r === 'gov_auditor') {
      return 'admin';
    }
    return 'citizen';
  };

  const userRole = getNormalizedRole(currentUser?.role);

  // 1. ROBUST GLOBAL LOGOUT / SIGN OUT HANDLER
  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      dispatch(signOutUserStart());

      const res = await fetch('/api/auth/signout', {
        method: 'GET',
      });
      const data = await res.json();

      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        setSignOutLoading(false);
        return;
      }

      // Clear client state & local persisted caches
      dispatch(signOutUserSuccess());
      localStorage.removeItem('persist:root');
      sessionStorage.clear();

      setSignOutLoading(false);
      navigate('/sign-in');
    } catch (err) {
      dispatch(signOutUserFailure(err.message));
      setSignOutLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="p-4 max-w-xl mx-auto min-h-[80vh]">
      <h1 className="text-3xl font-bold text-center text-slate-800 my-6">
        Account Clearance & Profile
      </h1>

      {/* Role Badge Indicator */}
      <div className="flex justify-center mb-6">
        {userRole === 'admin' && (
          <div className="flex items-center gap-1.5 bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Government Officer & Auditor (Admin)</span>
          </div>
        )}
        {userRole === 'agent' && (
          <div className="flex items-center gap-1.5 bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Licensed Real Estate Agent</span>
          </div>
        )}
        {userRole === 'citizen' && (
          <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Verified Citizen Account</span>
          </div>
        )}
      </div>

      {/* Profile Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <form className="flex flex-col gap-4">
          <img
            src={
              currentUser?.avatar ||
              'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
            }
            alt="profile"
            className="rounded-full h-24 w-24 object-cover self-center border-2 border-slate-200 shadow-xs"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
            <input
              type="text"
              defaultValue={currentUser?.username}
              id="username"
              onChange={handleChange}
              className="border border-slate-300 p-2.5 rounded-lg w-full text-sm focus:outline-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              defaultValue={currentUser?.email}
              id="email"
              disabled
              className="border border-slate-200 bg-slate-50 text-slate-500 p-2.5 rounded-lg w-full text-sm cursor-not-allowed"
            />
          </div>
        </form>
      </div>

      {/* 2. ROLE-BASED DASHBOARDS & DIRECT FUNCTIONAL ROUTING */}
      <div className="mb-6">
        {/* CITIZEN SERVICES */}
        {userRole === 'citizen' && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
              <span>🏠</span>
              <span>Citizen Portals & Applications</span>
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/search"
                className="bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition"
              >
                Browse Verified Properties
              </Link>
            </div>
          </div>
        )}

        {/* AGENT PORTAL */}
        {userRole === 'agent' && (
          <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-blue-950 text-sm flex items-center gap-2">
              <span>🏢</span>
              <span>Agent Management Console</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                to="/create-listing"
                className="bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition"
              >
                + Create New Listing
              </Link>
              <Link
                to="/agent/my-listings"
                className="bg-blue-700 hover:bg-blue-800 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition"
              >
                Manage Active Escrows & Portfolio
              </Link>
            </div>
          </div>
        )}

        {/* GOV AUDITOR / ADMIN CONSOLE */}
        {userRole === 'admin' && (
          <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-purple-950 text-sm flex items-center gap-2">
              <span>⚖️</span>
              <span>Government Audit & Regulatory Panel</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                to="/admin/manage-users"
                className="bg-purple-800 hover:bg-purple-900 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition"
              >
                Citizen & Agent Clearances
              </Link>
              <Link
                to="/admin/audit-escrows"
                className="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition"
              >
                Audit Land Registry & Escrows
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. GLOBAL SIGN-OUT ACTION */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOutLoading}
          className="w-full bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>{signOutLoading ? 'Signing out...' : 'Sign Out of Account'}</span>
        </button>
      </div>

      {error && <p className="text-red-600 text-xs font-semibold mt-3 text-center">{error}</p>}
      {updateSuccess && (
        <p className="text-emerald-600 text-xs font-semibold mt-3 text-center">
          Profile updated successfully!
        </p>
      )}
    </div>
  );
}