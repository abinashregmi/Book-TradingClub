import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FaShieldAlt,
  FaUserCheck,
  FaBuilding,
  FaUserCog,
  FaTrashAlt,
  FaSearch,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function ManageUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Normalize roles safely for UI presentation
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

  // Fetch all users on mount
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (data.success === false) {
        setError(data.message || 'Failed to fetch registered user accounts.');
        setLoading(false);
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Network error fetching user accounts.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle role modification
  const handleRoleChange = async (userId, targetRole) => {
    try {
      setActionLoadingId(userId);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      setActionLoadingId(null);

      if (data.success === false) {
        setError(data.message || 'Failed to update clearance role.');
        return;
      }

      setSuccessMessage(`User clearance successfully updated to "${targetRole}"`);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: targetRole } : user
        )
      );

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to execute role clearance request.');
      setActionLoadingId(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently revoke and delete account for "${username}"?`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(userId);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/user/delete/${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      setActionLoadingId(null);

      if (data.success === false) {
        setError(data.message || 'Failed to delete user.');
        return;
      }

      setSuccessMessage(`User "${username}" was successfully deleted from registry.`);
      setUsers((prev) => prev.filter((user) => user._id !== userId));

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      setActionLoadingId(null);
    }
  };

  // Filter users by search input and role dropdown
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user._id?.toLowerCase().includes(searchTerm.toLowerCase());

    const userRole = getNormalizedRole(user.role);
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
              <FaShieldAlt />
              <span>Government Audit & Clearance Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Citizen & Agent Clearances
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Audit identities, assign statutory privileges, and manage civic platform permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>

        {/* Notifications & Status Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2 animate-fadeIn">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by username, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <FaSearch className="absolute left-3 top-3.5 text-slate-500 text-xs" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Filter Role:
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="citizen">Citizens</option>
              <option value="agent">Agents</option>
              <option value="admin">Gov Auditors (Admin)</option>
            </select>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent" />
              <p className="text-xs sm:text-sm text-slate-400 font-semibold">
                Loading clearance registry...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FaUserCog className="mx-auto text-3xl text-slate-600 mb-2" />
              <p className="text-base font-bold text-slate-300">No users match your criteria.</p>
              <p className="text-xs text-slate-500">
                Try adjusting your search query or role filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">User / Identity</th>
                    <th className="py-3.5 px-4">Contact Email</th>
                    <th className="py-3.5 px-4">Clearance Role</th>
                    <th className="py-3.5 px-4 text-center">Modify Clearance</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((user) => {
                    const normalizedRole = getNormalizedRole(user.role);
                    const isSelf = user._id === currentUser?._id;
                    const isActionLoading = actionLoadingId === user._id;

                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-slate-800/50 transition duration-150"
                      >
                        {/* User Column */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                user.avatar ||
                                'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                              }
                              alt={user.username}
                              className="h-9 w-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                                <span>{user.username}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono truncate">
                                ID: {user._id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email Column */}
                        <td className="py-4 px-4 text-slate-300 font-medium truncate max-w-[200px]">
                          {user.email}
                        </td>

                        {/* Role Badge Column */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {normalizedRole === 'admin' && (
                            <span className="inline-flex items-center gap-1 bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaShieldAlt className="text-[10px] text-purple-400" />
                              <span>Gov Auditor</span>
                            </span>
                          )}
                          {normalizedRole === 'agent' && (
                            <span className="inline-flex items-center gap-1 bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaBuilding className="text-[10px] text-blue-400" />
                              <span>Licensed Agent</span>
                            </span>
                          )}
                          {normalizedRole === 'citizen' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaUserCheck className="text-[10px] text-emerald-400" />
                              <span>Verified Citizen</span>
                            </span>
                          )}
                        </td>

                        {/* Modify Clearance Selector */}
                        <td className="py-4 px-4 text-center">
                          <select
                            disabled={isSelf || isActionLoading}
                            value={normalizedRole}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Gov Auditor</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            disabled={isSelf || isActionLoading}
                            onClick={() => handleDeleteUser(user._id, user.username)}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/60 border border-transparent hover:border-red-800 px-2.5 py-1.5 rounded-lg transition disabled:opacity-30 cursor-pointer"
                            title={isSelf ? 'Cannot delete self account' : 'Revoke Account'}
                          >
                            <FaTrashAlt className="text-[11px]" />
                            <span className="hidden sm:inline">Revoke</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}