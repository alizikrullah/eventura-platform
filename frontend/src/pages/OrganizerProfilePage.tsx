import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Star, ChevronLeft, AlertCircle,
} from 'lucide-react';
import axios from 'axios';

interface OrganizerInfo {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  created_at: string;
  overall_rating: number;
  total_reviews: number;
}

interface EventItem {
  id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url?: string;
  is_active: boolean;
  category?: { id: number; name: string; slug: string };
  min_price: number;
  average_rating: number;
  total_reviews: number;
  available_seats: number;
}

interface OrganizerProfileData {
  organizer: OrganizerInfo;
  activeEvents: EventItem[];
  pastEvents: EventItem[];
}

function formatPrice(price: number) {
  if (!price || price === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(d);
}

function formatMemberSince(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long', year: 'numeric',
  }).format(d);
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary-300" />
          </div>
        )}
        {event.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary-900 text-xs font-semibold px-2.5 py-1 rounded-lg">
            {event.category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary-900 transition-colors">
          {event.name}
        </h3>
        <div className="space-y-1.5 mb-3 flex-1">
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
            {formatPrice(event.min_price)}
          </span>
          {event.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-gray-600">
                {event.average_rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({event.total_reviews})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function OrganizerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OrganizerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/events/organizer/${id}/profile`,
        );
        setData(res.data.data);
      } catch {
        setError('Profil organizer tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex gap-8">
            <div className="w-48 shrink-0 space-y-3">
              <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mx-auto" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Organizer Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Events
          </Link>
        </div>
      </div>
    );
  }

  const { organizer, activeEvents, pastEvents } = data;
  const currentEvents = activeTab === 'active' ? activeEvents : pastEvents;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Events
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: Organizer Info */}
          <aside className="lg:w-48 shrink-0">
            <div className="lg:sticky lg:top-24 flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              {/* Avatar */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 lg:mx-auto lg:mb-4 bg-primary-900 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden">
                {organizer.profile_picture
                  ? (
                    <img
                      src={organizer.profile_picture}
                      alt={organizer.name}
                      className="w-full h-full object-cover"
                    />
                  )
                  : organizer.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 lg:text-center">
                <h1 className="font-bold text-gray-900 text-base lg:text-lg leading-tight mb-1">
                  {organizer.name}
                </h1>
                <p className="text-xs text-gray-400 mb-3">
                  Member sejak {formatMemberSince(organizer.created_at)}
                </p>
                {organizer.overall_rating > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-gray-700">
                      {organizer.overall_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({organizer.total_reviews} ulasan)
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap lg:justify-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {activeEvents.length} event aktif
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {pastEvents.length} event lalu
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: Events */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-primary-900 text-primary-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Event Aktif
                <span className="ml-1.5 text-xs bg-primary-50 text-primary-900 px-1.5 py-0.5 rounded-full">
                  {activeEvents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'border-primary-900 text-primary-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Event Lalu
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {pastEvents.length}
                </span>
              </button>
            </div>

            {/* Count info */}
            <p className="text-sm text-gray-400 mb-4">
              {currentEvents.length} event {activeTab === 'active' ? 'aktif' : 'lalu'} ditemukan
            </p>

            {/* Events grid */}
            {currentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold mb-1">
                  {activeTab === 'active' ? 'Tidak ada event aktif' : 'Tidak ada event lalu'}
                </p>
                <p className="text-sm text-gray-400">
                  {activeTab === 'active'
                    ? 'Organizer belum punya event yang sedang aktif.'
                    : 'Organizer belum punya event yang sudah selesai.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {currentEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}