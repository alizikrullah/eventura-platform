import { useEffect, useMemo, useRef, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Camera, KeyRound, LogOut, UserRound, Coins } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'

const profileSchema = Yup.object({
  name: Yup.string().required('Nama wajib diisi'),
  phone: Yup.string().optional(),
})

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Password saat ini wajib diisi'),
  newPassword: Yup.string().min(6, 'Password baru minimal 6 karakter').required('Password baru wajib diisi'),
  confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Konfirmasi password tidak sama').required('Konfirmasi password wajib diisi'),
})

export function ProfilePage() {
  const auth = useAuth()
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [preview, setPreview] = useState<string | undefined>(auth.user?.profile_picture ?? undefined)
  const localPreviewUrlRef = useRef<string | null>(null)

  // Points state
  const [totalPoints, setTotalPoints] = useState<number>(0)

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.isAuthenticated) {
        return
      }

      setProfileError('')

      try {
        const user = await userService.getMe()
        auth.setUser(user)
        setPreview(user.profile_picture ?? undefined)
      } catch (error: unknown) {
        setProfileError(error instanceof Error ? error.message : 'Gagal memuat profil')
      }
    }

    void loadProfile()
  }, [auth.isAuthenticated, auth.setUser])

  // Fetch points
  useEffect(() => {
    if (!auth.isAuthenticated || auth.user?.role !== 'customer') {
      setTotalPoints(0)
      return
    }

    const loadPoints = async () => {
      try {
        const points = await userService.getAvailablePoints()
        setTotalPoints(points)
      } catch {
        setTotalPoints(0)
      }
    }

    void loadPoints()
  }, [auth.isAuthenticated, auth.user?.role])

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current)
      }
    }
  }, [])

  const initials = useMemo(() => {
    if (!auth.user?.name) {
      return 'EV'
    }

    return auth.user.name
      .split(' ')
      .map((chunk) => chunk[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [auth.user?.name])

  if (!auth.user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading...</div>
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary-100 shadow-md">
              <AvatarImage src={preview} alt={auth.user.name} />
              <AvatarFallback className="bg-primary-100 text-lg font-semibold text-primary-800">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">{auth.user.name}</h1>
                <Badge variant={auth.user.role === 'organizer' ? 'default' : 'secondary'}>{auth.user.role}</Badge>
              </div>
              <p className="text-sm text-slate-600">{auth.user.email}</p>
              <p className="mt-1 text-sm text-slate-500">Referral code: <span className="font-semibold text-primary-700">{auth.user.referral_code}</span></p>
            </div>
          </div>
          <Button className="rounded-xl" onClick={() => auth.logout()} type="button" variant="outline">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Points Card - hanya tampil untuk customer */}
        {auth.user.role === 'customer' && (
          <div className="flex items-center gap-4 rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(30,58,138,0.12)] backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">
              <Coins className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Poin kamu</p>
              <p className="text-2xl font-bold text-slate-900">{totalPoints.toLocaleString('id-ID')} <span className="text-base font-normal text-slate-400">poin</span></p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-400">Setara dengan</p>
              <p className="text-sm font-semibold text-primary-700">Rp {totalPoints.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[28px] border-white/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><UserRound className="h-5 w-5 text-primary-700" /> Informasi profil</CardTitle>
              <CardDescription>Update nama dan nomor telepon tanpa mengubah referral code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Formik
                enableReinitialize
                initialValues={{ name: auth.user.name, phone: auth.user.phone ?? '' }}
                validationSchema={profileSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  setProfileMessage('')
                  setProfileError('')
                  try {
                    const user = await userService.updateProfile(values)
                    auth.setUser(user)
                    setProfileMessage('Profil berhasil diperbarui')
                  } catch (error: unknown) {
                    setProfileError(error instanceof Error ? error.message : 'Gagal memperbarui profil')
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama</Label>
                      <Field as={Input} id="name" name="name" />
                      {touched.name && errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor telepon</Label>
                      <Field as={Input} id="phone" name="phone" placeholder="08xxxxxxxxxx" />
                      {touched.phone && errors.phone ? <p className="text-sm text-red-600">{errors.phone}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referral">Referral code</Label>
                      <Input disabled id="referral" value={auth.user?.referral_code ?? ''} />
                    </div>
                    {profileMessage ? <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{profileMessage}</div> : null}
                    {profileError ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div> : null}
                    <Button className="rounded-xl" disabled={isSubmitting} type="submit">{isSubmitting ? 'Menyimpan...' : 'Simpan profil'}</Button>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-white/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900"><Camera className="h-5 w-5 text-primary-700" /> Foto profil</CardTitle>
                <CardDescription>Upload foto baru dengan format gambar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  accept="image/*"
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-700 file:px-4 file:py-2 file:font-semibold file:text-white"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      return
                    }

                    setPhotoError('')
                    setPhotoMessage('')
                    setIsUploadingPhoto(true)
                    const previousPreview = preview
                    try {
                      if (localPreviewUrlRef.current) {
                        URL.revokeObjectURL(localPreviewUrlRef.current)
                        localPreviewUrlRef.current = null
                      }

                      const localPreviewUrl = URL.createObjectURL(file)
                      localPreviewUrlRef.current = localPreviewUrl

                      const formData = new FormData()
                      formData.append('photo', file)
                      setPreview(localPreviewUrl)
                      const user = await userService.updateProfilePhoto(formData)
                      auth.setUser(user)

                      if (localPreviewUrlRef.current) {
                        URL.revokeObjectURL(localPreviewUrlRef.current)
                        localPreviewUrlRef.current = null
                      }

                      setPreview(user.profile_picture ?? undefined)
                      setPhotoMessage('Foto profil berhasil diperbarui')
                    } catch (error: unknown) {
                      setPhotoError(error instanceof Error ? error.message : 'Gagal memperbarui foto profil')
                      if (localPreviewUrlRef.current) {
                        URL.revokeObjectURL(localPreviewUrlRef.current)
                        localPreviewUrlRef.current = null
                      }
                      setPreview(previousPreview)
                    } finally {
                      setIsUploadingPhoto(false)
                      event.target.value = ''
                    }
                  }}
                  disabled={isUploadingPhoto}
                  type="file"
                />
                <p className="text-xs text-slate-500">Format gambar saja, maksimal 2 MB.</p>
                {isUploadingPhoto ? <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">Mengunggah foto profil...</div> : null}
                {photoMessage ? <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{photoMessage}</div> : null}
                {photoError ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{photoError}</div> : null}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-white/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900"><KeyRound className="h-5 w-5 text-primary-700" /> Ganti password</CardTitle>
                <CardDescription>Gunakan password baru yang kuat dan mudah Anda simpan.</CardDescription>
              </CardHeader>
              <CardContent>
                <Formik
                  initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                  validationSchema={passwordSchema}
                  onSubmit={async (values, { resetForm, setSubmitting }) => {
                    setPasswordMessage('')
                    setPasswordError('')
                    try {
                      await userService.updatePassword({
                        currentPassword: values.currentPassword,
                        newPassword: values.newPassword,
                      })
                      setPasswordMessage('Password berhasil diperbarui')
                      resetForm()
                    } catch (error: unknown) {
                      setPasswordError(error instanceof Error ? error.message : 'Gagal memperbarui password')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  {({ errors, touched, isSubmitting }) => (
                    <Form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Password saat ini</Label>
                        <Field as={Input} id="currentPassword" name="currentPassword" type="password" />
                        {touched.currentPassword && errors.currentPassword ? <p className="text-sm text-red-600">{errors.currentPassword}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Password baru</Label>
                        <Field as={Input} id="newPassword" name="newPassword" type="password" />
                        {touched.newPassword && errors.newPassword ? <p className="text-sm text-red-600">{errors.newPassword}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
                        <Field as={Input} id="confirmPassword" name="confirmPassword" type="password" />
                        {touched.confirmPassword && errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword}</p> : null}
                      </div>
                      {passwordMessage ? <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{passwordMessage}</div> : null}
                      {passwordError ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</div> : null}
                      <Button className="rounded-xl" disabled={isSubmitting} type="submit">{isSubmitting ? 'Menyimpan...' : 'Perbarui password'}</Button>
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
