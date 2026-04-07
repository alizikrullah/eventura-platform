import { useMemo, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthShell } from '../components/layout/AuthShell'
import { authService } from '../services/authService'

const validationSchema = Yup.object({
  newPassword: Yup.string().min(6, 'Password baru minimal 6 karakter').required('Password baru wajib diisi'),
  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Konfirmasi password tidak sama').required('Konfirmasi password wajib diisi'),
})

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  return (
    <AuthShell
      eyebrow="Set New Password"
      title="Buat password baru"
      description="Masukkan password baru untuk akun Anda. Link reset hanya berlaku sementara."
      footer={<p>Kembali ke <Link className="font-semibold text-primary-700" to="/login">halaman login</Link></p>}
    >
      {!token ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Token reset password tidak ditemukan. Silakan ulangi proses forgot password.
        </div>
      ) : (
        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setMessage('')
            setErrorMessage('')
            try {
              const result = await authService.resetPassword({ token, newPassword: values.newPassword })
              setMessage(result.message)
              resetForm()
              setTimeout(() => navigate('/login', { replace: true }), 1200)
            } catch (error: unknown) {
              setErrorMessage(error instanceof Error ? error.message : 'Gagal mereset password')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password baru</Label>
                <Field as={Input} id="newPassword" name="newPassword" type="password" placeholder="Minimal 6 karakter" />
                {touched.newPassword && errors.newPassword ? <p className="text-sm text-red-600">{errors.newPassword}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
                <Field as={Input} id="confirmPassword" name="confirmPassword" type="password" placeholder="Ulangi password baru" />
                {touched.confirmPassword && errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword}</p> : null}
              </div>
              {message ? <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}
              {errorMessage ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
              <Button className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Menyimpan...' : 'Simpan password baru'}
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </AuthShell>
  )
}
