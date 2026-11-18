import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { client } from '../../../lib/db'
import { sendAccountEmail } from '../../../lib/mail'
import { requireAccount, requireUser, type AccountRole } from '../../utils/customer-account'

const inviteMs = 7 * 24 * 60 * 60 * 1000
const recentMs = 10 * 60 * 1000
const fail = (statusCode: number, _message: string): never => applicationFailure(statusCode)
const hash = (token: string) => createHash('sha256').update(token).digest('hex')
const emailOf = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const nameOf = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const validId = (value: string) => /^[0-9a-f-]{36}$/.test(value)
const validUserId = (value: string) => /^[A-Za-z0-9_-]{16,128}$/.test(value)
const roles = ['owner', 'admin', 'billing_manager', 'member'] as const
const roleOf = (value: unknown): AccountRole =>
  roles.includes(value as AccountRole) ? (value as AccountRole) : fail(422, 'Choose a valid role')
const audit = (
  tx: Awaited<ReturnType<typeof client.transaction>>,
  actorUserId: string,
  accountId: string,
  eventType: string,
  subjectType: string,
  subjectId: string,
  eventDetail: string,
) =>
  tx.execute({
    sql: 'INSERT INTO audit_event (id, account_id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      randomUUID(),
      accountId,
      actorUserId,
      eventType,
      subjectType,
      subjectId,
      eventDetail,
      Date.now(),
    ],
  })
const recent = (session: Awaited<ReturnType<typeof requireUser>>) => {
  const value = session.session.createdAt
  if (Date.now() - new Date(value).getTime() > recentMs)
    fail(403, 'Sign in again before transferring ownership')
}
const canManage = (role: AccountRole) => role === 'owner' || role === 'admin'
const currentRole = async (
  tx: Awaited<ReturnType<typeof client.transaction>>,
  accountId: string,
  userId: string,
): Promise<AccountRole> => {
  const row = await tx.execute({
    sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
    args: [accountId, userId],
  })
  if (!row.rows[0]) fail(403, 'Your membership changed; refresh and try again')
  return String(row.rows[0]!.role) as AccountRole
}
const canAssign = (actor: AccountRole, next: AccountRole) =>
  actor === 'owner' || (actor === 'admin' && next === 'member')
const sameOrigin = (event: Parameters<typeof getRequestURL>[0]) => {
  const origin = getHeader(event, 'origin')
  if (!origin || origin !== new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin)
    fail(403, 'Please refresh the page and try again')
}

