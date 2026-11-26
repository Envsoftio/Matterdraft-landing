<script setup lang="ts">
import { Check, ChevronRight, CreditCard, Download, LifeBuoy, ScrollText, Users } from '@lucide/vue'
import { parseApiError } from '~/utils/api-error'

definePageMeta({
  layout: false,
  pageTransition: false,
})
usePrivatePageSeo('Workspace', 'View your access to MatterDraft Studio and get support.')

const route = useRoute()
const accountId = String(route.params.accountId)
const accountPath = `/a/${accountId}`
const { data, error, refresh, pending } = useDashboardFetch(`/api/accounts/${accountId}/overview`)
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
const accessStatus = computed(() => {
  if (trial.value?.status === 'active') return 'Trial active'
  if (trial.value?.status === 'ended') return 'Trial ended'
  if (data.value?.canStartTrial) return 'Not started'
  return ''
})
const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    billing_manager: 'Billing manager',
    member: 'Member',
  }
  return labels[data.value?.account.role || ''] || data.value?.account.role
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
  if (busy.value) return
  busy.value = true
  problem.value = ''
  try {
    await $fetch(`/api/accounts/${accountId}/trial`, { method: 'POST', body: {} })
    const restoreFocus =
      document.activeElement === document.body ||
      document.activeElement?.classList.contains('workspace-primary')
    await refresh()
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
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    :title="
      data
        ? data.account.accountType === 'personal'
          ? 'Your workspace'
          : data.account.name
        : !error
          ? 'Your workspace'
          : 'Workspace unavailable'
    "
    :description="data ? 'Manage your access to MatterDraft Studio.' : undefined"
  >
    <div class="portal-content customer-content dashboard-content">
      <template v-if="data">
        <div class="portal-page-actions">
          <NuxtLink :to="`${accountPath}/download`" class="dashboard-download button-sm">
            <Download :size="18" aria-hidden="true" />Download and install
          </NuxtLink>
        </div>

        <div class="dashboard-overview">
          <div class="dashboard-main">
            <section class="dashboard-access" aria-labelledby="desktop-access-heading">
              <div class="dashboard-access-header">
                <h2 id="desktop-access-heading" class="title-3">Desktop access</h2>
                <span
                  v-if="accessStatus"
                  class="dashboard-access-status caption-3"
                  :class="trial?.status"
                >
                  <Check v-if="trial?.status === 'active'" :size="14" aria-hidden="true" />{{
                    accessStatus
                  }}
                </span>
              </div>
              <div class="dashboard-access-body">
                <div aria-live="polite">
                  <h3 id="workspace-access" ref="accessHeading" tabindex="-1" class="heading-5">
                    {{ accessTitle }}
                  </h3>
                  <p v-if="data.canStartTrial" class="body-3">
                    Your seven days begin immediately. Start when you’re ready to use the desktop
                    app.
                  </p>
                  <p v-else-if="trial?.status === 'active'" class="body-3">
                    Open MatterDraft Studio on your computer and sign in with this account. Full
                    access ends
                    <NuxtTime :datetime="trial.expiresAt" date-style="medium" time-style="short" />.
                  </p>
                  <p v-else-if="trial?.status === 'ended'" class="body-3">
                    {{
                      data.canBill
                        ? 'Review available plans for continued access.'
                        : 'Ask your organisation administrator for help with access.'
                    }}
                  </p>
                  <p v-else class="body-3">
                    Open MatterDraft Studio on your computer and sign in with this account.
                    <template
                      v-if="
                        data.account.accountType === 'organisation' &&
                        data.account.role === 'member'
                      "
                    >
                      Ask your organisation administrator for help with access.
                    </template>
                  </p>
                </div>
                <button
                  v-if="data.canStartTrial"
                  type="button"
                  class="workspace-primary button-sm"
                  :disabled="busy"
                  :aria-busy="busy"
                  @click="startTrial"
                >
                  {{ busy ? 'Starting…' : 'Start free trial' }}
                </button>
                <NuxtLink
                  v-else-if="trial?.status === 'ended' && data.canBill"
                  :to="`${accountPath}/billing`"
                  class="workspace-primary button-sm"
                >
                  View plans
                </NuxtLink>
                <p v-if="problem" class="portal-error" role="alert">{{ problem }}</p>
              </div>
            </section>

            <section class="dashboard-management" aria-labelledby="workspace-management">
              <h2 id="workspace-management" class="title-3">Account management</h2>
              <ul class="dashboard-links">
                <li v-for="link in workspaceLinks" :key="link.path">
                  <NuxtLink :to="`${accountPath}/${link.path}`" class="dashboard-link">
                    <component
                      :is="link.icon"
                      :size="20"
                      class="dashboard-link-icon"
                      aria-hidden="true"
                    />
                    <span class="dashboard-link-copy">
                      <span class="title-4">{{ link.label }}</span>
                      <span class="body-6">{{ link.description }}</span>
                    </span>
                    <ChevronRight :size="16" class="dashboard-link-chevron" aria-hidden="true" />
                  </NuxtLink>
                </li>
              </ul>
            </section>
          </div>

          <aside class="dashboard-details" aria-labelledby="workspace-details-heading">
            <h2 id="workspace-details-heading" class="title-3">Workspace details</h2>
            <dl class="dashboard-facts body-6">
              <div>
                <dt>Type</dt>
                <dd>{{ data.account.accountType === 'personal' ? 'Personal' : 'Organisation' }}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{{ roleLabel }}</dd>
              </div>
              <div v-if="data.memberCount !== null">
                <dt>Members</dt>
                <dd>{{ data.memberCount }}</dd>
              </div>
            </dl>
            <div class="dashboard-desktop-note">
              <h3 class="title-4">Documents and matters</h3>
              <p class="body-6">Your documents and matter files are managed in the desktop app.</p>
            </div>
          </aside>
        </div>
      </template>
      <div v-else-if="pending" class="dashboard-loading" role="status" aria-busy="true">
        <span class="sr-only">Loading workspace</span>
        <div class="dashboard-overview" aria-hidden="true">
          <div class="dashboard-main">
            <div class="dashboard-skeleton-panel" />
            <div class="dashboard-skeleton-list" />
          </div>
          <div class="dashboard-skeleton-details" />
        </div>
      </div>
      <div v-else role="alert">
        <p class="mt-3 text-studio-muted">
          {{
            error?.statusCode === 404
              ? 'This workspace is not available to you.'
              : parseApiError(error).text
          }}
        </p>
        <NuxtLink
          v-if="error?.statusCode === 404"
          to="/portal"
          class="portal-link mt-6 inline-block"
          >Go to your workspace</NuxtLink
        >
        <button v-else class="portal-button mt-6" @click="refresh()">Try again</button>
      </div>
    </div>
  </NuxtLayout>
</template>
