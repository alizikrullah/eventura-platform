import { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { TicketPercent } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthShell } from '../components/layout/AuthShell'
import { useAuth } from '../hooks/useAuth'

const validationSchema = Yup.object({
  name: Yup.string().required('Nama wajib diisi'),
  email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
  password: Yup.string().min(6, 'Password minimal 6 karakter').required('Password wajib diisi'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Konfirmasi password tidak sama').required('Konfirmasi password wajib diisi'),
  role: Yup.mixed<'customer' | 'organizer'>().oneOf(['customer', 'organizer']).required('Role wajib dipilih'),
  referralCode: Yup.string().optional(),
})

export function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [serverError, setServerError] = useState('')

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Daftar akun baru"
      description="Buat akun customer atau organizer. Referral code bersifat opsional dan benefit referral hanya berlaku untuk customer."
      footer={<p>Sudah punya akun? <Link className="font-semibold text-primary-700" to="/login">Masuk sekarang</Link></p>}
    >
      <Formik
        initialValues={{ name: '', email: '', password: '', confirmPassword: '', role: 'customer' as 'customer' | 'organizer', referralCode: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setServerError('')
          try {
            await auth.register({
              name: values.name,
              email: values.email,
              password: values.password,
              role: values.role,
              referralCode: values.referralCode || undefined,
            })
            navigate(values.role === 'organizer' ? '/organizer/dashboard' : '/customer/dashboard', { replace: true })
          } catch (error: unknown) {
            setServerError(error instanceof Error ? error.message : 'Register gagal')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nama lengkap</Label>
                <Field as={Input} id="name" name="name" placeholder="Nama lengkap" />
                {touched.name && errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Field as={Input} id="email" name="email" type="email" placeholder="nama@email.com" />
                {touched.email && errors.email ? <p className="text-sm text-red-600">{errors.email}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Field as={Input} id="password" name="password" type="password" placeholder="Minimal 6 karakter" />
                {touched.password && errors.password ? <p className="text-sm text-red-600">{errors.password}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password</Label>
                <Field as={Input} id="confirmPassword" name="confirmPassword" type="password" placeholder="Ulangi password" />
                {touched.confirmPassword && errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword}</p> : null}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Role akun</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`rounded-2xl border px-4 py-3 text-left transition ${values.role === 'customer' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 bg-white text-slate-600'}`}
                  onClick={() => setFieldValue('role', 'customer')}
                  type="button"
                >
                  <p className="font-semibold">Customer</p>
                  <p className="mt-1 text-sm">Daftar event dan gunakan referral.</p>
                </button>
                <button
                  className={`rounded-2xl border px-4 py-3 text-left transition ${values.role === 'organizer' ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-slate-200 bg-white text-slate-600'}`}
                  onClick={() => setFieldValue('role', 'organizer')}
                  type="button"
                >
                  <p className="font-semibold">Organizer</p>
                  <p className="mt-1 text-sm">Kelola event dan akses area organizer.</p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary-100 bg-secondary-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-secondary-700">
                <TicketPercent className="h-4 w-4" />
                <p className="text-sm font-semibold">Referral benefit</p>
              </div>
              <p className="mb-3 text-sm text-slate-600">
                Customer yang mendaftar dengan referral code bisa mendapatkan coupon. Referrer akan menerima 10000 point.
              </p>
              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral code</Label>
                <Field as={Input} id="referralCode" name="referralCode" placeholder="Opsional" />
                {touched.referralCode && errors.referralCode ? <p className="text-sm text-red-600">{errors.referralCode}</p> : null}
              </div>
            </div>

            {serverError ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div> : null}

            <Button className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Membuat akun...' : 'Daftar sekarang'}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}