export default applicationRoute('/api/membership/[...path]', async (event) => {
  const parts = String(event.context.params?.path || '')
    .split('/')
    .filter(Boolean)
  const method = getMethod(event)
  if (method !== 'GET') sameOrigin(event)
  const rawBody =
    method === 'GET'
      ? {}
      : await readBody<Record<string, unknown>>(event).catch(() =>
          fail(400, 'We could not read your request. Try again'),
        )
  const body: Record<string, unknown> =
    rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody) ? rawBody : {}
  const [resource = '', id = '', action = '', target = ''] = parts
  const now = Date.now()

  if (resource === 'organisations' && parts.length === 1 && method === 'POST') {
    const session = await requireUser(event)
    const name = nameOf(body.name)
    if (name.length < 2 || name.length > 100)
      fail(422, 'Organisation name must be 2 to 100 characters')
    const accountId = randomUUID()
    const tx = await client.transaction('write')
    try {
      const creations = await tx.execute({
        sql: "SELECT COUNT(*) AS n FROM audit_event WHERE actor_user_id = ? AND event_type = 'organisation.created' AND created_at > ?",
        args: [session.user.id, now - 86400000],
      })
      if (Number(creations.rows[0]?.n) >= 10)
        fail(429, 'Organisation creation limit reached; try again tomorrow')
      await tx.execute({
        sql: 'INSERT INTO customer_account (id, account_type, name, created_at) VALUES (?, ?, ?, ?)',
        args: [accountId, 'organisation', name, now],
      })
      await tx.execute({
        sql: 'INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
        args: [accountId, session.user.id, 'owner', now],
      })
      await audit(
        tx,
        session.user.id,
        accountId,
        'organisation.created',
        'account',
        accountId,
        'Created organisation',
      )
      await tx.commit()
    } catch (error) {
      await tx.rollback()
      throw error
    }
    return { accountId }
  }

  if (
    resource === 'invitations' &&
    id &&
    parts.length === 2 &&
    (method === 'GET' || method === 'POST')
  ) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(id)) fail(404, 'Invitation not found')
    const session = await requireUser(event)
    const tx = method === 'POST' ? await client.transaction('write') : null
    try {
      const db = tx || client
      const found = await db.execute({
        sql: `SELECT i.*, a.name AS account_name FROM organisation_invitation i JOIN customer_account a ON a.id = i.account_id WHERE i.token_hash = ? LIMIT 1`,
        args: [hash(id)],
      })
      const row = found.rows[0]
      if (!row || emailOf(row.invitee_email) !== emailOf(session.user.email))
        fail(404, 'Invitation not found for this verified email')
      const invitation = row!
      const state =
        String(invitation.invitation_status) === 'pending' && Number(invitation.expires_at) <= now
          ? 'expired'
          : String(invitation.invitation_status)
      if (method === 'GET')
        return {
          accountName: String(invitation.account_name),
          accountId: String(invitation.account_id),
          inviteeEmail: String(invitation.invitee_email),
          invitedRole: String(invitation.invited_role),
          invitationType: String(invitation.invitation_type),
          invitationStatus: state,
          expiresAt: Number(invitation.expires_at),
        }
      if (state === 'accepted' && invitation.accepted_by_user_id === session.user.id) {
        await tx!.commit()
        return {
          accountId: String(invitation.account_id),
          invitationStatus: 'accepted',
          invitationType: String(invitation.invitation_type),
        }
      }
      if (state !== 'pending')
        fail(
          409,
          state === 'expired'
            ? 'This invitation has expired'
            : 'This invitation is no longer available',
        )
      if (invitation.invitation_type === 'transfer') {
        recent(session)
        if (invitation.transfer_recipient_user_id !== session.user.id)
          fail(403, 'Ownership transfer recipient changed')
        const current = await tx!.execute({
          sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
          args: [String(invitation.account_id), session.user.id],
        })
        const outgoing = await tx!.execute({
          sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
          args: [String(invitation.account_id), String(invitation.invited_by_user_id)],
        })
        if (!current.rows[0] || outgoing.rows[0]?.role !== 'owner')
          fail(409, 'Membership changed; request a new transfer')
        await tx!.execute({
          sql: "UPDATE account_membership SET role = 'owner' WHERE account_id = ? AND user_id = ?",
          args: [String(invitation.account_id), session.user.id],
        })
        await tx!.execute({
          sql: "UPDATE account_membership SET role = 'admin' WHERE account_id = ? AND user_id = ?",
          args: [String(invitation.account_id), String(invitation.invited_by_user_id)],
        })
        await audit(
          tx!,
          session.user.id,
          String(invitation.account_id),
          'ownership.transferred',
          'user',
          session.user.id,
          `Previous owner ${invitation.invited_by_user_id} became admin`,
        )
      } else {
        const inviter = await tx!.execute({
          sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
          args: [String(invitation.account_id), String(invitation.invited_by_user_id)],
        })
        if (
          !inviter.rows[0] ||
          !canAssign(inviter.rows[0].role as AccountRole, invitation.invited_role as AccountRole)
        )
          fail(409, 'Inviter authority changed; request a new invitation')
        const member = await tx!.execute({
          sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
          args: [String(invitation.account_id), session.user.id],
        })
        if (member.rows[0]) fail(409, 'You are already a member of this organisation')
        await tx!.execute({
          sql: 'INSERT INTO account_membership (account_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
          args: [
            String(invitation.account_id),
            session.user.id,
            String(invitation.invited_role),
            now,
          ],
        })
        await audit(
          tx!,
          session.user.id,
          String(invitation.account_id),
          'invitation.accepted',
          'user',
          session.user.id,
          `Role ${invitation.invited_role}`,
        )
      }
      await tx!.execute({
        sql: "UPDATE organisation_invitation SET invitation_status = 'accepted', accepted_by_user_id = ?, accepted_at = ? WHERE id = ?",
        args: [session.user.id, now, String(invitation.id)],
      })
      await tx!.commit()
      return {
        accountId: String(invitation.account_id),
        invitationStatus: 'accepted',
        invitationType: String(invitation.invitation_type),
      }
    } catch (error) {
      if (tx) await tx.rollback()
      throw error
    }
  }

  if (resource === 'accounts' && validId(id || '')) {
    const { user, account } = await requireAccount(event, id)
    if (account.accountType !== 'organisation') fail(404, 'Organisation not found')
    if (action === 'members' && parts.length === 3 && method === 'GET') {
      if (!canManage(account.role)) fail(403, 'Membership access denied')
      const [members, invitations] = await Promise.all([
        client.execute({
          sql: "SELECT m.user_id, m.role, m.created_at, u.name, u.email FROM account_membership m JOIN user u ON u.id = m.user_id WHERE m.account_id = ? ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.name",
          args: [id],
        }),
        client.execute({
          sql: "SELECT id, invitee_email, invited_role, invitation_type, invitation_status, created_at, expires_at FROM organisation_invitation WHERE account_id = ? AND invitation_status = 'pending' ORDER BY created_at DESC",
          args: [id],
        }),
      ])
      return {
        account,
        members: members.rows,
        invitations: invitations.rows.map((row) => ({
          ...row,
          invitation_status: Number(row.expires_at) <= now ? 'expired' : row.invitation_status,
        })),
        allowedInviteRoles:
          account.role === 'owner' ? ['admin', 'billing_manager', 'member'] : ['member'],
      }
    }
    if (action === 'audit' && parts.length === 3 && method === 'GET') {
      if (!canManage(account.role)) fail(403, 'Activity access denied')
      const result = await client.execute({
        sql: "SELECT event_type, subject_type, subject_id, created_at, actor_user_id FROM audit_event WHERE account_id = ? AND event_type IN ('organisation.created','invitation.created','invitation.revoked','invitation.reissued','invitation.accepted','membership.role_changed','membership.removed','ownership.transfer_requested','ownership.transferred') ORDER BY created_at DESC LIMIT 100",
        args: [id],
      })
      return { events: result.rows }
    }
    if (action === 'invitations' && parts.length === 3 && method === 'POST') {
      if (!canManage(account.role)) fail(403, 'Invitation access denied')
      const email = emailOf(body.email)
      const role = roleOf(body.role)
      if (!isEmail(email) || role === 'owner' || !canAssign(account.role, role))
        fail(422, 'Email or role is not allowed')
      if (role === 'admin' || role === 'billing_manager') recent(await requireUser(event))
      const token = randomBytes(32).toString('base64url')
      const invitationId = randomUUID()
      const tx = await client.transaction('write')
      try {
        if (!canAssign(await currentRole(tx, id, user.id), role))
          fail(403, 'Invitation access changed')
        const count = await tx.execute({
          sql: 'SELECT COUNT(*) AS n FROM organisation_invitation WHERE invited_by_user_id = ? AND created_at > ?',
          args: [user.id, now - 86400000],
        })
        if (Number(count.rows[0]?.n) >= 20)
          fail(429, 'Invitation limit reached; try again tomorrow')
        const existing = await tx.execute({
          sql: "SELECT 1 FROM organisation_invitation WHERE account_id = ? AND invitee_email = ? AND invitation_status = 'pending' AND expires_at > ?",
          args: [id, email, now],
        })
        if (existing.rows.length) fail(409, 'An invitation is already pending for this address')
        const member = await tx.execute({
          sql: 'SELECT 1 FROM account_membership m JOIN user u ON u.id = m.user_id WHERE m.account_id = ? AND lower(u.email) = ?',
          args: [id, email],
        })
        if (member.rows.length) fail(409, 'This person is already a member')
        await tx.execute({
          sql: "INSERT INTO organisation_invitation (id, account_id, invitee_email, invited_role, invitation_type, token_hash, invitation_status, invited_by_user_id, created_at, expires_at) VALUES (?, ?, ?, ?, 'member', ?, 'pending', ?, ?, ?)",
          args: [invitationId, id, email, role, hash(token), user.id, now, now + inviteMs],
        })
        await audit(
          tx,
          user.id,
          id,
          'invitation.created',
          'invitation',
          invitationId,
          `Invited ${email} as ${role}`,
        )
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
      let delivery: 'sent' | 'failed' = 'sent'
      try {
        await sendAccountEmail(
          email,
          `Invitation to ${account.name}`,
          `${new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin}/invite/${token}`,
        )
      } catch {
        delivery = 'failed'
      }
      return { invitationId, expiresAt: now + inviteMs, delivery }
    }
    if (action === 'invitations' && target && parts[4] === 'revoke' && method === 'POST') {
      if (!canManage(account.role)) fail(403, 'Invitation access denied')
      const tx = await client.transaction('write')
      try {
        const freshRole = await currentRole(tx, id, user.id)
        if (!canManage(freshRole)) fail(403, 'Invitation access changed')
        const row = await tx.execute({
          sql: 'SELECT invitation_type, invitation_status FROM organisation_invitation WHERE id = ? AND account_id = ?',
          args: [target, id],
        })
        if (
          !row.rows[0] ||
          row.rows[0].invitation_status !== 'pending' ||
          (row.rows[0].invitation_type === 'transfer' && freshRole !== 'owner')
        )
          fail(404, 'Pending invitation not found')
        await tx.execute({
          sql: "UPDATE organisation_invitation SET invitation_status = 'revoked', revoked_at = ? WHERE id = ?",
          args: [now, target],
        })
        await audit(
          tx,
          user.id,
          id,
          'invitation.revoked',
          'invitation',
          target,
          'Revoked invitation',
        )
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
      return { status: 'revoked' }
    }
    if (
      action === 'members' &&
      target &&
      parts.length === 4 &&
      (method === 'PATCH' || method === 'DELETE')
    ) {
      if (!canManage(account.role)) fail(403, 'Membership access denied')
      const nextRole = method === 'PATCH' ? roleOf(body.role) : null
      if (nextRole && (nextRole === 'owner' || !canAssign(account.role, nextRole)))
        fail(403, 'This role cannot be assigned')
      if (nextRole === 'admin' || nextRole === 'billing_manager') recent(await requireUser(event))
      const tx = await client.transaction('write')
      try {
        const freshRole = await currentRole(tx, id, user.id)
        if (!canManage(freshRole) || (nextRole && !canAssign(freshRole, nextRole)))
          fail(403, 'Membership access changed')
        const existing = await tx.execute({
          sql: 'SELECT role FROM account_membership WHERE account_id = ? AND user_id = ?',
          args: [id, target],
        })
        const oldRole = existing.rows[0]?.role
        if (!oldRole) fail(404, 'Member not found')
        if (freshRole === 'admin' && oldRole !== 'member')
          fail(403, 'Admins can manage members only')
        if (oldRole === 'owner' && nextRole !== 'owner') {
          recent(await requireUser(event))
          const owners = await tx.execute({
            sql: "SELECT COUNT(*) AS n FROM account_membership WHERE account_id = ? AND role = 'owner'",
            args: [id],
          })
          if (Number(owners.rows[0]?.n) <= 1)
            fail(409, 'This organisation needs an owner. Transfer ownership first')
        }
        if (method === 'DELETE')
          await tx.execute({
            sql: 'DELETE FROM account_membership WHERE account_id = ? AND user_id = ?',
            args: [id, target],
          })
        else if (nextRole !== oldRole)
          await tx.execute({
            sql: 'UPDATE account_membership SET role = ? WHERE account_id = ? AND user_id = ?',
            args: [nextRole, id, target],
          })
        await audit(
          tx,
          user.id,
          id,
          method === 'DELETE' ? 'membership.removed' : 'membership.role_changed',
          'user',
          target,
          `${oldRole} → ${nextRole || 'removed'}`,
        )
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
      return { status: method === 'DELETE' ? 'removed' : 'updated' }
    }
    if (action === 'transfers' && parts.length === 3 && method === 'POST') {
      if (account.role !== 'owner') fail(403, 'Only owners can transfer ownership')
      recent(await requireUser(event))
      const targetUserId = String(body.userId || '')
      if (!validUserId(targetUserId) || targetUserId === user.id)
        fail(422, 'Choose another verified member')
      const token = randomBytes(32).toString('base64url')
      const invitationId = randomUUID()
      const tx = await client.transaction('write')
      let email = ''
      try {
        if ((await currentRole(tx, id, user.id)) !== 'owner') fail(403, 'Ownership access changed')
        const targetMember = await tx.execute({
          sql: 'SELECT u.email, m.role FROM account_membership m JOIN user u ON u.id = m.user_id WHERE m.account_id = ? AND m.user_id = ? AND u.email_verified = 1',
          args: [id, targetUserId],
        })
        if (!targetMember.rows[0] || targetMember.rows[0].role === 'owner')
          fail(422, 'Choose a verified non-owner member')
        email = String(targetMember.rows[0]!.email)
        const existing = await tx.execute({
          sql: "SELECT 1 FROM organisation_invitation WHERE account_id = ? AND invitation_type = 'transfer' AND invitation_status = 'pending' AND expires_at > ?",
          args: [id, now],
        })
        if (existing.rows.length) fail(409, 'An ownership transfer is already pending')
        await tx.execute({
          sql: "INSERT INTO organisation_invitation (id, account_id, invitee_email, invited_role, invitation_type, token_hash, invitation_status, invited_by_user_id, transfer_recipient_user_id, created_at, expires_at) VALUES (?, ?, ?, 'owner', 'transfer', ?, 'pending', ?, ?, ?, ?)",
          args: [
            invitationId,
            id,
            emailOf(email),
            hash(token),
            user.id,
            targetUserId,
            now,
            now + inviteMs,
          ],
        })
        await audit(
          tx,
          user.id,
          id,
          'ownership.transfer_requested',
          'user',
          targetUserId,
          'Recipient becomes owner; initiating owner becomes admin after acceptance',
        )
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
      let delivery: 'sent' | 'failed' = 'sent'
      try {
        await sendAccountEmail(
          email,
          `Ownership transfer for ${account.name}`,
          `${new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin}/invite/${token}`,
        )
      } catch {
        delivery = 'failed'
      }
      return { invitationId, expiresAt: now + inviteMs, delivery }
    }
  }

  fail(404, 'Page not found')
})
