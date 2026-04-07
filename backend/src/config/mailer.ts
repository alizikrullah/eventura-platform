import nodemailer from 'nodemailer'

function createTransporter() {
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_USER
  const password = process.env.EMAIL_PASSWORD

  if (host && user && password) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    })
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  })
}

export const mailer = createTransporter()
