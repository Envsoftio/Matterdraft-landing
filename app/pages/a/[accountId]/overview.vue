<script setup lang="ts">
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Download,
  LifeBuoy,
  Monitor,
  ScrollText,
  Users,
} from '@lucide/vue'
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: 'portal', key: (route) => String(route.params.accountId) })
usePrivatePageSeo('Workspace', 'View your access to MatterDraft Studio and get support.')

const route = useRoute()
const accountId = String(route.params.accountId)
const accountPath = `/a/${accountId}`
const { data, error, refresh, pending } = await useFetch(`/api/accounts/${accountId}/overview`)
const trial = computed(() => data.value?.trial)
const busy = ref(false)
const problem = ref('')
const accessHeading = ref<HTMLElement | null>(null)

const accessTitle = computed(() => {
  if (trial.value?.status === 'active') return 'Your trial is active'
  if (trial.value?.status === 'ended') return 'Your trial has ended'
  if (data.value?.canStartTrial) return 'Start your free trial'
  return 'Use the desktop app'
})

const workspaceLinks = computed(() => {
  const links = []
  if (data.value?.canBill) {
    links.push({
      label: 'Plans & billing',
      description: 'View available plans and trial details.',
      path: 'billing',
      icon: CreditCard,
    })
  }
  if (
    data.value?.account.accountType === 'organisation' &&
    ['owner', 'admin'].includes(data.value.account.role)
  ) {
    links.push(
      {
        label: 'Members',
        description: 'Invite colleagues and manage their roles.',
        path: 'members',
        icon: Users,
      },
      {
        label: 'Activity log',
        description: 'Review changes to your organisation.',
        path: 'activity',
        icon: ScrollText,
      },
    )
  }
  links.push({
    label: 'Support',
    description: 'Get help with your account or the desktop app.',
    path: 'tickets',
    icon: LifeBuoy,
  })
  return links
})

async function startTrial() {
  busy.value = true
  problem.value = ''
  try {
    const result = await $fetch(`/api/accounts/${accountId}/trial`, { method: 'POST', body: {} })
    const restoreFocus =
      document.activeElement === document.body ||
      document.activeElement?.classList.contains('workspace-primary')
    if (data.value) data.value = { ...data.value, trial: result.trial, canStartTrial: false }
    if (restoreFocus) {
      await nextTick()
      accessHeading.value?.focus()
    }
  } catch (cause) {
    problem.value = parseApiError(cause).text
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="portal-content customer-content">
    <template v-if="data">
      <h1 class="portal-page-title">
        {{ data.account.accountType === 'personal' ? 'Your workspace' : data.account.name }}
      </h1>
      <p class="mt-3 text-studio-muted">Manage your access to MatterDraft Studio.</p>

      <NuxtLink :to="`${accountPath}/download`" class="workspace-list workspace-row mt-8">
        <Download :size="21" aria-hidden="true" />
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">Download and install</span>
          <span class="workspace-description mt-1 block text-sm"
            >Get the desktop app and follow the setup instructions.</span
          >
        </span>
        <ChevronRight :size="18" aria-hidden="true" />
      </NuxtLink>

      <section class="workspace-panel mt-6 flex gap-4 sm:gap-6" aria-labelledby="workspace-access">
        <span class="workspace-monitor" aria-hidden="true"><Monitor :size="26" /></span>
        <div class="min-w-0">
          <div aria-live="polite">
            <h2
              id="workspace-access"
              ref="accessHeading"
              tabindex="-1"
              class="text-xl font-semibold sm:text-2xl"
            >
              {{ accessTitle }}
            </h2>
            <p v-if="data.canStartTrial" class="workspace-description mt-2">
              Your seven days begin immediately. Start when you’re ready to use the desktop app.
            </p>
            <p v-else-if="trial?.status === 'active'" class="workspace-description mt-2">
              Open MatterDraft Studio on your computer and sign in with this account. Full access
              ends
              <NuxtTime
                :datetime="trial.expiresAt"
                year="numeric"
                month="short"
                day="numeric"
                hour="numeric"
                minute="2-digit"
                time-zone-name="short"
              />.
            </p>
            <p v-else-if="trial?.status === 'ended'" class="workspace-description mt-2">
              Review available plans for continued access.
            </p>
            <p v-else class="workspace-description mt-2">
              Open MatterDraft Studio on your computer and sign in with this account.
              <template
                v-if="data.account.accountType === 'organisation' && data.account.role === 'member'"
              >
                Ask your organisation administrator for help with access.
              </template>
            </p>
          </div>
          <button
            v-if="data.canStartTrial"
            type="button"
            class="workspace-primary mt-4"
            :disabled="busy"
            @click="startTrial"
          >
            {{ busy ? 'Starting…' : 'Start free trial' }}
          </button>
          <NuxtLink
            v-else-if="trial?.status === 'ended' && data.canBill"
            :to="`${accountPath}/billing`"
            class="workspace-primary mt-4"
          >
            View plans <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
          <p v-if="problem" class="portal-error mt-4" role="alert">{{ problem }}</p>
        </div>
      </section>

      <section class="mt-8 sm:mt-10" aria-labelledby="workspace-management">
        <h2 id="workspace-management" class="text-xl font-semibold sm:text-2xl">
          Manage your workspace
        </h2>
        <ul class="workspace-list mt-4 divide-y divide-studio-rule">
          <li v-for="link in workspaceLinks" :key="link.path">
            <NuxtLink :to="`${accountPath}/${link.path}`" class="workspace-row">
              <component :is="link.icon" :size="21" class="shrink-0" aria-hidden="true" />
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">{{ link.label }}</span>
                <span class="workspace-description mt-1 block text-sm">{{ link.description }}</span>
              </span>
              <ChevronRight :size="18" class="shrink-0" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>
      <p class="mt-6 text-sm text-studio-muted">
        Documents and matter files are managed in the desktop app.
      </p>
    </template>
    <div v-else-if="pending" class="space-y-6" role="status">
      <span class="sr-only">Loading workspace</span>
      <div class="h-10 w-60 max-w-full rounded-lg bg-studio-chip" aria-hidden="true" />
      <div class="h-40 rounded-xl bg-studio-chip" aria-hidden="true" />
    </div>
    <div v-else role="alert">
      <h1 class="portal-page-title">Workspace unavailable</h1>
      <p class="mt-3 text-studio-muted">
        {{
          error?.statusCode === 404
            ? 'This workspace is not available to you.'
            : parseApiError(error).text
        }}
      </p>
      <NuxtLink v-if="error?.statusCode === 404" to="/portal" class="portal-link mt-6 inline-block">
        Go to your workspace
      </NuxtLink>
      <button v-else class="portal-button mt-6" @click="refresh()">Try again</button>
    </div>
  </div>
</template>
