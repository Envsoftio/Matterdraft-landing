<script setup lang="ts">
import { FormRoot } from 'reka-ui'
import { authClient } from '~~/lib/auth-client'

definePageMeta({ layout: false })
usePrivatePageSeo('Sign in', 'Sign in to your MatterDraft Studio account.')
const route = useRoute()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const destination = computed(() => {
  const value = String(route.query.returnTo || '/portal')
  return value.startsWith('/') && !value.startsWith('//') ? value : '/portal'
})

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const result = await authClient.signIn.email({ email: email.value.trim(), password: password.value })
    if (result.error) {
      error.value = result.error.message || 'We could not sign you in. Check your details and try again.'
      return
    }
    if (!route.query.oauth_query) await navigateTo(destination.value)
  } catch {
    error.value = 'Sign-in is temporarily unavailable. Please try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <PortalAuthShell>
    <p class="portal-eyebrow">Account access</p>
    <h2 class="portal-auth-title">Sign in</h2>
    <p class="portal-auth-intro">Enter your email and password to continue.</p>
    <FormRoot class="mt-9 space-y-5" method="post" @submit.prevent="submit">
      <PortalAuthField id="email" v-model="email" label="Email address" type="email" autocomplete="email" required />
      <PortalAuthField id="password" v-model="password" label="Password" type="password" autocomplete="current-password" required>
        <NuxtLink class="portal-link text-sm" to="/forgot-password">Forgot password?</NuxtLink>
      </PortalAuthField>
      <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
      <button class="portal-button w-full" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </FormRoot>
    <p class="mt-7 text-center text-sm text-studio-muted">New to MatterDraft? <NuxtLink class="portal-link" to="/sign-up">Create an account</NuxtLink></p>
  </PortalAuthShell>
</template>
