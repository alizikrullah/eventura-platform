import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ticket, Clock, CheckCircle, XCircle,
  ChevronRight, Calendar
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface Transaction {
  id: number;
  invoice_number: string;
  event: {
    id: number;
    name: string;
    start_date: string;
    image_url?: string;
    location?: string;
  };
  total_ticket_price: number;
  final_price: number;
  status: 'waiting_payment' | 'paid' | 'expired' | 'canceled';
  payment_expired_at?: string;
  created_at: string;
  snap_token?: string;
}

const STATUS_CONFIG = {
  waiting_payment: {
    label: 'Menunggu Pembayaran',
    color: 'bg-warning-50 text-warning-700 border-warning-500',
    icon: Clock,
    iconColor: 'text-warning-500',
  },
  paid: {
    label: 'Berhasil',
    color: 'bg-success-50 text-success-700 border-success-500',
    icon: CheckCircle,
    iconColor: 'text-success-500',
  },
  expired: {
    label: 'Kedaluwarsa',
    color: 'bg-gray-50 text-gray-500 border-gray-300',
    icon: XCircle,
    iconColor: 'text-gray-400',
  },
  canceled: {
    label: 'Dibatalkan',
    color: 'bg-error-50 text-error-700 border-error-500',
    icon: XCircle,
    iconColor: 'text-error-500',
  },
};

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'waiting_payment', label: 'Menunggu' },
  { value: 'paid', label: 'Berhasil' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'canceled', label: 'Dibatalkan' },
];

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
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(d);
}

function CountdownTimer({ expiredAt }: { expiredAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(expiredAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Kedaluwarsa'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return <span className="font-mono text-warning-700 font-bold text-sm">{timeLeft}</span>;
}

export default function TransactionsPage() {
  const { token, isHydrated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || '');

  const fetchTransactions = async (status: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (status) params.status = status;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setTransactions(res.data.data?.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    fetchTransactions(activeStatus);
  }, [activeStatus, isHydrated]);

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setSearchParams(status ? { status } : {});
  };

  const handlePayNow = (snapToken: string) => {
    if (!window.snap) return;
    window.snap.pay(snapToken, {
      onSuccess: () => fetchTransactions(activeStatus),
      onPending: () => fetchTransactions(activeStatus),
      onError: () => {},
      onClose: () => {},
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">My Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">Riwayat pembelian tiket event kamu</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleStatusChange(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeStatus === f.value
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-900 hover:text-primary-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!isHydrated || loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum ada transaksi</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6">
              {activeStatus
                ? `Tidak ada transaksi dengan status "${STATUS_FILTERS.find(f => f.value === activeStatus)?.label}"`
                : 'Yuk cari event seru dan beli tiket pertamamu!'}
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-primary-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors text-sm"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(tx => {
              const config = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.canceled;
              const Icon = config.icon;
              const isWaiting = tx.status === 'waiting_payment';

              return (
                <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                  {isWaiting && tx.payment_expired_at && (
                    <div className="bg-warning-50 border-b border-warning-500/30 px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning-500" />
                        <span className="text-xs text-warning-700 font-medium">Selesaikan pembayaran dalam</span>
                      </div>
                      <CountdownTimer expiredAt={tx.payment_expired_at} />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                        {tx.event.image_url ? (
                          <img src={tx.event.image_url} alt={tx.event.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{tx.event.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tx.invoice_number}</p>
                            <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${config.color}`}>
                            <Icon className={`w-3 h-3 ${config.iconColor}`} />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <p className="text-xs text-gray-400">Total bayar</p>
                            <p className="text-base font-extrabold text-primary-900">{formatPrice(tx.final_price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isWaiting && tx.snap_token && (
                              <button
                                onClick={() => handlePayNow(tx.snap_token!)}
                                className="text-xs font-bold bg-warning-500 hover:bg-warning-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Bayar Sekarang
                              </button>
                            )}
                            <Link
                              to={`/transactions/${tx.id}`}
                              className="flex items-center gap-1 text-xs font-semibold text-primary-900 hover:text-primary-800 transition-colors"
                            >
                              Detail <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
