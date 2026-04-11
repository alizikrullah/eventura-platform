import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Star, ChevronLeft,
  Clock, Building, Ticket, Share2, AlertCircle, Pencil
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  available_quantity: number;
  description?: string;
}

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    profile_picture?: string;
  };
}

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  venue: string;
  start_date: string;
  end_date: string;
  total_seats: number;
  available_seats: number;
  image_url?: string;
  is_active: boolean;
  category?: { id: number; name: string; slug: string };
  organizer?: { id: number; name: string; email: string; profile_picture?: string };
  ticket_types: TicketType[];
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
}

function formatPrice(price: number) {
  const num = Number(price);
  if (isNaN(num) || num === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);
}

function safeDate(dateStr: string) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr: string) {
  const d = safeDate(dateStr);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(d);
}

function formatTime(dateStr: string) {
  const d = safeDate(dateStr);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  }).format(d);
}

function formatShort(dateStr: string) {
  const d = safeDate(dateStr);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
}

function formatReviewDate(dateStr: string) {
  const d = safeDate(dateStr);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/events/${id}`);
        const data = res.data.data?.event || res.data.data;
        setEvent(data);
        const firstAvailable = data.ticket_types?.find((tt: TicketType) => tt.available_quantity > 0);
        if (firstAvailable) setSelectedTicket(firstAvailable);
      } catch {
        setError('Event tidak ditemukan atau sudah tidak tersedia.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBuyTicket = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role === 'organizer') return;
    navigate(`/checkout/${id}`);
  };

  const isSoldOut = event?.available_seats === 0;
  const isPast = event ? (safeDate(event.end_date) ?? new Date()) < new Date() : false;
  const minPrice = event?.ticket_types?.length
    ? Math.min(...event.ticket_types.map(tt => Number(tt.price)))
    : 0;

  const isOwner = user?.role === 'organizer' && event?.organizer?.id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-72 bg-gray-100 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Event Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/events"
            className="inline-flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">

      {/* HERO IMAGE */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-20 h-20 text-primary-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 bg-primary-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary-800 transition-colors shadow-lg">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Top right actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwner && (
            <Link
              to={`/organizer/events/${event.id}/edit`}
              className="flex items-center gap-1.5 bg-white text-primary-900 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          )}
          <button className="w-9 h-9 bg-primary-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-800 transition-colors shadow-lg">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {event.category && (
            <span className="bg-white/90 backdrop-blur-sm text-primary-900 text-xs font-bold px-3 py-1.5 rounded-lg">
              {event.category.name}
            </span>
          )}
          {isSoldOut && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Sold Out</span>}
          {isPast && <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Selesai</span>}
          {minPrice === 0 && !isSoldOut && <span className="bg-success-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Gratis</span>}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{event.name}</h1>
              {event.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(event.average_rating)} />
                  <span className="text-sm font-semibold text-gray-700">{event.average_rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({event.total_reviews} ulasan)</span>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Tanggal Mulai', value: formatDate(event.start_date), sub: formatTime(event.start_date) },
                { icon: Clock, label: 'Tanggal Selesai', value: formatDate(event.end_date), sub: formatTime(event.end_date) },
                { icon: MapPin, label: 'Lokasi', value: event.location, sub: null },
                { icon: Building, label: 'Venue', value: event.venue, sub: null },
                { icon: Users, label: 'Kursi Tersedia', value: `${event.available_seats} dari ${event.total_seats}`, sub: null },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary-900" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                      {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Tentang Event</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{event.description}</div>
            </div>

            {/* Ticket Types */}
            {event.ticket_types?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Tipe Tiket</h2>
                <div className="space-y-3">
                  {event.ticket_types.map(tt => (
                    <div key={tt.id} onClick={() => tt.available_quantity > 0 && setSelectedTicket(tt)}
                      className={`relative border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                        selectedTicket?.id === tt.id ? 'border-primary-900 bg-primary-50'
                        : tt.available_quantity === 0 ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                      }`}>
                      {selectedTicket?.id === tt.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-primary-900 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                      <div className="flex items-start justify-between pr-8">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Ticket className="w-4 h-4 text-primary-900" />
                            <span className="font-bold text-gray-900">{tt.name}</span>
                            {tt.available_quantity === 0 && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Habis</span>
                            )}
                          </div>
                          {tt.description && <p className="text-xs text-gray-400 mb-2">{tt.description}</p>}
                          <p className="text-xs text-gray-400">{tt.available_quantity} tiket tersisa</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-extrabold text-primary-900">{formatPrice(tt.price)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer */}
            {event.organizer && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Diselenggarakan Oleh</h2>
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                  <div className="w-14 h-14 bg-primary-900 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                    {event.organizer.profile_picture
                      ? <img src={event.organizer.profile_picture} alt={event.organizer.name} className="w-full h-full object-cover" />
                      : event.organizer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{event.organizer.name}</p>
                    <p className="text-sm text-gray-400">{event.organizer.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {event.reviews?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Ulasan ({event.total_reviews})</h2>
                  {event.average_rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-800">{event.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">/ 5.0</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {event.reviews.map(review => (
                    <div key={review.id} className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 bg-primary-900 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                          {review.user.profile_picture
                            ? <img src={review.user.profile_picture} alt={review.user.name} className="w-full h-full object-cover" />
                            : review.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">{review.user.name}</p>
                            <p className="text-xs text-gray-400">{formatReviewDate(review.created_at)}</p>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sticky Buy Card */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Harga mulai dari</p>
                  <p className="text-3xl font-extrabold text-primary-900">{formatPrice(minPrice)}</p>
                </div>

                {selectedTicket && (
                  <div className="bg-primary-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-0.5">Tiket dipilih</p>
                    <p className="text-sm font-bold text-primary-900">{selectedTicket.name}</p>
                    <p className="text-base font-extrabold text-primary-900">{formatPrice(selectedTicket.price)}</p>
                  </div>
                )}

                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Sisa kursi
                    </span>
                    <span className="font-semibold text-gray-800">{event.available_seats}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Tanggal
                    </span>
                    <span className="font-semibold text-gray-800 text-xs">{formatShort(event.start_date)}</span>
                  </div>
                </div>

                <button onClick={handleBuyTicket}
                  disabled={isSoldOut || isPast || user?.role === 'organizer'}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${
                    isSoldOut || isPast || user?.role === 'organizer'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-900 hover:bg-primary-800 text-white shadow-sm'
                  }`}>
                  {isPast ? 'Event Sudah Selesai'
                    : isSoldOut ? 'Tiket Habis'
                    : user?.role === 'organizer' ? 'Organizer Tidak Bisa Beli'
                    : !isAuthenticated ? 'Login untuk Beli Tiket'
                    : 'Beli Tiket Sekarang'}
                </button>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="text-primary-900 font-semibold hover:underline">Login</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 lg:hidden z-30">
        <div className="flex-1">
          <p className="text-xs text-gray-400">Mulai dari</p>
          <p className="text-lg font-extrabold text-primary-900">{formatPrice(minPrice)}</p>
        </div>
        <button onClick={handleBuyTicket}
          disabled={isSoldOut || isPast || user?.role === 'organizer'}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
            isSoldOut || isPast || user?.role === 'organizer'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-900 hover:bg-primary-800 text-white'
          }`}>
          {isPast ? 'Selesai' : isSoldOut ? 'Habis' : !isAuthenticated ? 'Login dulu' : 'Beli Tiket'}
        </button>
      </div>
    </div>
  );
}
