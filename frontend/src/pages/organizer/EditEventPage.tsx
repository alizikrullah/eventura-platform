import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, X, Plus, Trash2, ChevronLeft,
  Calendar, MapPin, Users, Tag, FileText, Image, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface TicketTypeInput {
  id: string;
  name: string;
  price: string;
  available_quantity: string;
  description: string;
}

interface FormData {
  name: string;
  description: string;
  location: string;
  venue: string;
  category_id: string;
  total_seats: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  [key: string]: string;
}

const CATEGORIES = [
  { id: 1, name: 'Music' },
  { id: 2, name: 'Sports' },
  { id: 3, name: 'Technology' },
  { id: 4, name: 'Food & Drink' },
  { id: 5, name: 'Art & Culture' },
  { id: 6, name: 'Education' },
  { id: 7, name: 'Business' },
  { id: 8, name: 'Health & Wellness' },
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function toLocalDatetime(isoStr: string) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<FormData>({
    name: '', description: '', location: '', venue: '',
    category_id: '', total_seats: '', start_date: '', end_date: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch existing event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const event = res.data.data?.event || res.data.data;

        setForm({
          name: event.name || '',
          description: event.description || '',
          location: event.location || '',
          venue: event.venue || '',
          category_id: String(event.category_id || event.category?.id || ''),
          total_seats: String(event.total_seats || ''),
          start_date: toLocalDatetime(event.start_date),
          end_date: toLocalDatetime(event.end_date),
        });

        if (event.image_url) {
          setExistingImageUrl(event.image_url);
          setImagePreview(event.image_url);
        }

        if (event.ticket_types?.length > 0) {
          setTicketTypes(event.ticket_types.map((tt: any) => ({
            id: generateId(),
            name: tt.name || '',
            price: String(tt.price || 0),
            available_quantity: String(tt.available_quantity || tt.quantity || ''),
            description: tt.description || '',
          })));
        } else {
          setTicketTypes([{ id: generateId(), name: 'Regular', price: '0', available_quantity: '', description: '' }]);
        }
      } catch {
        setSubmitError('Gagal memuat data event.');
      } finally {
        setFetching(false);
      }
    };
    if (token) fetchEvent();
  }, [id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Ukuran gambar maksimal 2MB' }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setExistingImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTicketType = () => {
    setTicketTypes(prev => [...prev, { id: generateId(), name: '', price: '0', available_quantity: '', description: '' }]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length === 1) return;
    setTicketTypes(prev => prev.filter(tt => tt.id !== id));
  };

  const updateTicketType = (id: string, field: keyof TicketTypeInput, value: string) => {
    setTicketTypes(prev => prev.map(tt => tt.id === id ? { ...tt, [field]: value } : tt));
    setErrors(prev => ({ ...prev, [`ticket_${id}_${field}`]: '' }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nama event wajib diisi';
    if (!form.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (!form.location.trim()) newErrors.location = 'Lokasi wajib diisi';
    if (!form.venue.trim()) newErrors.venue = 'Venue wajib diisi';
    if (!form.category_id) newErrors.category_id = 'Kategori wajib dipilih';
    if (!form.total_seats || Number(form.total_seats) < 1) newErrors.total_seats = 'Kapasitas minimal 1 kursi';
    if (!form.start_date) newErrors.start_date = 'Tanggal mulai wajib diisi';
    if (!form.end_date) newErrors.end_date = 'Tanggal selesai wajib diisi';
    if (form.start_date && form.end_date && form.start_date >= form.end_date) {
      newErrors.end_date = 'Tanggal selesai harus setelah tanggal mulai';
    }
    ticketTypes.forEach(tt => {
      if (!tt.name.trim()) newErrors[`ticket_${tt.id}_name`] = 'Nama tiket wajib diisi';
      if (Number(tt.price) < 0) newErrors[`ticket_${tt.id}_price`] = 'Harga tidak boleh negatif';
      if (!tt.available_quantity || Number(tt.available_quantity) < 1) {
        newErrors[`ticket_${tt.id}_available_quantity`] = 'Kuantitas minimal 1';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('venue', form.venue);
      formData.append('category_id', form.category_id);
      formData.append('total_seats', form.total_seats);
      formData.append('start_date', new Date(form.start_date).toISOString());
      formData.append('end_date', new Date(form.end_date).toISOString());
      if (imageFile) formData.append('image', imageFile);
      formData.append('ticket_types', JSON.stringify(
        ticketTypes.map(tt => ({
          name: tt.name,
          price: Number(tt.price),
          available_quantity: Number(tt.available_quantity),
          description: tt.description,
        }))
      ));

      await axios.put(
        `${import.meta.env.VITE_API_URL}/events/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      navigate('/organizer/dashboard/events');
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:ring-2 focus:ring-primary-900 focus:border-transparent'
    }`;

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Edit Event</h1>
          <p className="text-sm text-gray-400 mt-1">Perbarui detail event kamu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Informasi Dasar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-900" />
              </div>
              <h2 className="font-bold text-gray-900">Informasi Dasar</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Nama Event <span className="text-red-400">*</span>
                </label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Contoh: Music Festival Jakarta 2026" className={inputClass('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Kategori <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select name="category_id" value={form.category_id} onChange={handleChange}
                    className={`${inputClass('category_id')} pl-10`}>
                    <option value="">Pilih kategori...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Deskripsi <span className="text-red-400">*</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={4} placeholder="Ceritakan tentang event kamu..."
                  className={`${inputClass('description')} resize-none`} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Lokasi & Waktu */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-900" />
              </div>
              <h2 className="font-bold text-gray-900">Lokasi & Waktu</h2>
            </div>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Kota/Lokasi <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    placeholder="Contoh: Jakarta" className={inputClass('location')} />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Venue <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="venue" value={form.venue} onChange={handleChange}
                    placeholder="Contoh: GBK Stadium" className={inputClass('venue')} />
                  {errors.venue && <p className="text-xs text-red-500 mt-1">{errors.venue}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Tanggal & Waktu Mulai <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange}
                      className={`${inputClass('start_date')} pl-10`} />
                  </div>
                  {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Tanggal & Waktu Selesai <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange}
                      className={`${inputClass('end_date')} pl-10`} />
                  </div>
                  {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Total Kapasitas <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="total_seats" value={form.total_seats} onChange={handleChange}
                    min={1} placeholder="Contoh: 1000" className={`${inputClass('total_seats')} pl-10`} />
                </div>
                {errors.total_seats && <p className="text-xs text-red-500 mt-1">{errors.total_seats}</p>}
              </div>
            </div>
          </div>

          {/* Gambar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-primary-900" />
              </div>
              <h2 className="font-bold text-gray-900">Gambar Event</h2>
            </div>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                <button type="button" onClick={removeImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                {existingImageUrl && !imageFile && (
                  <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    Gambar saat ini
                  </span>
                )}
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary-900 hover:bg-primary-50 transition-all group">
                <Upload className="w-8 h-8 text-gray-300 group-hover:text-primary-900 transition-colors mb-2" />
                <p className="text-sm font-semibold text-gray-400 group-hover:text-primary-900 transition-colors">
                  Klik untuk upload gambar baru
                </p>
                <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP — Maks. 2MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
          </div>

          {/* Tipe Tiket */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-primary-900" />
                </div>
                <h2 className="font-bold text-gray-900">Tipe Tiket</h2>
              </div>
              <button type="button" onClick={addTicketType}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-900 hover:text-primary-800 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Tipe
              </button>
            </div>
            <div className="space-y-4">
              {ticketTypes.map((tt, index) => (
                <div key={tt.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">Tiket #{index + 1}</span>
                    {ticketTypes.length > 1 && (
                      <button type="button" onClick={() => removeTicketType(tt.id)}
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Nama Tiket <span className="text-red-400">*</span>
                      </label>
                      <input type="text" value={tt.name} onChange={e => updateTicketType(tt.id, 'name', e.target.value)}
                        placeholder="Contoh: VIP, Regular"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${errors[`ticket_${tt.id}_name`] ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-primary-900 focus:border-transparent'}`} />
                      {errors[`ticket_${tt.id}_name`] && <p className="text-xs text-red-500 mt-1">{errors[`ticket_${tt.id}_name`]}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Harga (IDR) <span className="text-gray-300">— 0 = Gratis</span>
                      </label>
                      <input type="number" value={tt.price} onChange={e => updateTicketType(tt.id, 'price', e.target.value)}
                        min={0} placeholder="0"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${errors[`ticket_${tt.id}_price`] ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-primary-900 focus:border-transparent'}`} />
                      {errors[`ticket_${tt.id}_price`] && <p className="text-xs text-red-500 mt-1">{errors[`ticket_${tt.id}_price`]}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Kuantitas <span className="text-red-400">*</span>
                      </label>
                      <input type="number" value={tt.available_quantity} onChange={e => updateTicketType(tt.id, 'available_quantity', e.target.value)}
                        min={1} placeholder="Contoh: 100"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${errors[`ticket_${tt.id}_available_quantity`] ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-primary-900 focus:border-transparent'}`} />
                      {errors[`ticket_${tt.id}_available_quantity`] && <p className="text-xs text-red-500 mt-1">{errors[`ticket_${tt.id}_available_quantity`]}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Deskripsi <span className="text-gray-300">— opsional</span>
                      </label>
                      <input type="text" value={tt.description} onChange={e => updateTicketType(tt.id, 'description', e.target.value)}
                        placeholder="Contoh: Termasuk akses backstage"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          <div className="flex items-center gap-3 pb-8">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}