<script setup lang="ts">
definePageMeta({ layout: false, pageTransition: false })
usePrivatePageSeo('Workspace', 'Open your MatterDraft Studio workspace.')

const request = useDashboardFetch('/api/portal/context', { key: 'portal-context' })
const { data } = request
async function openWorkspace() {
  if (!data.value) return
  const account = data.value.accounts[0]
  const destination = data.value.isStaff
    ? '/internal/overview'
    : account
      ? `/a/${account.id}/overview`
      : '/portal/accounts'
  await navigateTo(destination, { replace: true })
}
if (import.meta.server) {
  await request
  await openWorkspace()
} else watch(data, openWorkspace, { immediate: true })
</script>

<template>
  <NuxtLayout name="portal" title="Opening workspace" loading><div /></NuxtLayout>
</template>
