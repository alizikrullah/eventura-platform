import { mailer } from '../config/mailer'

function buildResetPasswordHtml(resetUrl: string, userName: string) {
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f8fbff; padding: 32px; color: #0f172a;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; border: 1px solid #dbeafe; box-shadow: 0 18px 60px rgba(30,58,138,0.08);">
        <p style="font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 700; color: #ff6b4a; margin: 0 0 12px;">Password Reset</p>
        <h1 style="font-size: 28px; margin: 0 0 12px; color: #0f172a;">Reset password akun Eventura</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #475569; margin: 0 0 24px;">Halo ${userName}, kami menerima permintaan untuk mengganti password akun Anda. Klik tombol di bawah ini untuk membuat password baru.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: white; text-decoration: none; padding: 14px 22px; border-radius: 14px; font-weight: 700;">Reset Password</a>
        <p style="font-size: 14px; line-height: 1.7; color: #64748b; margin: 24px 0 0;">Jika tombol tidak bekerja, buka link berikut di browser Anda:</p>
        <p style="font-size: 13px; line-height: 1.7; word-break: break-all; color: #1d4ed8; margin: 8px 0 0;">${resetUrl}</p>
        <p style="font-size: 13px; line-height: 1.7; color: #64748b; margin: 24px 0 0;">Link ini berlaku selama 30 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    </div>
  `
}

export async function sendResetPasswordEmail(options: {
  to: string
  userName: string
  resetUrl: string
}) {
  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || 'Eventura <noreply@eventura.com>',
    to: options.to,
    subject: 'Reset Password Eventura',
    html: buildResetPasswordHtml(options.resetUrl, options.userName),
    text: `Halo ${options.userName}, buka link berikut untuk reset password akun Eventura Anda: ${options.resetUrl}`,
  })

  if ('message' in info && info.message) {
    console.log('[mailer] reset password email preview:', info.message.toString())
  }

  return info
}
