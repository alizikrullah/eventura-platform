import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Tag, Pencil, Trash2, ChevronLeft,
  AlertCircle, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface Voucher {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_usage: number | null;
  current_usage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface VoucherForm {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_usage: string;
  start_date: string;
  end_date: string;
}

const emptyForm: VoucherForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  max_usage: '',
  start_date: '',
  end_date: '',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function toLocalDate(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function VoucherManagementPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isHydrated } = useAuthStore();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VoucherForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = async () => {
    try {
      const [vouchersRes, eventRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/organizer/vouchers?event_id=${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/events/${eventId}`),
      ]);
      setVouchers(vouchersRes.data.data?.vouchers || vouchersRes.data.data || []);
      const ev = eventRes.data.data?.event || eventRes.data.data;
      setEventName(ev?.name || '');
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    fetchData();
  }, [isHydrated]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v: Voucher) => {
    setEditingId(v.id);
    setForm({
      code: v.code,
      discount_type: v.discount_type,
      discount_value: String(v.discount_value),
      max_usage: v.max_usage != null ? String(v.max_usage) : '',
      start_date: toLocalDate(v.start_date),
      end_date: toLocalDate(v.end_date),
    });
    setFormError('');
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.discount_value || Number(form.discount_value) <= 0) return 'Nilai diskon harus lebih dari 0';
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) return 'Persentase maksimal 100%';
    if (!form.start_date) return 'Tanggal mulai wajib diisi';
    if (!form.end_date) return 'Tanggal selesai wajib diisi';
    if (form.start_date >= form.end_date) return 'Tanggal selesai harus setelah tanggal mulai';
    return '';
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setSaving(true);
    setFormError('');

    const payload: any = {
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date + 'T23:59:59').toISOString(),
    };
    if (form.code.trim()) payload.code = form.code.trim().toUpperCase();
    if (form.max_usage) payload.max_usage = Number(form.max_usage);

    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/vouchers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/events/${eventId}/vouchers`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan voucher.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/vouchers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Gagal menghapus voucher.');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Voucher</h1>
              {eventName && <p className="text-sm text-gray-400 mt-1">{eventName}</p>}
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Buat Voucher
            </button>
          </div>
        </div>

        {/* Voucher List */}
        {vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum ada voucher</h3>
            <p className="text-sm text-gray-400 mb-6">Buat voucher diskon untuk event ini</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 bg-primary-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Buat Voucher
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {vouchers.map(v => {
              const expired = isExpired(v.end_date);
              const usagePercent = v.max_usage ? Math.round((v.current_usage / v.max_usage) * 100) : 0;

              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono font-bold text-gray-900 text-base">{v.code}</span>
                          {!v.is_active && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Nonaktif</span>
                          )}
                          {expired && (
                            <span className="text-xs bg-error-50 text-error-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Expired
                            </span>
                          )}
                          {!expired && v.is_active && (
                            <span className="text-xs bg-success-50 text-success-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Aktif
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          <span className="font-bold text-secondary-400 text-lg">
                            {v.discount_type === 'percentage' ? `${v.discount_value}%` : `Rp ${Number(v.discount_value).toLocaleString('id-ID')}`}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatDate(v.start_date)} — {formatDate(v.end_date)}
                          </span>
                        </div>

                        {/* Usage bar */}
                        {v.max_usage && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Pemakaian</span>
                              <span>{v.current_usage} / {v.max_usage}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${usagePercent >= 100 ? 'bg-red-400' : 'bg-primary-900'}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {!v.max_usage && (
                          <p className="text-xs text-gray-400 mt-2">Pemakaian: {v.current_usage} kali (unlimited)</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEdit(v)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-primary-900 hover:text-primary-900 hover:bg-primary-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setDeleteId(v.id); setDeleteError(''); }}
                          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirm */}
                  {deleteId === v.id && (
                    <div className="border-t border-red-100 bg-red-50 px-5 py-4">
                      <p className="text-sm font-bold text-red-700 mb-1">Hapus voucher {v.code}?</p>
                      {deleteError && <p className="text-xs text-red-600 mb-2">{deleteError}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteId(null)}
                          className="flex-1 py-2 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-white transition-colors">
                          Batal
                        </button>
                        <button onClick={() => handleDelete(v.id)} disabled={deleting}
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

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-lg">
                  {editingId ? 'Edit Voucher' : 'Buat Voucher Baru'}
                </h2>
                {!editingId && (
                  <p className="text-xs text-gray-400 mt-1">Kode akan digenerate otomatis jika dikosongkan</p>
                )}
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                {/* Code */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Kode Voucher <span className="text-gray-300 font-normal">— opsional</span>
                  </label>
                  <input type="text" value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: DISKON50 (kosongkan untuk auto)"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent font-mono" />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipe Diskon</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['percentage', 'fixed'] as const).map(type => (
                      <button key={type} type="button"
                        onClick={() => setForm(p => ({ ...p, discount_type: type }))}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.discount_type === type
                            ? 'border-primary-900 bg-primary-50 text-primary-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {type === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Nilai Diskon <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                      {form.discount_type === 'percentage' ? '%' : 'Rp'}
                    </span>
                    <input type="number" value={form.discount_value}
                      onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
                      min={0} max={form.discount_type === 'percentage' ? 100 : undefined}
                      placeholder={form.discount_type === 'percentage' ? '10' : '50000'}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent" />
                  </div>
                </div>

                {/* Max Usage */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Maks. Pemakaian <span className="text-gray-300 font-normal">— kosong = unlimited</span>
                  </label>
                  <input type="number" value={form.max_usage}
                    onChange={e => setForm(p => ({ ...p, max_usage: e.target.value }))}
                    min={1} placeholder="Contoh: 100"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent" />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Mulai <span className="text-red-400">*</span>
                    </label>
                    <input type="date" value={form.start_date}
                      onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Selesai <span className="text-red-400">*</span>
                    </label>
                    <input type="date" value={form.end_date}
                      onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent" />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Voucher'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
