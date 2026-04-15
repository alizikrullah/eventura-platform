import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Calendar, MapPin, Users, Star, Zap, Music, Trophy, Cpu, UtensilsCrossed, Palette, GraduationCap, Heart, Camera } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from '@/hooks/useDebounce';

interface Event {
  id: number;
  name: string;
  location: string;
  start_date: string;
  min_price?: number;
  available_seats: number;
  image_url?: string;
  category?: { name: string };
  organizer?: { name: string };
  average_rating?: number;
}

interface Category {
  id: number;
  name: string;
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Music:       { icon: Music,           color: 'text-purple-600', bg: 'bg-purple-50' },
  Sports:      { icon: Trophy,          color: 'text-green-600',  bg: 'bg-green-50' },
  Technology:  { icon: Cpu,             color: 'text-blue-600',   bg: 'bg-blue-50' },
  Food:        { icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50' },
  Art:         { icon: Palette,         color: 'text-pink-600',   bg: 'bg-pink-50' },
  Education:   { icon: GraduationCap,   color: 'text-yellow-600', bg: 'bg-yellow-50' },
  Health:      { icon: Heart,           color: 'text-red-600',    bg: 'bg-red-50' },
  Photography: { icon: Camera,          color: 'text-cyan-600',   bg: 'bg-cyan-50' },
};

function formatPrice(price?: number | null) {
  const numPrice = Number(price) || 0;
  if (numPrice === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(numPrice);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export default function LandingPage() {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [hasSearchInteraction, setHasSearchInteraction] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 400);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, categoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/events?limit=6&sort=newest`),
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
        ]);
        setEvents(eventsRes.data.data?.events || eventsRes.data.data || []);
        setCategories(categoriesRes.data.data?.categories || []);
      } catch (err) {
        console.error('Failed to fetch landing data', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!hasSearchInteraction || !debouncedSearch) return;

    navigate(`/events?search=${encodeURIComponent(debouncedSearch)}`);
  }, [debouncedSearch, hasSearchInteraction, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSearch = search.trim();
    navigate(trimmedSearch ? `/events?search=${encodeURIComponent(trimmedSearch)}` : '/events');
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-0 w-72 h-72 bg-secondary-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-900 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-secondary-400" />
            Platform Event Terpercaya di Indonesia
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Temukan Event{' '}
            <span className="relative inline-block">
              <span className="text-primary-900">Terbaik</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q100 0 200 6" stroke="#FF6B4A" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{' '}
            di Kotamu
          </h1>

          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Browse ribuan event seru — dari konser musik, tech conference, sampai workshop kreatif. Beli tiket dengan mudah dan aman.
          </p>

          {/* search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden pr-2">
              <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setHasSearchInteraction(true);
                }}
                placeholder="Cari event, konser, workshop..."
                className="flex-1 px-3 py-4 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                className="bg-primary-900 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                Cari
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-gray-400">Pencarian akan berjalan otomatis setelah kamu berhenti mengetik.</p>

          {/* stats */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {[
              { value: '500+', label: 'Event Aktif' },
              { value: '10K+', label: 'Tiket Terjual' },
              { value: '200+', label: 'Organizer' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-primary-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Kategori</h2>
              <p className="text-sm text-gray-400 mt-1">Temukan event sesuai minat kamu</p>
            </div>
            <Link to="/events" className="text-sm font-semibold text-primary-900 hover:text-primary-800 flex items-center gap-1">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {categories.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              : categories.map(cat => {
                  const meta = CATEGORY_ICONS[cat.name] ?? { icon: Calendar, color: 'text-gray-500', bg: 'bg-gray-50' };
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={cat.id}
                      to={`/events?category=${cat.id}`}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${meta.bg} hover:shadow-md transition-all group`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Event Terbaru</h2>
              <p className="text-sm text-gray-400 mt-1">Jangan sampai kehabisan tiket</p>
            </div>
            <Link to="/events" className="text-sm font-semibold text-primary-900 hover:text-primary-800 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada event tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-primary-300" />
                      </div>
                    )}
                    {/* category badge */}
                    {event.category && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary-900 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {event.category.name}
                      </span>
                    )}
                    {/* free badge */}
                    {(!event.min_price || event.min_price === 0) && (
                      <span className="absolute top-3 right-3 bg-success-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                        Gratis
                      </span>
                    )}
                  </div>

                  {/* content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary-900 transition-colors mb-3">
                      {event.name}
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>{event.available_seats} kursi tersisa</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="text-lg font-extrabold text-primary-900">
                        {formatPrice(event.min_price)}
                      </span>
                      {event.average_rating && event.average_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold text-gray-600">
                            {event.average_rating.toFixed(1)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Lihat Semua Event
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-900 rounded-3xl px-8 py-12 md:py-16 text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-800 rounded-full opacity-50" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-secondary-400 rounded-full opacity-20" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Punya event yang mau lo jual tiketnya?
              </h2>
              <p className="text-primary-200 text-sm md:text-base mb-8 max-w-lg mx-auto">
                Daftar sebagai organizer dan mulai jual tiket event kamu sekarang. Gratis, mudah, dan langsung bisa diakses ribuan pembeli.
              </p>
              <a
                href="mailto:support@eventura.com?subject=Pendaftaran%20Organizer&body=Halo%20Eventura%2C%0A%0ASaya%20ingin%20mendaftar%20sebagai%20organizer.%0A%0ANama%3A%20%0AEmail%3A%20%0ANo%20HP%3A%20%0ANama%20Event%2FOrganisasi%3A%20%0A%0ATerima%20kasih!"
                className="inline-flex items-center gap-2 bg-secondary-400 hover:bg-secondary-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg"
              >
                Daftar Jadi Organizer
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}