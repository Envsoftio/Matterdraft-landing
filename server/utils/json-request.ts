import type { H3Event } from 'h3'
import { applicationFailure } from './application-error.ts'

export async function readJsonBytes(event: H3Event, limit: number) {
  const headers = event.node.req.headers
  const length = Number(headers['content-length'] || 0)
  if (Number.isFinite(length) && length > limit) applicationFailure(422)
  if (
    String(headers['content-type'] || '')
      .split(';')[0]
      ?.trim()
      .toLowerCase() !== 'application/json'
  )
    applicationFailure(400)

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of event.node.req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > limit) applicationFailure(422)
    chunks.push(bytes)
  }
  return Buffer.concat(chunks)
}

export async function readSameOriginJson(event: H3Event): Promise<Record<string, unknown>> {
  if (
    event.node.req.headers.origin !==
    new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin
  )
    applicationFailure(403)
  const bytes = await readJsonBytes(event, 49152)
  try {
    const input: unknown = JSON.parse(bytes.toString('utf8'))
    if (input && typeof input === 'object' && !Array.isArray(input))
      return input as Record<string, unknown>
  } catch {
    /* Invalid JSON uses the shared request error. */
  }
  applicationFailure(400)
}
