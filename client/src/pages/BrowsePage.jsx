import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import ItemFilter from '../components/ItemFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [type, setType] = useState(searchParams.get('type') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params on initial load or navigation
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlType = searchParams.get('type') || 'All';
    const urlStatus = searchParams.get('status') || 'All';
    const urlLocation = searchParams.get('location') || '';

    setSearch(urlSearch);
    setCategory(urlCategory);
    setType(urlType);
    setStatus(urlStatus);
    setLocation(urlLocation);
  }, [searchParams]);

  // Fetch filtered items from backend API
  useEffect(() => {
    const fetchFilteredItems = async () => {
      setLoading(true);
      try {
        const response = await api.get('/items', {
          params: {
            search: search.trim() || undefined,
            category: category !== 'All' ? category : undefined,
            type: type !== 'All' ? type : undefined,
            status: status !== 'All' ? status : undefined,
            location: location.trim() || undefined
          }
        });
        setItems(response.data.items || []);
      } catch (err) {
        console.error('Error fetching items on browse page:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchFilteredItems();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, category, type, status, location]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setType('All');
    setStatus('All');
    setLocation('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse Campus Belongings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Search and filter lost, found, and recovered item reports submitted across campus.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <ItemFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        type={type}
        setType={setType}
        status={status}
        setStatus={setStatus}
        location={location}
        setLocation={setLocation}
        totalResults={items.length}
        onReset={handleResetFilters}
      />

      {/* Items Grid */}
      {loading ? (
        <LoadingSpinner message="Searching persistent campus database..." />
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Matching Items Found"
          description="Try adjusting your keywords, campus location, or category filters to find the item."
        />
      )}
    </div>
  );
};

export default BrowsePage;
