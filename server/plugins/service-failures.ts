import { setTimeout as delay } from 'node:timers/promises'
import { client } from '../../lib/db'
import { recordServiceFailure } from '../utils/service-failure'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, { body }) => {
    const status = body instanceof Response ? body.status : getResponseStatus(event)
    if (status < 500 || status >= 600 || !event.path.startsWith('/api/')) return
    const record = recordServiceFailure(client, status).catch(() => {
      // Failure accounting is best-effort while the database is unavailable.
    })
    await Promise.race([record, delay(500, undefined, { ref: false })])
  })
})
