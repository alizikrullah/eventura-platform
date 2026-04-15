import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Calendar, MapPin, Users,
  Star, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '@/hooks/useDebounce';

interface Event {
  id: number;
  name: string;
  location: string;
  start_date: string;
  price: number;
  available_seats: number;
  image_url?: string;
  category?: { name: string };
  organizer?: { name: string };
  average_rating?: number;
  min_price?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatPrice(price: number | undefined) {
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(numPrice);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(d);
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Terbaru' },
  { value: 'oldest',     label: 'Terlama' },
  { value: 'price_low',  label: 'Harga Terendah' },
  { value: 'price_high', label: 'Harga Tertinggi' },
  { value: 'popular',    label: 'Terpopuler' },
];

// ── FILTER PANEL - defined OUTSIDE component to prevent remount on re-render ──
interface FilterPanelProps {
  categories: Category[];
  categoryId: string;
  setCategoryId: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  hasActiveFilter: boolean;
  resetFilters: () => void;
  setPage: (v: number) => void;
}

function FilterPanel({
  categories, categoryId, setCategoryId,
  location, setLocation, startDate, setStartDate,
  endDate, setEndDate, hasActiveFilter, resetFilters, setPage
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Kategori */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800">Kategori</h3>
        <div className="space-y-1">
          <button
            onClick={() => { setCategoryId(''); setPage(1); }}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              !categoryId ? 'bg-primary-900 text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategoryId(String(cat.id)); setPage(1); }}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                categoryId === String(cat.id)
                  ? 'bg-primary-900 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800">Lokasi</h3>
        <input
          type="text"
          value={location}
          onChange={e => { setLocation(e.target.value); setPage(1); }}
          placeholder="Kota atau tempat..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
        />
      </div>

      {/* Tanggal */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800">Tanggal Event</h3>
        <div className="space-y-2">
          <div>
            <label className="block mb-1 text-xs text-gray-400">Dari tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs text-gray-400">Sampai tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {hasActiveFilter && (
        <button
          onClick={resetFilters}
          className="flex items-center justify-center w-full gap-2 py-2 text-sm text-red-500 transition-colors border border-red-200 rounded-lg hover:bg-red-50"
        >
          <X className="w-4 h-4" /> Reset Filter
        </button>
      )}
    </div>
  );
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]         = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [location, setLocation]     = useState(searchParams.get('location') || '');
  const [startDate, setStartDate]   = useState(searchParams.get('date_from') || '');
  const [endDate, setEndDate]       = useState(searchParams.get('date_to') || '');
  const [sort, setSort]             = useState(searchParams.get('sort') || 'newest');
  const [page, setPage]             = useState(Number(searchParams.get('page')) || 1);
  const [mobileFilter, setMobileFilter] = useState(false);

  const [events, setEvents]         = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);

  const debouncedSearch   = useDebounce(search, 500);
  const debouncedLocation = useDebounce(location, 500);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/categories`)
      .then(res => setCategories(Array.isArray(res.data.data) ? res.data.data : res.data.data?.categories || []))
      .catch(() => {});
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Use correct param names matching backend eventService
      const params: Record<string, string> = { sort, page: String(page), limit: '9' };
      if (debouncedSearch)   params.search    = debouncedSearch;
      if (categoryId)        params.category  = categoryId;   // backend uses 'category' not 'category_id'
      if (debouncedLocation) params.location  = debouncedLocation;
      if (startDate)         params.date_from = startDate;    // backend uses 'date_from' not 'start_date'
      if (endDate)           params.date_to   = endDate + 'T23:59:59';      // backend uses 'date_to' not 'end_date'

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/events`, { params });
      setEvents(res.data.data?.events || res.data.data || []);
      setPagination(res.data.data?.pagination || null);
      setSearchParams(params, { replace: true });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, debouncedLocation, startDate, endDate, sort, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const resetFilters = () => {
    setSearch(''); setCategoryId(''); setLocation('');
    setStartDate(''); setEndDate('');
    setSort('newest'); setPage(1);
  };

  const hasActiveFilter = !!(search || categoryId || location || startDate || endDate);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div className="py-8 bg-white border-b border-gray-100">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Browse Events</h1>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari event, konser, workshop..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute -translate-y-1/2 right-3 top-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-900 bg-white text-gray-700 hidden sm:block"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setMobileFilter(true)}
              className="lg:hidden flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-700"
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-secondary-400" />}
            </button>
          </div>

          {/* Active filter chips */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">Filter aktif:</span>
              {search && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-900 text-xs font-medium px-2.5 py-1 rounded-full">
                  "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {categoryId && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-900 text-xs font-medium px-2.5 py-1 rounded-full">
                  {categories.find(c => String(c.id) === categoryId)?.name}
                  <button onClick={() => setCategoryId('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-900 text-xs font-medium px-2.5 py-1 rounded-full">
                  📍 {location} <button onClick={() => setLocation('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-900 text-xs font-medium px-2.5 py-1 rounded-full">
                  📅 {startDate} {endDate ? `- ${endDate}` : ''}
                  <button onClick={() => { setStartDate(''); setEndDate(''); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600">Hapus semua</button>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex gap-8">

          {/* SIDEBAR desktop */}
          <aside className="hidden w-56 lg:block shrink-0">
            <div className="sticky p-5 bg-white border border-gray-100 rounded-2xl top-24">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-800">Filter</span>
              </div>
              <FilterPanel
                categories={categories}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                location={location}
                setLocation={setLocation}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                hasActiveFilter={hasActiveFilter}
                resetFilters={resetFilters}
                setPage={setPage}
              />
            </div>
          </aside>

          {/* EVENTS GRID */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? 'Memuat...' : pagination
                  ? `${pagination.total} event ditemukan`
                  : `${events.length} event ditemukan`}
              </p>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                className="sm:hidden text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white text-gray-700"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="overflow-hidden bg-white border border-gray-100 rounded-2xl">
                    <div className="bg-gray-100 h-44 animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
                      <div className="w-1/2 h-3 bg-gray-100 rounded animate-pulse" />
                      <div className="w-2/3 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-full">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-700">Event tidak ditemukan</h3>
                <p className="max-w-xs mb-6 text-sm text-gray-400">Coba ubah filter atau kata kunci pencarian kamu</p>
                <button onClick={resetFilters}
                  className="px-5 py-2 text-sm font-semibold transition-colors border text-primary-900 border-primary-900 rounded-xl hover:bg-primary-50">
                  Reset Filter
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map(event => (
                    <Link key={event.id} to={`/events/${event.id}`}
                      className="overflow-hidden transition-all duration-300 bg-white border border-gray-100 group rounded-2xl hover:shadow-xl hover:-translate-y-1">
                      <div className="relative overflow-hidden h-44 bg-gradient-to-br from-primary-100 to-primary-200">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.name}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <Calendar className="w-10 h-10 text-primary-300" />
                          </div>
                        )}
                        {event.category && (
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary-900 text-xs font-semibold px-2.5 py-1 rounded-lg">
                            {event.category.name}
                          </span>
                        )}
                        {(event.min_price === 0 || event.price === 0) && (
                          <span className="absolute top-3 right-3 bg-success-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                            Gratis
                          </span>
                        )}
                        {event.available_seats === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg">Sold Out</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="mb-3 text-sm font-bold leading-snug text-gray-900 transition-colors line-clamp-2 group-hover:text-primary-900">
                          {event.name}
                        </h3>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatDate(event.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>{event.available_seats} kursi tersisa</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <span className="text-base font-extrabold text-primary-900">
                            {formatPrice(event.min_price ?? event.price)}
                          </span>
                          {event.average_rating && event.average_rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-semibold text-gray-600">{event.average_rating.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                      className="flex items-center justify-center transition-colors border border-gray-200 rounded-lg w-9 h-9 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`e-${i}`} className="px-1 text-gray-400">...</span>
                        ) : (
                          <button key={p} onClick={() => handlePageChange(p as number)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                              page === p ? 'bg-primary-900 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}>
                            {p}
                          </button>
                        )
                      )}
                    <button onClick={() => handlePageChange(page + 1)} disabled={page === pagination.totalPages}
                      className="flex items-center justify-center transition-colors border border-gray-200 rounded-lg w-9 h-9 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilter && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileFilter(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Filter Event</h3>
              <button onClick={() => setMobileFilter(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <FilterPanel
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              location={location}
              setLocation={setLocation}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              hasActiveFilter={hasActiveFilter}
              resetFilters={resetFilters}
              setPage={setPage}
            />
            <button onClick={() => setMobileFilter(false)}
              className="w-full py-3 mt-6 font-semibold text-white transition-colors bg-primary-900 rounded-xl hover:bg-primary-800">
              Tampilkan Hasil
            </button>
          </div>
        </>
      )}
    </div>
  );
}
