import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, MapPin, Users, Pencil, Trash2,
  Tag, Loader2, Eye
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface Event {
  id: number;
  name: string;
  location: string;
  venue: string;
  start_date: string;
  end_date: string;
  total_seats: number;
  available_seats: number;
  image_url?: string;
  is_active: boolean;
  category?: { name: string };
  ticket_types?: { price: number }[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function formatPrice(price: number) {
  const num = Number(price);
  if (isNaN(num) || num === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

export default function MyEventsPage() {
  const { token, isHydrated } = useAuthStore();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/events/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data.data?.events || res.data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    fetchEvents();
  }, [isHydrated]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchEvents();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Gagal menghapus event.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Events</h1>
            <p className="text-sm text-gray-400 mt-1">Kelola semua event yang kamu buat</p>
          </div>
          <Link to="/organizer/dashboard/events/create"
            className="flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Buat Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum ada event</h3>
            <p className="text-sm text-gray-400 mb-6">Mulai buat event pertamamu sekarang!</p>
            <Link to="/organizer/dashboard/events/create"
              className="inline-flex items-center gap-2 bg-primary-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Buat Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const minPrice = event.ticket_types?.length
                ? Math.min(...event.ticket_types.map(tt => Number(tt.price)))
                : 0;
              const isPast = new Date(event.end_date) < new Date();

              return (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 p-5">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-7 h-7 text-primary-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-base">{event.name}</h3>
                            {event.category && (
                              <span className="text-xs bg-primary-50 text-primary-900 px-2 py-0.5 rounded-full font-semibold">
                                {event.category.name}
                              </span>
                            )}
                            {!event.is_active && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Nonaktif</span>
                            )}
                            {isPast && (
                              <span className="text-xs bg-error-50 text-error-700 px-2 py-0.5 rounded-full font-semibold">Selesai</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3.5 h-3.5" /> {formatDate(event.start_date)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="w-3.5 h-3.5" /> {event.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Users className="w-3.5 h-3.5" /> {event.available_seats}/{event.total_seats} kursi
                            </span>
                          </div>
                        </div>
                        <p className="text-base font-extrabold text-primary-900 shrink-0">{formatPrice(minPrice)}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Link to={`/events/${event.id}`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Lihat
                        </Link>
                        <Link to={`/organizer/dashboard/events/${event.id}/edit`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary-900 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <Link to={`/organizer/dashboard/events/${event.id}/vouchers`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-secondary-500 border border-secondary-200 px-3 py-1.5 rounded-lg hover:bg-secondary-50 transition-colors">
                          <Tag className="w-3.5 h-3.5" /> Voucher
                        </Link>
                        <button onClick={() => { setDeleteId(event.id); setDeleteError(''); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>

                  {deleteId === event.id && (
                    <div className="border-t border-red-100 bg-red-50 px-5 py-4">
                      <p className="text-sm font-bold text-red-700 mb-1">Hapus event ini?</p>
                      <p className="text-xs text-red-500 mb-3">Event yang sudah dihapus tidak bisa dikembalikan.</p>
                      {deleteError && <p className="text-xs text-red-600 mb-2">{deleteError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteId(null)}
                          className="flex-1 py-2 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-white transition-colors">
                          Batal
                        </button>
                        <button onClick={() => handleDelete(event.id)} disabled={deleting}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}