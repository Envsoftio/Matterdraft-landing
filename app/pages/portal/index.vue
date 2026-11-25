<script setup lang="ts">
definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Workspace', 'Open your MatterDraft Studio workspace.')

const { data } = await useFetch('/api/portal/context', { key: 'portal-context' })
if (data.value) {
  const account = data.value.accounts[0]
  const destination = data.value.isStaff
    ? '/internal/overview'
    : account
      ? `/a/${account.id}/overview`
      : '/portal/accounts'
  await navigateTo(destination, { replace: true })
}
</script>

<template>
  <div />
</template>
