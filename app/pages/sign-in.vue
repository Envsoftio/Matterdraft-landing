<script setup lang="ts">
import { ArrowRight, LockKeyhole, Mail, PanelsTopLeft } from '@lucide/vue'
import { FormRoot } from 'reka-ui'
import { authClient, desktopSignInClient } from '~~/lib/auth-client'
import { authReturnTo } from '~/utils/auth-return-to'

definePageMeta({ layout: false })
usePrivatePageSeo('Sign in', 'Sign in to your MatterDraft Studio account.')
const route = useRoute()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const returnTo = computed(() => authReturnTo(route.query.returnTo))
const signUpQuery = computed(() => (route.query.sig ? route.query : { returnTo: returnTo.value }))

interface DesktopRequest {
  clientId: string
  state: string
  redirectUri: string
  signed: string
  freshLogin: boolean
}

const { data: desktopRequest, pending: checkingDesktop } = await useFetch(
  '/api/portal/desktop-sign-in',
  { query: computed(() => route.query), immediate: Boolean(route.query.sig) },
)
const desktop = computed(() => {
  const request = desktopRequest.value?.desktop
  return request?.freshLogin ? request : null
})

async function openDesktop(start: DesktopRequest, continuation: string) {
  const next = new URL(continuation, window.location.origin)
  if (next.origin !== window.location.origin || next.pathname !== '/consent')
    throw new Error('Invalid desktop sign-in continuation')
  const { desktop: continued } = await $fetch<{ desktop: DesktopRequest | null }>(
    '/api/portal/desktop-sign-in' + next.search,
  )
  if (
    !continued ||
    (['clientId', 'state', 'redirectUri'] as const).some((key) => continued[key] !== start[key])
  )
    throw new Error('Desktop sign-in request changed')
  const approval = await desktopSignInClient.oauth2.consent({
    accept: true,
    oauth_query: continued.signed,
  })
  if (approval.error || !approval.data?.url) throw new Error('Unable to complete desktop sign-in')
  const callback = new URL(approval.data.url)
  if (
    callback.protocol + callback.pathname !== start.redirectUri ||
    callback.host ||
    callback.username ||
    callback.password ||
    callback.hash ||
    callback.searchParams.get('state') !== start.state ||
    !callback.searchParams.get('code')
  )
    throw new Error('Invalid desktop callback')
  window.location.assign(callback.href)
}

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const request = desktop.value
    const signIn = request ? desktopSignInClient : authClient
    const result = await signIn.signIn.email({
      email: email.value.trim(),
      password: password.value,
    })
    if (result.error) {
      error.value =
        result.error.message || 'We could not sign you in. Check your details and try again.'
      return
    }
    if (request) {
      if (!result.data?.url) throw new Error('Missing desktop sign-in continuation')
      await openDesktop(request, result.data.url)
      return
    }
    if (!result.data?.redirect && !route.query.sig) await navigateTo(returnTo.value || '/portal')
  } catch {
    error.value = desktop.value
      ? 'We could not open MatterDraft. Return to the desktop app and start sign-in again.'
      : 'Sign-in is temporarily unavailable. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="sign-in">
    <section class="sign-in-panel" aria-labelledby="sign-in-heading">
      <header class="sign-in-toolbar">
        <NuxtLink to="/" class="sign-in-brand mobile-brand"><BrandLogo /></NuxtLink>
        <ThemeToggle />
      </header>
      <div class="sign-in-content">
        <span class="sign-in-mark" aria-hidden="true"><PanelsTopLeft :size="23" /></span>
        <p class="sign-in-eyebrow">Your legal workspace</p>
        <h1 id="sign-in-heading">Welcome back.</h1>
        <p class="sign-in-description">
          {{
            desktop
              ? 'Sign in with your dashboard account to open the MatterDraft desktop app.'
              : 'Sign in to continue preparing, organizing, and managing your legal documents.'
          }}
        </p>
        <FormRoot class="sign-in-form" method="post" @submit.prevent="submit">
          <PortalAuthField
            id="email"
            v-model="email"
            label="Email address"
            name="email"
            type="email"
            autocomplete="username"
            inputmode="email"
            spellcheck="false"
            placeholder="name@lawfirm.com"
            required
          >
            <template #icon><Mail :size="18" /></template>
          </PortalAuthField>
          <PortalAuthField
            id="password"
            v-model="password"
            label="Password"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            required
          >
            <NuxtLink class="portal-link" to="/forgot-password">Forgot password?</NuxtLink>
            <template #icon><LockKeyhole :size="18" /></template>
          </PortalAuthField>
          <p v-if="error" role="alert" class="portal-error">{{ error }}</p>
          <button
            class="portal-button sign-in-button"
            type="submit"
            :disabled="busy || (Boolean(route.query.sig) && checkingDesktop)"
            :aria-busy="busy"
          >
            {{ busy ? 'Signing in…' : 'Sign in' }}
            <ArrowRight v-if="!busy" :size="17" aria-hidden="true" />
          </button>
        </FormRoot>
        <p class="sign-in-register">
          New to MatterDraft?
          <NuxtLink class="portal-link" :to="{ path: '/sign-up', query: signUpQuery }">
            Create an account
          </NuxtLink>
        </p>
      </div>
      <footer class="sign-in-footer">
        <strong>MatterDraft Studio</strong><span aria-hidden="true">·</span>
        <span>Legal document workspace</span>
      </footer>
    </section>
    <section class="sign-in-intro" aria-labelledby="sign-in-product-heading">
      <div class="sign-in-intro-inner">
        <NuxtLink to="/" class="sign-in-brand"><BrandLogo /></NuxtLink>
        <div>
          <p class="sign-in-eyebrow">The modern legal workspace</p>
          <h2 id="sign-in-product-heading">
            From scattered documents to <span>court-ready bundles.</span>
          </h2>
          <p class="sign-in-product-description">
            Organize case documents, build structured legal bundles, and automate pagination,
            indexing, and bookmarks in one workspace.
          </p>
        </div>
        <PortalSignInWorkflow />
      </div>
    </section>
  </main>
</template>

<style scoped src="../assets/css/sign-in.css"></style>
