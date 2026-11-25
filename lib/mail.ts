import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import nodemailer from 'nodemailer'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function sendAccountEmail(to: string, subject: string, url: string) {
  const password = process.env.ZEPTOMAIL_SMTP_PASSWORD?.trim()
  const from = process.env.ZEPTOMAIL_FROM?.trim()
  if (process.env.NODE_ENV === 'production' || password || from) {
    if (!password || !from)
      throw new Error('ZEPTOMAIL_SMTP_PASSWORD and ZEPTOMAIL_FROM are required')

    const transport = nodemailer.createTransport({
      host: 'smtp.zeptomail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'emailapikey', pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
    try {
      await transport.sendMail({
        from: { address: from, name: 'noreply' },
        to,
        subject,
        html: `<p><a href="${escapeHtml(url)}">${escapeHtml(subject)}</a></p>`,
        text: `${subject}\n\n${url}\n`,
        headers: {
          'X-TM-OPEN-TRACK': 'false',
          'X-TM-CLICK-TRACK': 'false',
        },
      })
    } catch (error) {
      const responseCode =
        error instanceof Error && 'responseCode' in error ? error.responseCode : undefined
      if (typeof responseCode === 'number')
        throw new Error(`ZeptoMail rejected account email (SMTP ${responseCode})`)
      throw new Error('Could not send account email through ZeptoMail SMTP')
    }
    return
  }

  const directory = join(process.cwd(), '.data', 'mail-preview')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(
    join(directory, `${Date.now()}-${randomUUID()}.json`),
    JSON.stringify({ to, subject, url }),
    { mode: 0o600 },
  )
}
