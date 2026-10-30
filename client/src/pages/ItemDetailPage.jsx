import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { 
  MapPin, Calendar, Phone, User, Tag, Edit3, Trash2, ArrowLeft, 
  ShieldCheck, Mail, Package, CheckCircle2, Clock, AlertTriangle, 
  Send, Eye, EyeOff, Lock
} from 'lucide-react';

const STATUS_OPTIONS = ['Lost', 'Found', 'Claim Pending', 'Returned / Recovered'];

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimantName, setClaimantName] = useState(user?.name || '');
  const [claimantContact, setClaimantContact] = useState(user?.email || '');
  const [claimNotes, setClaimNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchItemDetail = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      setItem(response.data.item);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setToast({ message: 'Item post not found or removed from database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  // Handle status update (Requirement 4.E)
  const handleStatusChange = async (newStatus) => {
    if (newStatus === item.status) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/items/${item.id}/status`, { status: newStatus });
      setItem(res.data.item);
      setToast({ message: `Status updated to "${newStatus}"!`, type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || `Cannot transition status from ${item.status} to ${newStatus}.`,
        type: 'error'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle claim submission (Requirement 4.F)
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimantName.trim() || !claimantContact.trim()) {
      setToast({ message: 'Please provide both your name and contact info.', type: 'error' });
      return;
    }

    setSubmittingClaim(true);
    try {
      const res = await api.post(`/items/${item.id}/claim`, {
        claimantName: claimantName.trim(),
        claimantContact: claimantContact.trim(),
        claimNotes: claimNotes.trim()
      });
      setItem(res.data.item);
      setIsClaimModalOpen(false);
      setToast({ message: 'Claim submitted! Item status updated to Claim Pending.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit claim.', type: 'error' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report from the database?')) return;

    try {
      await api.delete(`/items/${item.id}`);
      setToast({ message: 'Item report deleted from SQLite database.', type: 'success' });
      setTimeout(() => {
        navigate('/browse');
      }, 900);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete report.', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving record from database..." />;
  if (!item) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-slate-500 text-sm">The report identifier does not match any record in the database.</p>
        <Link to="/browse" className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl text-sm">
          Return to Browse
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === item.userId || user.role === 'admin');
  const isLost = item.type === 'Lost';
  const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`) : null;

  // Mask contact information for privacy protection
  const maskContact = (text) => {
    if (!text) return 'Not provided';
    if (text.includes('@')) {
      const [name, domain] = text.split('@');
      return `${name.slice(0, 2)}***@${domain}`;
    }
    return text.replace(/\d(?=\d{4})/g, '*');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </button>

        {item.reportId && (
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            Report ID: <span className="text-blue-700">{item.reportId}</span>
          </span>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Column: Image & Badges */}
        <div className="relative bg-slate-900 min-h-[320px] md:min-h-[460px] flex items-center justify-center p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-contain max-h-[440px] rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Package className="w-16 h-16 stroke-[1.5]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">No Image Uploaded</span>
            </div>
          )}

          {/* Status & Type Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
            <span className={`px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-lg ${
              isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {item.type} Item
            </span>

            {item.status && item.status !== item.type && (
              <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-lg ${
                item.status === 'Returned / Recovered'
                  ? 'bg-indigo-600 text-white'
                  : item.status === 'Claim Pending'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-700 text-white'
              }`}>
                {item.status === 'Returned / Recovered' ? '✓ Recovered' : `⏳ ${item.status}`}
              </span>
            )}
          </div>

          {/* Category Tag */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 text-xs font-semibold bg-white/95 text-slate-900 rounded-xl backdrop-blur-md flex items-center gap-1 shadow">
              <Tag className="w-3.5 h-3.5" />
              {item.category}
            </span>
          </div>
        </div>

        {/* Right Column: Metadata, Description & Controls */}
        <div className="p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Database Record #{item.id} • Reported on {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 leading-tight">
                {item.title}
              </h1>
            </div>

            {/* Core Item Metadata Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-bold text-slate-900">{item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="font-semibold text-slate-500">{isLost ? 'Date Lost:' : 'Date Found:'}</span>
                <span className="font-bold text-slate-900">{item.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="font-semibold text-slate-500">Reporter:</span>
                <span className="font-bold text-slate-900">{item.contactName || item.posterName || 'Campus Student'}</span>
              </div>
            </div>

            {/* Item Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h4>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                {item.description}
              </p>
            </div>

            {/* Claim Notice if Claim is Pending */}
            {item.status === 'Claim Pending' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Claim in Progress
                </div>
                <p>
                  Claimant: <strong className="font-semibold">{item.claimantName || 'Student'}</strong> ({item.claimantContact || 'Contact on file'})
                </p>
                {item.claimNotes && (
                  <p className="text-slate-600 italic">Notes: "{item.claimNotes}"</p>
                )}
              </div>
            )}

            {/* Resolved Notice if Returned */}
            {item.status === 'Returned / Recovered' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-1 text-indigo-900">
                <div className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Belonging Successfully Recovered
                </div>
                <p className="text-slate-600">This item was verified and returned to its rightful owner.</p>
              </div>
            )}

          </div>

          {/* Interactive Actions Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            
            {/* Status Transition Control (Requirement 4.E) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Update Item Status
                </span>
                <span className="text-[10px] text-slate-400">Current: {item.status || item.type}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={updatingStatus || item.status === st}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                      item.status === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'Returned / Recovered' ? 'Recovered' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Claim Item Button (Requirement 4.F) */}
            {item.status !== 'Returned / Recovered' && (
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLost ? 'I Found This Item (Submit Return Claim)' : 'This Is Mine (Claim Item)'}
              </button>
            )}

            {/* Privacy-Protected Contact Display */}
            {showContact ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-fade-in">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full">
                  <Phone className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Reporter Contact Information</h4>
                <p className="text-base font-extrabold text-emerald-800 select-all">
                  {item.contact || `${item.contactName || ''} | ${item.contactEmail || ''} | ${item.contactPhone || ''}`}
                </p>
                <div className="flex justify-center gap-3 pt-1">
                  {item.contactEmail && (
                    <a
                      href={`mailto:${item.contactEmail}?subject=Regarding ${item.reportId}: ${item.title}`}
                      className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                    >
                      Send Email
                    </a>
                  )}
                  {item.contactPhone && (
                    <a
                      href={`tel:${item.contactPhone}`}
                      className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                    >
                      Call Phone
                    </a>
                  )}
                  <button
                    onClick={() => setShowContact(false)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Hide
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Info: <span className="font-mono text-slate-800">{maskContact(item.contact || item.contactEmail || item.contactPhone)}</span></span>
                </div>
                <button
                  onClick={() => setShowContact(true)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Reveal Contact
                </button>
              </div>
            )}

            {/* Owner Delete Control */}
            {isOwner && (
              <div className="pt-1">
                <button
                  onClick={handleDelete}
                  className="w-full py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Report from SQLite
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Claim Submission Modal (Requirement 4.F) */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Submit Claim for Item #{item.reportId}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Express interest or provide ownership verification
                </p>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Your Contact Information (Email / Phone) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={claimantContact}
                  onChange={(e) => setClaimantContact(e.target.value)}
                  placeholder="e.g. alex@student.edu | +1 (555) 123-4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Proof of Ownership / Additional Details
                </label>
                <textarea
                  rows="3"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Mention unique marks, exact wallpaper, stickers, or where you'd like to meet for handover..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ItemDetailPage;
