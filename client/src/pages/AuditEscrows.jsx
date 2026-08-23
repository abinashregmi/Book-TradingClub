import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FaShieldAlt,
  FaFileContract,
  FaCheckCircle,
  FaTimesCircle,
  FaCalculator,
  FaSearch,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaCoins,
} from 'react-icons/fa';

export default function AuditEscrows() {
  const { currentUser } = useSelector((state) => state.user);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all escrow records and registry items
  const fetchEscrows = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/escrows', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (data.success === false) {
        setError(data.message || 'Failed to retrieve escrow audit records.');
        setLoading(false);
        return;
      }

      setEscrows(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Network error fetching escrow registry.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  // Execute Auditor Governance Action (approve audit release, flag non-compliant, verify document)
  const handleAuditAction = async (escrowId, actionType, listingId) => {
    try {
      setActionLoadingId(escrowId);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/admin/escrows/${escrowId}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: actionType, // 'verify_lalpurja' | 'release_escrow' | 'flag_compliance'
          listingId,
        }),
      });

      const data = await res.json();
      setActionLoadingId(null);

      if (data.success === false) {
        setError(data.message || `Failed to execute ${actionType} audit operation.`);
        return;
      }

      setSuccessMessage(data.message || `Escrow audit action "${actionType}" committed to statutory ledger.`);
      
      // Update local state smoothly
      setEscrows((prev) =>
        prev.map((item) => {
          if (item._id === escrowId) {
            return {
              ...item,
              status: actionType === 'release_escrow' ? 'completed' : item.status,
              auditStatus: actionType === 'flag_compliance' ? 'flagged' : 'verified',
              isAudited: true,
            };
          }
          return item;
        })
      );

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Error communicating with land revenue ledger.');
      setActionLoadingId(null);
    }
  };

  // Filter listings & transactions
  const filteredEscrows = escrows.filter((item) => {
    const propertyName = item.listingId?.name || item.propertyName || '';
    const regNum = item.listingId?.governmentRegistrationNum || item.governmentRegistrationNum || '';
    const buyerName = item.userId?.username || item.buyerName || '';
    const pidx = item.pidx || '';

    const matchesSearch =
      propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pidx.toLowerCase().includes(searchTerm.toLowerCase());

    const itemStatus = item.status || 'pending';
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
              <FaShieldAlt />
              <span>Statutory Compliance & Land Revenue Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Land Registry & Escrow Audits
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Review token guarantee escrows (Rs. 50,000), verify Lalpurja credentials, and sign off on transfers.
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

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2 animate-fadeIn">
            <FaCheckCircle className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and Summary Bar */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by Lalpurja, PIDX, buyer, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            <FaSearch className="absolute left-3 top-3.5 text-slate-500 text-xs" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Audit Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Transactions ({escrows.length})</option>
              <option value="completed">Completed / Confirmed</option>
              <option value="pending">Pending Audit Verification</option>
              <option value="failed">Failed / Flagged</option>
            </select>
          </div>
        </div>

        {/* Escrow Audit Ledger Table */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent" />
              <p className="text-xs sm:text-sm text-slate-400 font-semibold">
                Loading land revenue audit records...
              </p>
            </div>
          ) : filteredEscrows.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FaFileContract className="mx-auto text-3xl text-slate-600 mb-2" />
              <p className="text-base font-bold text-slate-300">No escrow records found.</p>
              <p className="text-xs text-slate-500">
                When buyers book properties through Civic Escrow, records appear here for regulatory sign-off.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Property / Lalpurja Ref</th>
                    <th className="py-3.5 px-4">Buyer & Transaction ID</th>
                    <th className="py-3.5 px-4">Escrow Value</th>
                    <th className="py-3.5 px-4">Audit Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Regulatory Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEscrows.map((item) => {
                    const listing = item.listingId || {};
                    const buyer = item.userId || {};
                    const isActionLoading = actionLoadingId === item._id;
                    const isVerified = item.auditStatus === 'verified' || listing.isRegistryVerified;
                    const isFlagged = item.auditStatus === 'flagged';

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-800/50 transition duration-150"
                      >
                        {/* Property & Lalpurja Column */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate text-sm">
                              {listing.name || item.propertyName || 'Property Record'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-purple-300 bg-purple-950/90 border border-purple-800/60 px-2 py-0.5 rounded">
                                {listing.governmentRegistrationNum || item.governmentRegistrationNum || 'GOV-RE-2081-XXXX'}
                              </span>
                              {listing._id && (
                                <Link
                                  to={`/listing/${listing._id}`}
                                  target="_blank"
                                  className="text-slate-400 hover:text-emerald-400 text-xs transition"
                                  title="View Public Listing"
                                >
                                  <FaExternalLinkAlt />
                                </Link>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                              {listing.address || 'Address on file'}
                            </p>
                          </div>
                        </td>

                        {/* Buyer & Payment Identifier */}
                        <td className="py-4 px-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate">
                              {buyer.username || item.buyerName || 'Verified Citizen'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {buyer.email || 'citizen@email.com'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              PIDX: {item.pidx || `CIVIC-${item._id?.slice(-6)}`}
                            </p>
                          </div>
                        </td>

                        {/* Escrow Value & Municipal Assessment */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-emerald-400 text-sm">
                              <FaCoins className="text-xs" />
                              <span>Rs. {(item.amount || 50000).toLocaleString('en-US')}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              (Token Guarantee)
                            </p>
                            {listing.municipalTaxAmount > 0 && (
                              <p className="text-[10px] text-purple-300 font-mono">
                                Tax: Rs. {Number(listing.municipalTaxAmount).toLocaleString('en-US')}/yr
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status Badges */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isFlagged ? (
                            <span className="inline-flex items-center gap-1 bg-red-950 border border-red-500/40 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaTimesCircle className="text-[10px] text-red-400" />
                              <span>Flagged Issue</span>
                            </span>
                          ) : isVerified ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaCheckCircle className="text-[10px] text-emerald-400" />
                              <span>Audit Certified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                              <FaShieldAlt className="text-[10px] text-amber-400" />
                              <span>Pending Sign-off</span>
                            </span>
                          )}
                        </td>

                        {/* Regulatory Action Buttons */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Verify Lalpurja / Certify Audit */}
                            <button
                              type="button"
                              disabled={isActionLoading || isVerified}
                              onClick={() => handleAuditAction(item._id, 'verify_lalpurja', listing._id)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Verify Malpot Registry & Issue Clearance"
                            >
                              <FaCheckCircle />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>

                            {/* Flag Non-Compliance */}
                            <button
                              type="button"
                              disabled={isActionLoading || isFlagged}
                              onClick={() => handleAuditAction(item._id, 'flag_compliance', listing._id)}
                              className="px-2.5 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-700/60 disabled:opacity-40 text-red-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="Flag for Discrepancy"
                            >
                              <FaTimesCircle />
                              <span className="hidden md:inline">Flag</span>
                            </button>
                          </div>
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