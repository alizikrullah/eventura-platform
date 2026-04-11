import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
      <div className="max-w-md w-full rounded-[28px] border border-white/60 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-secondary-500">403</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Akses ditolak</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Role akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/">Kembali ke halaman utama</Link>
        </Button>
      </div>
    </div>
  )
}
