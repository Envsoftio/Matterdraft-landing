<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'

definePageMeta({ layout: false })
usePrivatePageSeo('Create account', 'Create a MatterDraft Studio account with your email address.')
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const result = await authClient.signUp.email({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    if (result.error) {
      error.value = result.error.message || 'We could not create your account.'
      return
    }
    await navigateTo({ path: '/verify-email', query: { email: email.value.trim() } })
  } catch {
    error.value = 'Account creation is temporarily unavailable. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">Get started</p>
    <h2 class="portal-auth-title">Create your account</h2>
    <p class="portal-auth-intro">Create an account to manage your organisations and invitations.</p>
    <FormRoot class="mt-9 space-y-5" method="post" @submit.prevent="submit">
      <PortalAuthField id="name" v-model="name" label="Full name" autocomplete="name" required />
      <PortalAuthField
        id="email"
        v-model="email"
        label="Email address"
        type="email"
        autocomplete="email"
        required
      />
      <PortalAuthField
        id="password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        hint="Use at least 8 characters."
        required
      />
      <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
      <button class="portal-button w-full" type="submit" :disabled="busy">
        {{ busy ? 'Creating account…' : 'Create account' }}
      </button>
    </FormRoot>
    <p class="mt-7 text-center text-sm text-studio-muted">
      Already have an account? <NuxtLink class="portal-link" to="/sign-in">Sign in</NuxtLink>
    </p>
  </PortalAuthShell>
</template>
