import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { 
  Search, Sparkles, ShieldCheck, Zap, PlusCircle, ArrowRight, 
  Package, PackageCheck, CheckCircle2, Clock, Layers, HelpCircle
} from 'lucide-react';

const HomePage = ({ onOpenAIModal }) => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalLost: 0,
    totalFound: 0,
    totalClaimPending: 0,
    totalRecovered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [itemsRes, statsRes] = await Promise.allSettled([
          api.get('/items'),
          api.get('/items/stats')
        ]);

        if (itemsRes.status === 'fulfilled') {
          setRecentItems(itemsRes.value.data.items.slice(0, 6));
        }

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else if (itemsRes.status === 'fulfilled') {
          // Fallback stats derivation if stats endpoint failed
          const items = itemsRes.value.data.items || [];
          setStats({
            totalItems: items.length,
            totalLost: items.filter(i => i.status === 'Lost' || i.type === 'Lost').length,
            totalFound: items.filter(i => i.status === 'Found' || i.type === 'Found').length,
            totalClaimPending: items.filter(i => i.status === 'Claim Pending').length,
            totalRecovered: items.filter(i => i.status === 'Returned / Recovered').length
          });
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/browse?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-2xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            University Campus Lost & Found Service
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Lost Something on Campus? <br />
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              We Help You Find & Recover It.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report lost items, list found belongings, and claim your property with persistent campus tracking and zero-configuration local database storage.
          </p>

          {/* Hero Search Form */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl">
              <Search className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search lost wallet, student ID, water bottle, keys..."
                className="w-full px-3 py-2 text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-blue-600/30"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/post-lost"
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>
            <Link
              to="/post-found"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found Item
            </Link>
            <Link
              to="/browse"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Browse All Items
            </Link>
          </div>

        </div>
      </section>

      {/* Mandatory Metric Dashboard Statistics Cards (Requirement 4.A) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Total Reported Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Reported</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalItems}</span>
              <span className="text-[11px] text-slate-500 block">Total campus listings</span>
            </div>
          </div>

          {/* Lost Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Lost Items</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">{stats.totalLost}</span>
              <span className="text-[11px] text-slate-500 block">Awaiting finders</span>
            </div>
          </div>

          {/* Found Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Found Items</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.totalFound}</span>
              <span className="text-[11px] text-slate-500 block">Safely held on campus</span>
            </div>
          </div>

          {/* Successfully Recovered Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recovered</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.totalRecovered}</span>
              <span className="text-[11px] text-slate-500 block">Successfully returned</span>
            </div>
          </div>

        </div>
      </section>

      {/* Recent Lost & Found Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Recently Reported Campus Items</h2>
            <p className="text-slate-500 text-sm">Real-time reports saved in persistent storage</p>
          </div>
          <Link
            to="/browse"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            Browse All ({stats.totalItems})
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching latest campus reports..." />
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Recent Posts" description="Be the first student to report a lost or found item on campus!" />
        )}
      </section>

    </div>
  );
};

export default HomePage;
