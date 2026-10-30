import React from 'react';
import { Search, Filter, Layers, MapPin, CheckCircle2, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Bags & Wallets',
  'Electronics',
  'ID Cards',
  'Keys',
  'Books',
  'Clothing',
  'Accessories',
  'Other'
];

const STATUSES = [
  'All',
  'Lost',
  'Found',
  'Claim Pending',
  'Returned / Recovered'
];

const ItemFilter = ({ 
  search, 
  setSearch, 
  category, 
  setCategory, 
  type, 
  setType, 
  status,
  setStatus,
  location,
  setLocation,
  totalResults = 0,
  onReset
}) => {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
      
      {/* Primary Search and Location Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Search Input */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or Report ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Location Filter Input */}
        <div className="relative md:col-span-3">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter location (e.g. Library)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Selector */}
        <div className="relative md:col-span-2">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-9 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none truncate"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Status Selector */}
        <div className="relative md:col-span-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none truncate"
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? 'All Statuses' : st}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

      </div>

      {/* Type Toggle Tabs & Reset / Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
        
        {/* Type Filter Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {['All', 'Lost', 'Found'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                type === t
                  ? t === 'Lost'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : t === 'Found'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'All' ? 'All Types' : `${t} Items`}
            </button>
          ))}
        </div>

        {/* Results Counter and Reset */}
        <div className="flex items-center gap-3">
          {(search || category !== 'All' || type !== 'All' || status !== 'All' || location) && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Found <span className="text-slate-900 font-bold">{totalResults}</span> item(s)
          </div>
        </div>

      </div>

    </div>
  );
};

export default ItemFilter;
