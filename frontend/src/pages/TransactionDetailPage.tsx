import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ChevronLeft, Calendar, MapPin, Ticket, CheckCircle,
  Clock, XCircle, Star, AlertCircle, Loader2
} from 'lucide-react';
import axios from 'axios';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import { useAuthStore } from '@/store/authStore';

interface TransactionItem {
  ticket_name: string;
  ticket_number?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Transaction {
  id: number;
  invoice_number: string;
  event: {
    id: number;
    name: string;
    location: string;
    venue: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    image_url?: string;
  };
  items: TransactionItem[];
  total_ticket_price: number;
  voucher_discount: number;
  coupon_discount: number;
  points_used: number;
  final_price: number;
  status: 'waiting_payment' | 'paid' | 'expired' | 'canceled';
  payment_expired_at?: string;
  snap_token?: string;
  created_at: string;
  has_review: boolean;
}

const STATUS_CONFIG = {
  waiting_payment: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-warning-500', bg: 'bg-warning-50 border-warning-500' },
  paid: { label: 'Pembayaran Berhasil', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-50 border-success-500' },
  expired: { label: 'Kedaluwarsa', icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-300' },
  canceled: { label: 'Dibatalkan', icon: XCircle, color: 'text-error-500', bg: 'bg-error-50 border-error-500' },
};

function formatPrice(price: number) {
  const num = Number(price);
  if (isNaN(num) || num === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d);
}

function CountdownTimer({ expiredAt }: { expiredAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiredAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Kedaluwarsa'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiredAt]);
  return <span className="font-mono font-bold text-warning-700">{timeLeft}</span>;
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isHydrated } = useAuthStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchTransaction = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data?.transaction || res.data.data;
      setTransaction(data);
    } catch {
      setError('Transaksi tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    fetchTransaction();
  }, [id, isHydrated]);

  const handleCancel = async () => {
    setCanceling(true);
    setCancelError('');
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/transactions/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCancelConfirm(false);
      await fetchTransaction();
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Gagal membatalkan transaksi.');
    } finally {
      setCanceling(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">{error}</p>
          <Link to="/transactions" className="text-sm text-primary-900 hover:underline mt-2 inline-block">
            Kembali ke My Tickets
          </Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[transaction.status] ?? STATUS_CONFIG.canceled;
  const StatusIcon = config.icon;
  const isPaid = transaction.status === 'paid';
  const isWaiting = transaction.status === 'waiting_payment';
  const eventEnded = transaction.event.is_active === false;

  const handlePayNow = () => {
    if (!window.snap || !transaction.snap_token) return;
    window.snap.pay(transaction.snap_token, {
      onSuccess: () => fetchTransaction(),
      onPending: () => fetchTransaction(),
      onError: () => {},
      onClose: () => {},
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900">Detail Transaksi</h1>
            <span className="text-xs text-gray-400 font-mono">{transaction.invoice_number}</span>
          </div>
        </div>

        <div className="space-y-5">

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${config.bg}`}>
            <StatusIcon className={`w-6 h-6 ${config.color} shrink-0`} />
            <div className="flex-1">
              <p className={`font-bold ${config.color}`}>{config.label}</p>
              {isWaiting && transaction.payment_expired_at && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-warning-600">Bayar sebelum:</span>
                  <CountdownTimer expiredAt={transaction.payment_expired_at} />
                </div>
              )}
            </div>
            {isWaiting && transaction.snap_token && (
              <button
                onClick={handlePayNow}
                className="text-xs font-bold bg-warning-500 hover:bg-warning-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Bayar Sekarang
              </button>
            )}
          </div>

          {/* Event Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                {transaction.event.image_url ? (
                  <img src={transaction.event.image_url} alt={transaction.event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-300" />
                  </div>
                )}
              </div>
              <div>
                <Link
                  to={`/events/${transaction.event.id}`}
                  className="font-bold text-gray-900 hover:text-primary-900 transition-colors"
                >
                  {transaction.event.name}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(transaction.event.start_date)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {transaction.event.location} • {transaction.event.venue}
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Ticket - hanya tampil kalau paid */}
          {isPaid && transaction.items?.some(item => item.ticket_number) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary-900" /> Tiket Kamu
              </h3>
              <div className="space-y-4">
                {transaction.items?.map((item, i) => item.ticket_number && (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 rounded-2xl p-5">
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-xl shadow-sm shrink-0">
                      <QRCodeSVG
                        value={item.ticket_number}
                        size={120}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    {/* Ticket Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs text-gray-400 mb-1">Tipe Tiket</p>
                      <p className="font-bold text-gray-900 text-lg mb-3">{item.ticket_name}</p>
                      <p className="text-xs text-gray-400 mb-1">Nomor Tiket</p>
                      <p className="font-mono text-sm font-bold text-primary-900 tracking-wider bg-primary-50 px-3 py-1.5 rounded-lg inline-block">
                        {item.ticket_number}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400 mt-2">× {item.quantity} tiket</p>
                      )}
                      <p className="text-xs text-gray-400 mt-3">
                        Tunjukkan QR code ini saat masuk event
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary-900" /> Tiket
            </h3>
            <div className="space-y-2">
              {transaction.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.ticket_name}</p>
                    <p className="text-xs text-gray-400">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Rincian Harga</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total tiket</span>
                <span className="font-semibold">{formatPrice(transaction.total_ticket_price)}</span>
              </div>
              {Number(transaction.voucher_discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">Diskon voucher</span>
                  <span className="font-semibold text-success-600">- {formatPrice(transaction.voucher_discount)}</span>
                </div>
              )}
              {Number(transaction.coupon_discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-500">Diskon kupon</span>
                  <span className="font-semibold text-secondary-500">- {formatPrice(transaction.coupon_discount)}</span>
                </div>
              )}
              {Number(transaction.points_used) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">Poin digunakan</span>
                  <span className="font-semibold text-yellow-600">- {formatPrice(transaction.points_used)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total Bayar</span>
                <span className="text-xl font-extrabold text-primary-900">{formatPrice(transaction.final_price)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Info Transaksi</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Invoice</span>
                <span className="font-mono text-xs font-semibold text-gray-700">{transaction.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tanggal transaksi</span>
                <span className="text-gray-700 font-semibold">{formatDate(transaction.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          {isWaiting && (
            <div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-3 border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold text-sm rounded-xl transition-colors"
              >
                Batalkan Transaksi
              </button>
            </div>
          )}

          {/* Review Section */}
          {isPaid && eventEnded && (
            <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl p-4">
              <Star className="w-5 h-5 text-primary-900 shrink-0" />
              <p className="text-sm text-primary-900">
                Event ini sudah selesai.{' '}
                <Link
                  to={`/events/${transaction.event.id}`}
                  className="font-semibold underline hover:text-primary-700"
                >
                  Tulis ulasanmu di halaman event
                </Link>
              </p>
            </div>
          )}

          {isPaid && !eventEnded && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <Star className="w-5 h-5 text-gray-400 shrink-0" />
              <p className="text-sm text-gray-500">
                Kamu bisa memberikan ulasan setelah event selesai.
              </p>
            </div>
          )}

        </div>
      </div>

      <ConfirmActionDialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          if (!canceling) {
            setShowCancelConfirm(open);
            if (!open) setCancelError('');
          }
        }}
        title="Batalkan transaksi ini?"
        description="Kursi, poin, kupon, dan voucher yang digunakan akan dikembalikan bila transaksi berhasil dibatalkan."
        confirmLabel="Ya, Batalkan"
        loading={canceling}
        errorMessage={cancelError}
        onConfirm={() => {
          void handleCancel();
        }}
      />
    </div>
  );
}