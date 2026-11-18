<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'

definePageMeta({ layout: false })
usePrivatePageSeo('Verify email', 'Verify the email address on your MatterDraft Studio account.')
const email = ref(String(useRoute().query.email || ''))
const busy = ref(false)
const message = ref('')
const error = ref('')
async function resend() {
  if (busy.value) return
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    const result = await authClient.sendVerificationEmail({
      email: email.value.trim(),
      callbackURL: '/sign-in',
    })
    if (result.error)
      error.value = 'We could not request a verification link. Please try again later.'
    else message.value = 'If this address has an account, a verification link has been sent.'
  } catch {
    error.value = 'We could not request a verification link. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">One more step</p>
    <h2 class="portal-auth-title">Verify your email</h2>
    <p class="portal-auth-intro">
      Open the verification link sent to {{ email || 'your email address' }}. Then sign in.
    </p>
    <p v-if="message" role="status" class="portal-notice mt-7">{{ message }}</p>
    <p v-if="error" role="alert" class="portal-error mt-7">{{ error }}</p>
    <FormRoot class="mt-8 space-y-5" method="post" @submit.prevent="resend">
      <PortalAuthField
        id="email"
        v-model="email"
        label="Email address"
        type="email"
        autocomplete="email"
        required
      />
      <button class="portal-button w-full" type="submit" :disabled="busy">
        Resend verification link
      </button>
    </FormRoot>
    <NuxtLink class="portal-link mt-6 inline-block" to="/sign-in">Return to sign in</NuxtLink>
  </PortalAuthShell>
</template>
