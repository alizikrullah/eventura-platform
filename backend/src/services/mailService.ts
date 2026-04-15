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

function buildTransactionStatusEmailHtml(options: {
  userName: string
  eventName: string
  invoiceNumber: string
  finalPrice: number
  statusLabel: string
  tone: 'accepted' | 'rejected'
  showRollbackNote?: boolean
  message?: string
}) {
  const accent = options.tone === 'accepted' ? '#16a34a' : '#dc2626'
  const badgeBg = options.tone === 'accepted' ? '#dcfce7' : '#fee2e2'
  const badgeText = options.tone === 'accepted' ? '#166534' : '#991b1b'
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(options.finalPrice)

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f8fbff; padding: 32px; color: #0f172a;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; border: 1px solid #dbeafe; box-shadow: 0 18px 60px rgba(30,58,138,0.08);">
        <p style="font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 700; color: ${accent}; margin: 0 0 12px;">Transaction Update</p>
        <h1 style="font-size: 28px; margin: 0 0 12px; color: #0f172a;">Status transaksi Anda diperbarui</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #475569; margin: 0 0 24px;">${options.message ?? `Halo ${options.userName}, status transaksi Eventura Anda untuk event <strong>${options.eventName}</strong> telah diperbarui.`}</p>
        <div style="display: inline-block; background: ${badgeBg}; color: ${badgeText}; padding: 10px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 24px;">${options.statusLabel}</div>
        <div style="border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 20px; background: #f8fafc;">
          <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">Invoice</p>
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0f172a;">${options.invoiceNumber}</p>
          <p style="margin: 0 0 10px; font-size: 14px; color: #64748b;">Total pembayaran</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${formattedPrice}</p>
        </div>
        ${options.showRollbackNote ? '<p style="font-size: 14px; line-height: 1.7; color: #475569; margin: 24px 0 0;">Jika Anda menggunakan points, coupon, atau voucher pada transaksi ini, resource tersebut telah dikembalikan sesuai aturan sistem. Kursi event yang sempat terpakai juga telah direstore.</p>' : ''}
        <p style="font-size: 13px; line-height: 1.7; color: #64748b; margin: 24px 0 0;">Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim support Eventura.</p>
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

export async function sendTransactionAcceptedEmail(options: {
  to: string
  userName: string
  eventName: string
  invoiceNumber: string
  finalPrice: number
}) {
  return mailer.sendMail({
    from: process.env.EMAIL_FROM || 'Eventura <noreply@eventura.com>',
    to: options.to,
    subject: 'Transaksi Eventura Anda Diterima',
    html: buildTransactionStatusEmailHtml({
      ...options,
      statusLabel: 'Transaction Accepted',
      tone: 'accepted',
    }),
    text: `Halo ${options.userName}, transaksi Anda untuk event ${options.eventName} dengan invoice ${options.invoiceNumber} telah diterima. Total pembayaran: ${options.finalPrice}.`,
  })
}

export async function sendTransactionRejectedEmail(options: {
  to: string
  userName: string
  eventName: string
  invoiceNumber: string
  finalPrice: number
  failureType?: 'canceled' | 'expired'
}) {
  const failureType = options.failureType ?? 'canceled'
  const subject = failureType === 'expired'
    ? 'Pembayaran Eventura Anda Kedaluwarsa'
    : 'Transaksi Eventura Anda Dibatalkan'
  const statusLabel = failureType === 'expired'
    ? 'Payment Expired'
    : 'Transaction Canceled'
  const message = failureType === 'expired'
    ? `Halo ${options.userName}, batas waktu pembayaran Eventura Anda untuk event <strong>${options.eventName}</strong> telah berakhir sehingga transaksi dinyatakan kedaluwarsa.`
    : `Halo ${options.userName}, transaksi Eventura Anda untuk event <strong>${options.eventName}</strong> telah dibatalkan sebelum pembayaran berhasil dikonfirmasi.`
  const text = failureType === 'expired'
    ? `Halo ${options.userName}, pembayaran Anda untuk event ${options.eventName} dengan invoice ${options.invoiceNumber} telah kedaluwarsa. Resource seperti kursi, points, coupon, dan voucher yang terpakai telah dikembalikan sesuai aturan.`
    : `Halo ${options.userName}, transaksi Anda untuk event ${options.eventName} dengan invoice ${options.invoiceNumber} telah dibatalkan. Resource seperti kursi, points, coupon, dan voucher yang terpakai telah dikembalikan sesuai aturan.`

  return mailer.sendMail({
    from: process.env.EMAIL_FROM || 'Eventura <noreply@eventura.com>',
    to: options.to,
    subject,
    html: buildTransactionStatusEmailHtml({
      ...options,
      statusLabel,
      tone: 'rejected',
      showRollbackNote: true,
      message,
    }),
    text,
  })
}
