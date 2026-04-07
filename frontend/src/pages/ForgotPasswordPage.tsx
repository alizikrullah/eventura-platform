import { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthShell } from '../components/layout/AuthShell'
import { authService } from '../services/authService'

const validationSchema = Yup.object({
  email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
})

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  return (
    <AuthShell
      eyebrow="Password Recovery"
      title="Reset password"
      description="Masukkan email akun Anda."
      footer={<p>Kembali ke <Link className="font-semibold text-primary-700" to="/login">halaman login</Link></p>}
    >
      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          setMessage('')
          setErrorMessage('')
          try {
            const result = await authService.forgotPassword(values)
            setMessage(result.message)
            resetForm()
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
              setErrorMessage(error.response?.data?.error || 'Gagal mengirim permintaan reset password')
            } else {
              setErrorMessage('Gagal mengirim permintaan reset password')
            }
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
            {message ? (
              <div className="px-4 py-3 text-sm text-green-700 border border-green-100 rounded-2xl bg-green-50">
                <div>{message}</div>
              </div>
            ) : null}
            {errorMessage ? <div className="px-4 py-3 text-sm text-red-700 border border-red-100 rounded-2xl bg-red-50">{errorMessage}</div> : null}
            <Button className="w-full text-sm font-semibold h-11 rounded-xl" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Mengirim...' : 'Kirim reset link'}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthShell>
  )
}
