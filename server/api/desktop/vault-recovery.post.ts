import { auth } from '../../../lib/auth'
import { client } from '../../../lib/db'
import { applicationFailure, applicationRoute } from '../../utils/application-error'
import { readJsonBytes } from '../../utils/json-request'
import {
  admitVaultRecoveryAttempt,
  recoverVaultKey,
  saveVaultRecoveryKey,
} from '../../utils/vault-recovery'

export default applicationRoute('/api/desktop/vault-recovery', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const authorization = getHeader(event, 'authorization')
  if (!authorization || !/^Bearer [^\s,]+$/i.test(authorization)) applicationFailure(401)
  const profile = await auth.api.oauth2UserInfo({ headers: new Headers({ authorization }) })
  if (
    !('matterdraft_accounts' in profile) ||
    !Array.isArray(profile.matterdraft_accounts) ||
    typeof profile.sub !== 'string'
  )
    applicationFailure(403)

  const bytes = await readJsonBytes(event, 4096)
  let body: unknown
  try {
    body = JSON.parse(bytes.toString('utf8'))
  } catch {
    applicationFailure(400)
  } finally {
    bytes.fill(0)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) applicationFailure(400)
  const { action, accountId, vaultId, recoveryKey, password } = body as Record<string, unknown>
  if (
    typeof accountId !== 'string' ||
    !accountId ||
    accountId.length > 128 ||
    typeof vaultId !== 'string' ||
    !/^[0-9a-f]{64}$/.test(vaultId)
  )
    applicationFailure(422)
  if (!profile.matterdraft_accounts.some((account) => account?.id === accountId))
    applicationFailure(403)
  const identity = { accountId, userId: profile.sub, vaultId }

  if (action === 'save' && typeof recoveryKey === 'string' && /^[0-9a-f]{64}$/i.test(recoveryKey)) {
    await saveVaultRecoveryKey(client, identity, recoveryKey)
    return { saved: true }
  }
  if (action === 'recover' && typeof password === 'string' && password && password.length <= 128) {
    await admitVaultRecoveryAttempt(client, profile.sub)
    const context = await auth.$context
    const credential = (await context.internalAdapter.findAccounts(profile.sub)).find(
      (account) => account.providerId === 'credential',
    )
    if (
      !credential?.password ||
      !(await context.password.verify({ hash: credential.password, password }))
    )
      applicationFailure(403)
    return { recoveryKey: await recoverVaultKey(client, identity) }
  }
  applicationFailure(422)
})
