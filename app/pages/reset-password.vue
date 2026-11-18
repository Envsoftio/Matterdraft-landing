<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
usePrivatePageSeo('Choose password', 'Set a new password for your MatterDraft Studio account.')
const token = String(useRoute().query.token || '')
const password = ref('')
const busy = ref(false)
const error = ref('')
const done = ref(false)
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await authClient.resetPassword({ newPassword: password.value, token })
    if (result.error) error.value = 'This link could not be used. Request a new one.'
    else done.value = true
  } catch {
    error.value =
      'The result could not be confirmed. Try signing in with your new password before requesting another link.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">Account recovery</p>
    <h2 class="portal-auth-title">Choose a new password</h2>
    <p v-if="!token" role="alert" class="portal-error mt-7">
      This reset link is incomplete. Request a new link.
    </p>
    <p v-else-if="done" role="status" class="portal-notice mt-7">
      Your password has been changed.
      <NuxtLink class="portal-link" to="/sign-in">Sign in</NuxtLink>.
    </p>
    <FormRoot v-else class="mt-8 space-y-5" method="post" @submit.prevent="submit">
      <PortalAuthField
        id="password"
        v-model="password"
        label="New password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
      />
      <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
      <button class="portal-button w-full" type="submit" :disabled="busy">Save new password</button>
    </FormRoot>
    <NuxtLink class="portal-link mt-6 inline-block" to="/forgot-password"
      >Request another link</NuxtLink
    >
  </PortalAuthShell>
</template>
