<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
usePrivatePageSeo(
  'Reset password',
  'Request a password reset email for your MatterDraft Studio account.',
)
const email = ref('')
const busy = ref(false)
const sent = ref(false)
const error = ref('')
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await authClient.requestPasswordReset({
      email: email.value.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (result.error) error.value = 'We could not request a reset link. Please try again later.'
    else sent.value = true
  } catch {
    error.value = 'We could not request a reset link. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">Account recovery</p>
    <h2 class="portal-auth-title">Reset your password</h2>
    <p class="portal-auth-intro">
      Enter your email and we’ll send a reset link if an account exists.
    </p>
    <p v-if="sent" role="status" class="portal-notice mt-8">
      If this address has an account, a reset link has been sent.
    </p>
    <FormRoot v-else class="mt-8 space-y-5" method="post" @submit.prevent="submit">
      <PortalAuthField
        id="email"
        v-model="email"
        label="Email address"
        type="email"
        autocomplete="email"
        required
      />
      <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
      <button class="portal-button w-full" type="submit" :disabled="busy">
        {{ busy ? 'Requesting…' : 'Send reset link' }}
      </button>
    </FormRoot>
    <NuxtLink class="portal-link mt-6 inline-block" to="/sign-in">Return to sign in</NuxtLink>
  </PortalAuthShell>
</template>
