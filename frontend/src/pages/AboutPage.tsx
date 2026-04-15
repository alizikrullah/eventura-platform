import { Link } from 'react-router-dom';
import {
  ArrowRight, Ticket, Users, Star, Shield,
  Zap, Heart, Mail, Instagram, MapPin,
  Gift, Search
} from 'lucide-react';

const STATS = [
  { value: '500+', label: 'Event Aktif' },
  { value: '10K+', label: 'Tiket Terjual' },
  { value: '200+', label: 'Organizer' },
  { value: '4.8', label: 'Rating Platform' },
];

const VALUES = [
  {
    icon: Shield,
    title: 'Terpercaya',
    desc: 'Setiap transaksi dijamin aman dengan sistem pembayaran terverifikasi. Tiket asli, tidak ada penipuan.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Cepat & Mudah',
    desc: 'Dari browse sampai checkout dalam hitungan menit. Desain yang intuitif untuk semua kalangan.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Heart,
    title: 'Untuk Semua',
    desc: 'Dari event gratis hingga premium, dari ratusan hingga ribuan kursi. Semua ada di satu platform.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Users,
    title: 'Komunitas',
    desc: 'Mempertemukan organizer berbakat dengan penonton yang antusias di seluruh Indonesia.',
    color: 'bg-green-50 text-green-600',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse Event',
    desc: 'Cari event yang kamu suka berdasarkan kategori, lokasi, atau tanggal.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Beli Tiket',
    desc: 'Pilih tipe tiket, gunakan voucher atau poin, lalu bayar dengan aman via Midtrans.',
    icon: Ticket,
  },
  {
    step: '03',
    title: 'Hadiri & Review',
    desc: 'Datang ke event, nikmati pengalaman seru, lalu tinggalkan review untuk komunitas.',
    icon: Gift,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-primary-900 py-24 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-800 rounded-full opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary-400 rounded-full opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-800 rounded-full opacity-20" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-white/20">
            <Zap className="w-3.5 h-3.5 text-secondary-400" />
            Tentang Eventura
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Platform Event yang{' '}
            <span className="text-secondary-400">Menghubungkan</span>{' '}
            Semua Orang
          </h1>
          <p className="text-primary-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Eventura hadir untuk mempermudah siapa saja menemukan, membeli tiket, dan menghadiri event terbaik di Indonesia. Kami percaya setiap momen berharga untuk dirayakan bersama.
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center py-10 px-6">
                <p className="text-4xl font-extrabold text-primary-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISI ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-secondary-400 text-sm font-bold uppercase tracking-widest mb-4">Misi Kami</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
                Membuat setiap event lebih mudah diakses oleh semua orang
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Kami membangun Eventura karena percaya bahwa pengalaman berkumpul, belajar, dan bersenang-senang bersama adalah hal yang fundamental. Namun terlalu sering, menemukan dan mengakses event yang tepat terasa sulit dan membingungkan.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Dengan Eventura, organizer bisa fokus pada kualitas event mereka, sementara peserta bisa dengan mudah menemukan pengalaman yang sesuai dengan minat dan anggaran mereka.
              </p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Explore Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-400 rounded-full opacity-10 -translate-y-8 translate-x-8" />
                <div className="space-y-4">
                  {[
                    { icon: '🎵', label: 'Music Festival', sub: '1,000 kursi tersisa', color: 'bg-purple-50' },
                    { icon: '💻', label: 'Tech Conference', sub: '200 kursi tersisa', color: 'bg-blue-50' },
                    { icon: '🎨', label: 'Art Exhibition', sub: 'Gratis', color: 'bg-pink-50' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm`}>
                      <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs bg-primary-900 text-white px-3 py-1 rounded-full font-semibold">Beli</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-success-500 fill-success-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Rating rata-rata platform</p>
                    <p className="font-bold text-gray-800">4.8 / 5.0 ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary-400 text-sm font-bold uppercase tracking-widest mb-3">Nilai Kami</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Kenapa Memilih Eventura?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(val => {
              const Icon = val.icon;
              return (
                <div key={val.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${val.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{val.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-secondary-400 text-sm font-bold uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Mudah dalam 3 Langkah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-px border-t-2 border-dashed border-gray-200" />
                  )}
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-primary-900 rounded-2xl mb-5">
                    <Icon className="w-7 h-7 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-secondary-400 text-sm font-bold uppercase tracking-widest mb-3">Kontak</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Ada Pertanyaan?</h2>
          <p className="text-gray-500 mb-10">
            Tim kami siap membantu kamu. Hubungi kami melalui email atau media sosial di bawah ini.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@eventura.com"
              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-primary-900 hover:shadow-md px-6 py-4 rounded-2xl transition-all group w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                <Mail className="w-5 h-5 text-primary-900 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-800">hello@eventura.com</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-primary-900 hover:shadow-md px-6 py-4 rounded-2xl transition-all group w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                <Instagram className="w-5 h-5 text-primary-900 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Instagram</p>
                <p className="text-sm font-semibold text-gray-800">@eventura.id</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-primary-900 hover:shadow-md px-6 py-4 rounded-2xl transition-all group w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                <MapPin className="w-5 h-5 text-primary-900 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="text-sm font-semibold text-gray-800">Jakarta, Indonesia</p>
              </div>
            </a>
          </div>

          <div className="mt-12 pt-10 border-t border-gray-200">
            <p className="text-gray-400 text-sm mb-6">Siap menemukan event seru?</p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Browse Events Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
