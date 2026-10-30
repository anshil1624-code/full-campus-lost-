import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateDescriptionWithAI } from '../services/gemini';
import Toast from '../components/Toast';
import { 
  Package, Upload, Sparkles, MapPin, Calendar, Phone, 
  User, Mail, ArrowLeft, CheckCircle2, ShieldCheck, Copy
} from 'lucide-react';

const CATEGORIES = [
  'Bags & Wallets',
  'Electronics',
  'ID Cards',
  'Keys',
  'Books',
  'Clothing',
  'Accessories',
  'Other'
];

const PostLostItemPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Bags & Wallets',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 5MB.', type: 'error' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.title) {
      setToast({ message: 'Please enter an Item Name first to use AI description.', type: 'error' });
      return;
    }
    setAiGenerating(true);
    try {
      const generatedText = await generateDescriptionWithAI(
        formData.title,
        formData.category,
        formData.description || formData.location
      );
      setFormData(prev => ({ ...prev, description: generatedText }));
      setToast({ message: 'AI generated a helpful description for your lost item!', type: 'success' });
    } catch (err) {
      // Graceful fallback description template
      const fallbackDesc = `Lost a ${formData.title} (${formData.category}) last seen around ${formData.location || 'campus'}. Please contact me if found.`;
      setFormData(prev => ({ ...prev, description: fallbackDesc }));
      setToast({ message: 'Added standard description template.', type: 'info' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setToast({ message: 'Please provide an item name.', type: 'error' });
      return;
    }
    if (!formData.description.trim()) {
      setToast({ message: 'Please provide an item description.', type: 'error' });
      return;
    }
    if (!formData.location.trim()) {
      setToast({ message: 'Please provide the last-seen location.', type: 'error' });
      return;
    }
    if (!formData.contactName.trim()) {
      setToast({ message: 'Please enter your contact name.', type: 'error' });
      return;
    }
    if (!formData.contactEmail.trim() && !formData.contactPhone.trim()) {
      setToast({ message: 'Please enter either a contact email or phone number.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      data.append('description', formData.description.trim());
      data.append('type', 'Lost');
      data.append('location', formData.location.trim());
      data.append('date', formData.date);
      data.append('contactName', formData.contactName.trim());
      data.append('contactEmail', formData.contactEmail.trim());
      data.append('contactPhone', formData.contactPhone.trim());
      data.append(
        'contact',
        [formData.contactName.trim(), formData.contactEmail.trim(), formData.contactPhone.trim()]
          .filter(Boolean)
          .join(' | ')
      );

      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await api.post('/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittedReport(res.data);
      setToast({ message: 'Lost item report submitted and saved to SQLite!', type: 'success' });
    } catch (err) {
      console.error('Error submitting lost item post:', err);
      setToast({ message: err.response?.data?.message || 'Failed to submit report.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>

      {/* Success Modal / Banner */}
      {submittedReport && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-xl animate-fade-in">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Lost Item Reported Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your report has been permanently saved to the campus database. Keep this unique Report ID for tracking and claims:
          </p>
          <div className="inline-block bg-white px-6 py-3 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-400 block">Unique Report ID</span>
            <span className="text-2xl font-mono font-extrabold text-emerald-700 tracking-wider">
              {submittedReport.reportId}
            </span>
          </div>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              to={`/items/${submittedReport.item?.id || submittedReport.reportId}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              View Report Details
            </Link>
            <Link
              to="/browse?type=Lost"
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all"
            >
              Browse Lost Items
            </Link>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setFormData({
                  title: '',
                  category: 'Bags & Wallets',
                  description: '',
                  location: '',
                  date: new Date().toISOString().split('T')[0],
                  contactName: user?.name || '',
                  contactEmail: user?.email || '',
                  contactPhone: ''
                });
                setImageFile(null);
                setImagePreview(null);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Submit Another
            </button>
          </div>
        </div>
      )}

      {/* Main Reporting Form */}
      {!submittedReport && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5" />
              Report Lost Belonging
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Submit a Lost Item Report
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Provide specific identifying details to help fellow campus members recognize and return your item.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Item Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Lost black wallet, MacBook Air, Student ID card"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description + AI Assistant */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Item Description <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAIDescription}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {aiGenerating ? 'Generating...' : 'AI Description Helper'}
                </button>
              </div>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mention distinctive marks, color, brand, stickers, scratches, or contents..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all leading-relaxed"
                required
              />
            </div>

            {/* Location & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Last-Seen Location <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Central Library 2nd Floor, Room 102"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Date Lost <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Details (Requirement 4.B) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Contact Information (For Claims & Recovery)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="student@campus.edu"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Phone / Other Method
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Optional Image / Photo
              </label>
              
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-3 bg-slate-50 border border-dashed border-slate-300 hover:border-rose-500 hover:bg-rose-50/50 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-700 transition-colors">
                  <Upload className="w-4 h-4 text-slate-500" />
                  Choose File (PNG, JPG, WebP &lt; 5MB)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/browse"
                className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Submitting Report...' : 'Publish Lost Item Report'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};

export default PostLostItemPage;
