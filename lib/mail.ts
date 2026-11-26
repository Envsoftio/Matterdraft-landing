import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'

type AccountEmail =
  | { kind: 'verification' | 'password-reset' | 'welcome' }
  | { kind: 'invitation' | 'ownership-transfer'; organisationName: string }

function accountEmailContent(email: AccountEmail) {
  switch (email.kind) {
    case 'verification':
      return {
        subject: 'Verify your MatterDraft email',
        preheader: 'Finish setting up your MatterDraft account.',
        heading: 'Verify your email address',
        message: 'Confirm this email address before signing in to MatterDraft Studio.',
        action: 'Verify email address',
        footer: 'If you didn’t create a MatterDraft account, you can ignore this email.',
      }
    case 'password-reset':
      return {
        subject: 'Reset your MatterDraft password',
        preheader: 'Choose a new password for your MatterDraft account.',
        heading: 'Reset your password',
        message: 'We received a request to reset the password for your MatterDraft account.',
        action: 'Choose a new password',
        footer: 'If you didn’t request a password reset, you can ignore this email.',
      }
    case 'welcome':
      return {
        subject: 'Welcome to MatterDraft Studio',
        preheader: 'Your email is verified. Open your workspace to get started.',
        heading: 'Welcome to MatterDraft Studio',
        message:
          'Your email address is verified and your account is ready. Sign in to download MatterDraft Studio and start organising case papers, making scans searchable, and building indexed court bundles on your computer.',
        action: 'Open your workspace',
        footer: 'For help getting started, open Support in your MatterDraft workspace.',
      }
    case 'invitation':
      return {
        subject: `Invitation to ${email.organisationName}`,
        preheader: 'An organisation has invited you to join MatterDraft Studio.',
        heading: 'Join an organisation',
        message: 'You’ve been invited to join this organisation in MatterDraft Studio.',
        action: 'Review invitation',
        footer: 'If you weren’t expecting this invitation, you can ignore this email.',
        organisationName: email.organisationName,
      }
    case 'ownership-transfer':
      return {
        subject: `Ownership transfer for ${email.organisationName}`,
        preheader: 'Review a request to become the owner of a MatterDraft organisation.',
        heading: 'Review ownership transfer',
        message:
          'If you accept, you’ll become the organisation’s owner and the current owner will become an admin.',
        action: 'Review transfer',
        footer: 'If you weren’t expecting this request, contact the organisation’s current owner.',
        organisationName: email.organisationName,
      }
  }
}

type AccountEmailTemplate = ReturnType<typeof accountEmailContent> & { origin: string; url: string }
let compiledTemplate: Handlebars.TemplateDelegate<AccountEmailTemplate> | undefined

async function renderAccountEmail(data: AccountEmailTemplate) {
  if (compiledTemplate) return compiledTemplate(data)

  // Load Nitro storage only when sending so the Better Auth CLI can import its config.
  const { useStorage } = await import('nitropack/runtime')
  const source = await useStorage('assets:server').getItem<string>('email/account-email.hbs')
  if (!source) throw new Error('Account email template is missing')

  const template = Handlebars.compile<AccountEmailTemplate>(source)
  const html = template(data)
  if (process.env.NODE_ENV === 'production') compiledTemplate = template
  return html
}

export async function sendAccountEmail(to: string, url: string, email: AccountEmail) {
  const password = process.env.ZEPTOMAIL_SMTP_PASSWORD?.trim()
  const from = process.env.ZEPTOMAIL_FROM?.trim()
  const useSmtp = process.env.NODE_ENV === 'production' || Boolean(password || from)
  if (useSmtp && (!password || !from)) {
    throw new Error('ZEPTOMAIL_SMTP_PASSWORD and ZEPTOMAIL_FROM are required')
  }

  const actionUrl = new URL(url)
  if (actionUrl.protocol !== 'https:' && actionUrl.protocol !== 'http:') {
    throw new Error('Account email action must be an HTTP or HTTPS URL')
  }
  const content = accountEmailContent(email)
  const { subject, heading, message, organisationName, action, footer } = content
  const html = await renderAccountEmail({ ...content, origin: actionUrl.origin, url })
  const text =
    [heading, message, organisationName, `${action}\n${url}`, footer].filter(Boolean).join('\n\n') +
    '\n'

  if (password && from) {
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
        html,
        text,
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
    JSON.stringify({ to, subject, url, html, text }),
    { mode: 0o600 },
  )
}
