import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Tag, Ticket, Users, AlertCircle,
  CheckCircle, Loader2, Gift, Coins
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface TicketType {
  id: number;
  name: string;
  price: number;
  available_quantity: number;
  description?: string;
}

interface Event {
  id: number;
  name: string;
  location: string;
  venue: string;
  start_date: string;
  image_url?: string;
  ticket_types: TicketType[];
  organizer?: { name: string };
}

interface TicketSelection {
  ticket_type_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface VoucherData {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface CouponData {
  user_coupon_id: number; // id dari user_coupon (bukan coupon.id)
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

function formatPrice(price: number) {
  const num = Number(price);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(d);
}

export default function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { token, isHydrated } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ticket selections
  const [selections, setSelections] = useState<TicketSelection[]>([]);

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  // Real coupon & points from API
  const [availablePoints, setAvailablePoints] = useState(0);
  const [availableCoupon, setAvailableCoupon] = useState<CouponData | null>(null);
  const [useCoupon, setUseCoupon] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [discountsLoading, setDiscountsLoading] = useState(true);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/events/${eventId}`);
        const data = res.data.data?.event || res.data.data;
        setEvent(data);
        setSelections(
          data.ticket_types?.map((tt: TicketType) => ({
            ticket_type_id: tt.id,
            name: tt.name,
            price: Number(tt.price),
            quantity: 0,
          })) || []
        );
      } catch {
        setError('Event tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Fetch real discounts (points & coupons)
  useEffect(() => {
    if (!isHydrated || !token) return;
    const fetchDiscounts = async () => {
      setDiscountsLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/transactions/discounts`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.data;

        // Points: { total_points: number, point_records: [...] }
        setAvailablePoints(Number(data?.points?.total_points ?? 0));

        // Coupons: [{ id (user_coupon_id), coupon: { code, discount_type, discount_value }, expired_at }]
        if (Array.isArray(data?.coupons) && data.coupons.length > 0) {
          const uc = data.coupons[0];
          setAvailableCoupon({
            user_coupon_id: uc.id,
            code: uc.coupon.code,
            discount_type: uc.coupon.discount_type,
            discount_value: uc.coupon.discount_value,
          });
        }
      } catch {
        // Kalau gagal, tetap 0 / tidak ada kupon
        setAvailablePoints(0);
        setAvailableCoupon(null);
      } finally {
        setDiscountsLoading(false);
      }
    };
    fetchDiscounts();
  }, [isHydrated, token]);

  // ── CALCULATIONS ──
  const totalTicketPrice = selections.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalQuantity = selections.reduce((sum, s) => sum + s.quantity, 0);

  const voucherDiscount = useCallback(() => {
    if (!voucher) return 0;
    if (voucher.discount_type === 'percentage') {
      return Math.round(totalTicketPrice * voucher.discount_value / 100);
    }
    return Math.min(voucher.discount_value, totalTicketPrice);
  }, [voucher, totalTicketPrice]);

  const afterVoucher = totalTicketPrice - voucherDiscount();

  const couponDiscount = useCallback(() => {
    if (!useCoupon || !availableCoupon) return 0;
    if (availableCoupon.discount_type === 'percentage') {
      return Math.round(afterVoucher * availableCoupon.discount_value / 100);
    }
    return Math.min(availableCoupon.discount_value, afterVoucher);
  }, [useCoupon, availableCoupon, afterVoucher]);

  const afterCoupon = afterVoucher - couponDiscount();
  const pointsDiscount = Math.min(pointsToUse, afterCoupon);
  const finalPrice = Math.max(0, afterCoupon - pointsDiscount);

  // ── QUANTITY HANDLERS ──
  const updateQuantity = (ticketTypeId: number, delta: number) => {
    const tt = event?.ticket_types.find(t => t.id === ticketTypeId);
    if (!tt) return;
    setSelections(prev => prev.map(s => {
      if (s.ticket_type_id !== ticketTypeId) return s;
      const newQty = Math.max(0, Math.min(s.quantity + delta, tt.available_quantity, 10));
      return { ...s, quantity: newQty };
    }));
  };

  // ── VOUCHER VALIDATION ──
  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setVoucherSuccess('');
    setVoucher(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/vouchers/${voucherCode}/validate`,
        { params: { event_id: eventId } }
      );
      setVoucher(res.data.data.voucher);
      setVoucherSuccess('Voucher berhasil dipakai!');
    } catch (err: any) {
      setVoucherError(err.response?.data?.message || 'Voucher tidak valid');
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    setVoucherSuccess('');
  };

  // ── CHECKOUT ──
  const handleCheckout = async () => {
    if (totalQuantity === 0) {
      setSubmitError('Pilih minimal 1 tiket.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload: any = {
        event_id: Number(eventId),
        items: selections
          .filter(s => s.quantity > 0)
          .map(s => ({ ticket_type_id: s.ticket_type_id, quantity: s.quantity })),
      };
      if (voucher) payload.voucher_code = voucher.code;
      if (useCoupon && availableCoupon) payload.user_coupon_id = availableCoupon.user_coupon_id;
      if (pointsToUse > 0) payload.points_to_use = pointsToUse;

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/transactions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const snapToken = res.data.data?.transaction?.snap_token
        || res.data.data?.snap_token;

      if (!snapToken) {
        navigate('/transactions');
        return;
      }

      if (!window.snap) {
        setSubmitError('Payment gateway belum siap. Refresh halaman dan coba lagi.');
        setSubmitting(false);
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: () => navigate('/transactions'),
        onPending: () => navigate('/transactions'),
        onError: () => {
          setSubmitError('Pembayaran gagal. Coba lagi.');
          setSubmitting(false);
        },
        onClose: () => navigate('/transactions'),
      });
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Gagal membuat transaksi. Coba lagi.');
      setSubmitting(false);
    }
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">{error}</p>
          <Link to="/events" className="text-sm text-primary-900 hover:underline mt-2 inline-block">
            Kembali ke Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Event Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-primary-300" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">{event.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{event.location} • {event.venue}</p>
                <p className="text-sm text-gray-400">{formatDate(event.start_date)}</p>
              </div>
            </div>

            {/* Ticket Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-4 h-4 text-primary-900" />
                <h3 className="font-bold text-gray-900">Pilih Tiket</h3>
              </div>
              <div className="space-y-3">
                {event.ticket_types.map(tt => {
                  const selection = selections.find(s => s.ticket_type_id === tt.id);
                  const qty = selection?.quantity ?? 0;
                  const isSoldOut = tt.available_quantity === 0;
                  return (
                    <div key={tt.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        isSoldOut ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200'
                      }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{tt.name}</p>
                          {isSoldOut && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Habis</span>
                          )}
                        </div>
                        {tt.description && <p className="text-xs text-gray-400 mt-0.5">{tt.description}</p>}
                        <p className="text-xs text-gray-400">{tt.available_quantity} tersisa</p>
                        <p className="text-sm font-bold text-primary-900 mt-1">{formatPrice(tt.price)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(tt.id, -1)} disabled={qty === 0 || isSoldOut}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-900 hover:text-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold">
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-gray-900 text-sm">{qty}</span>
                        <button onClick={() => updateQuantity(tt.id, 1)} disabled={qty >= Math.min(tt.available_quantity, 10) || isSoldOut}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-900 hover:text-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold">
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voucher */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-primary-900" />
                <h3 className="font-bold text-gray-900">Voucher</h3>
              </div>
              {voucher ? (
                <div className="flex items-center justify-between bg-success-50 border border-success-500 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <div>
                      <p className="text-sm font-bold text-success-700">{voucher.code}</p>
                      <p className="text-xs text-success-600">
                        Diskon {voucher.discount_type === 'percentage'
                          ? `${voucher.discount_value}%`
                          : formatPrice(voucher.discount_value)}
                      </p>
                    </div>
                  </div>
                  <button onClick={removeVoucher} className="text-xs text-red-500 hover:text-red-700 font-semibold">Hapus</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && validateVoucher()}
                    placeholder="Masukkan kode voucher..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent" />
                  <button onClick={validateVoucher} disabled={voucherLoading || !voucherCode.trim()}
                    className="px-4 py-2.5 bg-primary-900 text-white text-sm font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pakai'}
                  </button>
                </div>
              )}
              {voucherError && <p className="text-xs text-red-500 mt-2">{voucherError}</p>}
              {voucherSuccess && <p className="text-xs text-success-500 mt-2">{voucherSuccess}</p>}
            </div>

            {/* Kupon Referral */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-4 h-4 text-secondary-400" />
                <h3 className="font-bold text-gray-900">Kupon Referral</h3>
              </div>
              {discountsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat kupon...
                </div>
              ) : availableCoupon ? (
                <div onClick={() => setUseCoupon(!useCoupon)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    useCoupon ? 'border-secondary-400 bg-secondary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{availableCoupon.code}</p>
                    <p className="text-xs text-gray-400">
                      Diskon {availableCoupon.discount_type === 'percentage'
                        ? `${availableCoupon.discount_value}%`
                        : formatPrice(availableCoupon.discount_value)} untuk semua event
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    useCoupon ? 'border-secondary-400 bg-secondary-400' : 'border-gray-300'
                  }`}>
                    {useCoupon && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Tidak ada kupon tersedia.</p>
              )}
            </div>

            {/* Gunakan Poin */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-bold text-gray-900">Gunakan Poin</h3>
                </div>
                {discountsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {availablePoints.toLocaleString('id-ID')} poin tersedia
                  </span>
                )}
              </div>
              {!discountsLoading && availablePoints > 0 ? (
                <>
                  <input type="range" min={0}
                    max={availablePoints}
                    step={1000} value={pointsToUse}
                    onChange={e => setPointsToUse(Number(e.target.value))}
                    className="w-full accent-primary-900" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span className="text-primary-900 font-semibold">
                      {pointsToUse > 0
                        ? `${pointsToUse.toLocaleString('id-ID')} poin = ${formatPrice(pointsToUse)}`
                        : 'Tidak digunakan'}
                    </span>
                    <span>{Math.min(availablePoints, Math.max(0, afterCoupon)).toLocaleString('id-ID')}</span>
                  </div>
                </>
              ) : !discountsLoading ? (
                <p className="text-sm text-gray-400">Tidak ada poin tersedia.</p>
              ) : null}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4">
              <h3 className="font-bold text-gray-900">Ringkasan Pesanan</h3>

              {selections.filter(s => s.quantity > 0).length > 0 ? (
                <div className="space-y-2">
                  {selections.filter(s => s.quantity > 0).map(s => (
                    <div key={s.ticket_type_id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.name} × {s.quantity}</span>
                      <span className="font-semibold text-gray-800">{formatPrice(s.price * s.quantity)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Users className="w-4 h-4 text-gray-300" />
                  <p className="text-xs text-gray-400">Belum ada tiket dipilih</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total tiket</span>
                  <span className="font-semibold">{formatPrice(totalTicketPrice)}</span>
                </div>
                {voucherDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success-600">Diskon voucher</span>
                    <span className="font-semibold text-success-600">- {formatPrice(voucherDiscount())}</span>
                  </div>
                )}
                {couponDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">Diskon kupon</span>
                    <span className="font-semibold text-secondary-500">- {formatPrice(couponDiscount())}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Poin digunakan</span>
                    <span className="font-semibold text-yellow-600">- {formatPrice(pointsDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total Bayar</span>
                  <span className="text-xl font-extrabold text-primary-900">{formatPrice(finalPrice)}</span>
                </div>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              <button onClick={handleCheckout} disabled={submitting || totalQuantity === 0}
                className="w-full py-3.5 bg-primary-900 hover:bg-primary-800 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : (
                  `Bayar ${finalPrice > 0 ? formatPrice(finalPrice) : 'Gratis'}`
                )}
              </button>

              <p className="text-center text-xs text-gray-400">Pembayaran aman via Midtrans</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}