<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Change password', 'Change the password for your MatterDraft Studio account.')

const {
  data: context,
  error: loadError,
  refresh,
} = useDashboardFetch('/api/portal/context', { key: 'portal-context' })
const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const busy = ref(false)
const error = ref('')
const saved = ref(false)
const unconfirmed =
  'We couldn’t confirm the change. Try signing in with your new password before trying again.'

async function changePassword() {
  if (busy.value) return
  error.value = ''
  saved.value = false
  if (newPassword.value !== confirmation.value) {
    error.value = 'The new passwords don’t match.'
    return
  }

  busy.value = true
  try {
    const result = await authClient.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true,
    })
    if (result.error) {
      if (result.error.code === 'INVALID_PASSWORD')
        error.value = 'Your current password is incorrect.'
      else if (result.error.status === 401)
        await navigateTo({ path: '/sign-in', query: { returnTo: '/portal/security' } })
      else if (result.error.status === 429) error.value = 'Too many attempts. Wait and try again.'
      else if (result.error.status >= 500) error.value = unconfirmed
      else error.value = 'We couldn’t change your password. Check the fields and try again.'
      return
    }

    currentPassword.value = ''
    newPassword.value = ''
    confirmation.value = ''
    saved.value = true
  } catch {
    error.value = unconfirmed
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <NuxtLayout
    name="portal"
    title="Change password"
    description="Update the password you use to sign in to MatterDraft Studio."
    :loading="!context && !loadError"
  >
    <div class="portal-content customer-content">
      <div v-if="loadError" role="alert" class="portal-error max-w-lg">
        {{ parseApiError(loadError).text }}
        <button type="button" class="portal-link ml-2" @click="refresh()">Try again</button>
      </div>
      <div v-else-if="context" class="portal-detail max-w-lg">
        <template v-if="saved">
          <p role="status" class="portal-notice">Your password has been changed.</p>
          <NuxtLink class="portal-link mt-5 inline-block text-sm" to="/portal"
            >Return to workspace</NuxtLink
          >
        </template>
        <FormRoot
          v-else
          class="space-y-5"
          method="post"
          :aria-busy="busy"
          @submit.prevent="changePassword"
        >
          <input
            type="hidden"
            name="username"
            autocomplete="username"
            :value="context.user.email"
          />
          <PortalAuthField
            id="current-password"
            v-model="currentPassword"
            label="Current password"
            type="password"
            name="current-password"
            autocomplete="current-password"
            maxlength="128"
            :disabled="busy"
            required
          />
          <PortalAuthField
            id="new-password"
            v-model="newPassword"
            label="New password"
            hint="Use at least 8 characters."
            type="password"
            name="new-password"
            autocomplete="new-password"
            minlength="8"
            maxlength="128"
            :disabled="busy"
            required
          />
          <PortalAuthField
            id="confirm-password"
            v-model="confirmation"
            label="Confirm new password"
            type="password"
            name="confirm-password"
            autocomplete="new-password"
            maxlength="128"
            :disabled="busy"
            required
          />
          <p class="text-sm text-studio-muted">
            Changing your password signs out your other portal sessions.
          </p>
          <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button class="portal-button" type="submit" :disabled="busy">
              {{ busy ? 'Saving…' : 'Save new password' }}
            </button>
            <NuxtLink class="portal-link text-sm" to="/forgot-password">Forgot password?</NuxtLink>
          </div>
        </FormRoot>
      </div>
    </div>
  </NuxtLayout>
</template>
