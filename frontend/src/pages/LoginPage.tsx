import { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthShell } from '../components/layout/AuthShell'
import { useAuth } from '../hooks/useAuth'

const validationSchema = Yup.object({
  email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
  password: Yup.string().min(6, 'Password minimal 6 karakter').required('Password wajib diisi'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [serverError, setServerError] = useState('')

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Masuk ke Eventura"
      description="Kelola akun, lihat event, dan lanjutkan aktivitas Anda dari satu tempat yang sama."
      footer={<p>Belum punya akun? <Link className="font-semibold text-primary-700" to="/register">Daftar di sini</Link></p>}
    >
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setServerError('')
          try {
            await auth.login(values)
            navigate('/', { replace: true })
          } catch (error: unknown) {
            setServerError('Email atau password salah. Silakan coba lagi.')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Field as={Input} id="email" name="email" type="email" placeholder="nama@email.com" />
              {touched.email && errors.email ? <p className="text-sm text-red-600">{errors.email}</p> : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link className="text-sm font-medium text-primary-700" to="/forgot-password">Lupa password?</Link>
              </div>
              <Field as={Input} id="password" name="password" type="password" placeholder="Masukkan password" />
              {touched.password && errors.password ? <p className="text-sm text-red-600">{errors.password}</p> : null}
            </div>
            {serverError ? (
              <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-700 border border-red-100 rounded-2xl bg-red-50">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{serverError}</span>
              </div>
            ) : null}
            <Button className="w-full text-sm font-semibold h-11 rounded-xl" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Memproses...' : 'Masuk'}
              {!isSubmitting ? <ArrowRight className="w-4 h-4" /> : null}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}
