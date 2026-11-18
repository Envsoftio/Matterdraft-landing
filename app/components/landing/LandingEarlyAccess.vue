<script setup lang="ts">
import {
  CheckboxIndicator,
  CheckboxRoot,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FormRoot,
} from 'reka-ui'
import { ArrowRight, Check, Star } from '@lucide/vue'
const roles = [
  'Advocate',
  'Barrister or solicitor',
  'Law firm or chambers team',
  'Paralegal or legal operations',
  'Other',
]
const endpoint = '/.netlify/functions/early-access'
const initiallyEnabled = useRuntimeConfig().public.earlyAccessEnabled
const { data: availability } = useFetch<{ enabled: boolean }>(endpoint, { server: false, retry: 0 })
const enabled = computed(() => availability.value?.enabled ?? initiallyEnabled)
const form = reactive({ name: '', email: '', role: '', platform: '', contactConsent: false, website: '' })
const pending = ref(false)
const submitted = ref(false)
const errorMessage = ref('')
const submissionStatus = useTemplateRef('submissionStatus')

async function submitEarlyAccess() {
  if (pending.value || !enabled.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const receipt = await $fetch<{ success: boolean }>(endpoint, {
      method: 'POST',
      body: { ...form, name: form.name.trim(), email: form.email.trim() },
      retry: 0,
    })
    if (receipt?.success !== true) throw new Error('Signup was not confirmed')
    submitted.value = true
    await nextTick()
    submissionStatus.value?.focus()
  } catch {
    errorMessage.value = 'We could not save your request. Please try again later.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section id="early-access" class="studio-section alt signup-section" aria-labelledby="early-access-title">
    <div class="signup-inner">
      <div class="signup-copy" data-enter>
        <h2 id="early-access-title">Get early access to MatterDraft</h2>
        <p>Join the list for launch updates and an invitation when access becomes available.</p>
        <div class="signup-benefit">
          <span class="icon-tile" aria-hidden="true"><Star /></span>
          <div>
            <h3>One month free after launch</h3>
            <p>Sign up during the preview. No payment details required.</p>
          </div>
        </div>
      </div>

      <div class="signup-card" data-enter>
        <div v-if="submitted" ref="submissionStatus" class="signup-status" role="status" tabindex="-1">
          <span class="icon-tile" aria-hidden="true"><Check /></span>
          <h3>You’re on the list.</h3>
          <p>We’ll email you about early access and launch.</p>
        </div>
        <template v-else>
          <header>
            <h3 id="early-access-form-title">Early access registration</h3>
            <p>{{ enabled ? 'Share your details to join the list.' : 'Registration isn’t open yet.' }}</p>
          </header>
          <FormRoot v-if="enabled" method="post" aria-labelledby="early-access-form-title" @submit.prevent="submitEarlyAccess">
            <div class="signup-fields">
              <FieldRoot class="signup-field-full" name="name" required :disabled="pending">
                <FieldLabel for="early-access-name">Full name</FieldLabel>
                <FieldControl id="early-access-name" v-model="form.name" autocomplete="name" maxlength="120" />
                <FieldError class="signup-field-error">Enter your full name.</FieldError>
              </FieldRoot>

              <FieldRoot class="signup-field-full" name="email" required :disabled="pending">
                <FieldLabel for="early-access-email">Work email</FieldLabel>
                <FieldControl id="early-access-email" v-model="form.email" type="email" autocomplete="email" maxlength="254" />
                <FieldError class="signup-field-error">Enter a valid work email address.</FieldError>
              </FieldRoot>

              <FieldRoot name="role" :disabled="pending">
                <FieldLabel for="early-access-role">Your role <span>(optional)</span></FieldLabel>
                <StudioSelect
                  id="early-access-role"
                  v-model="form.role"
                  clearable
                  placeholder="Select a role"
                  :options="roles"
                />
              </FieldRoot>

              <FieldRoot name="platform" :disabled="pending">
                <FieldLabel for="early-access-platform">Preferred platform <span>(optional)</span></FieldLabel>
                <StudioSelect
                  id="early-access-platform"
                  v-model="form.platform"
                  clearable
                  placeholder="Select a platform"
                  :options="['Windows', 'macOS', 'Both']"
                />
              </FieldRoot>
            </div>

            <label aria-hidden="true" hidden>
              Website
              <input v-model="form.website" name="website" tabindex="-1" autocomplete="off" />
            </label>

            <FieldRoot class="signup-consent" name="contact_consent" required :disabled="pending">
              <CheckboxRoot id="early-access-consent" v-model="form.contactConsent">
                <CheckboxIndicator><Check :size="14" aria-hidden="true" /></CheckboxIndicator>
              </CheckboxRoot>
              <div>
                <FieldLabel for="early-access-consent">
                  I agree to receive emails about MatterDraft early access and launch.
                </FieldLabel>
                <FieldDescription class="signup-privacy">
                  <NuxtLink to="/privacy">Privacy policy</NuxtLink>
                </FieldDescription>
                <FieldError class="signup-field-error">Agree to receive emails to join the list.</FieldError>
              </div>
            </FieldRoot>

            <p v-if="errorMessage" class="signup-error" role="alert">{{ errorMessage }}</p>
            <button class="action primary" type="submit" :disabled="pending">
              {{ pending ? 'Sending…' : 'Join early access' }}
              <ArrowRight aria-hidden="true" />
            </button>
          </FormRoot>
        </template>
      </div>
    </div>
  </section>
</template>
