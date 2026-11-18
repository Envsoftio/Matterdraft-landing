import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import nodemailer from 'nodemailer'

export async function sendAccountEmail(to: string, subject: string, url: string) {
  const host = process.env.SMTP_HOST
  if (host) {
    if (!process.env.SMTP_FROM) throw new Error('SMTP_FROM is required when SMTP_HOST is set')
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
    })
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: `${subject}\n\n${url}\n`,
    })
    return
  }

  if (process.env.NODE_ENV === 'production')
    throw new Error('SMTP is required for production account email')
  const directory = join(process.cwd(), '.data', 'mail-preview')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(
    join(directory, `${Date.now()}-${randomUUID()}.json`),
    JSON.stringify({ to, subject, url }),
    { mode: 0o600 },
  )
}
