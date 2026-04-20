import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Calendar, MapPin, Users, Pencil, Trash2,
  Tag, Loader2, Eye
} from 'lucide-react';
import axios from 'axios';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
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

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
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
      setEventToDelete(null);
      fetchEvents();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Gagal menghapus event.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl px-4 mx-auto sm:px-6 lg:px-8">

        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Events</h1>
            <p className="mt-1 text-sm text-gray-400">Kelola semua event yang kamu buat</p>
          </div>
          <Link to="/organizer/dashboard/events/create"
            className="flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Buat Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-full">
              <Calendar className="text-gray-300 w-9 h-9" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-700">Belum ada event</h3>
            <p className="mb-6 text-sm text-gray-400">Mulai buat event pertamamu sekarang!</p>
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
                <div key={event.id} className="overflow-hidden transition-shadow bg-white border border-gray-100 rounded-2xl hover:shadow-md">
                  <div className="flex items-start gap-4 p-5">
                    <div className="w-20 h-20 overflow-hidden rounded-xl bg-primary-100 shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Calendar className="w-7 h-7 text-primary-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">{event.name}</h3>
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
                              <Users className="w-3.5 h-3.5" />
                              {Math.max(0, event.total_seats - event.available_seats)}/{event.total_seats} kursi terjual
                            </span>
                          </div>
                        </div>
                        <p className="text-base font-extrabold text-primary-900 shrink-0">{formatPrice(minPrice)}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
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
                        <button onClick={() => { setEventToDelete(event); setDeleteError(''); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={Boolean(eventToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setEventToDelete(null);
            setDeleteError('');
          }
        }}
        title="Hapus event ini?"
        description={eventToDelete ? `Event ${eventToDelete.name} akan dihapus dan tidak bisa dikembalikan.` : 'Event yang sudah dihapus tidak bisa dikembalikan.'}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        errorMessage={deleteError}
        onConfirm={() => {
          if (eventToDelete) {
            void handleDelete(eventToDelete.id);
          }
        }}
      />
    </div>
  );
}