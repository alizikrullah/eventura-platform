import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../hooks/useAuth'

export function CustomerDashboardPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)]">
          <div>
            <Badge variant="secondary">Customer Area</Badge>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Halo, {auth.user?.name}</h1>
            <p className="mt-2 text-slate-600">Halaman placeholder customer untuk membuktikan route guard bekerja.</p>
          </div>
          <Button asChild variant="outline"><Link to="/profile">Buka profile</Link></Button>
        </div>
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Referral summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Referral code Anda: <span className="font-semibold text-primary-700">{auth.user?.referral_code}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
