<script setup lang="ts">
import {
  desktopDownloadPlatforms,
  isDesktopDownloadPlatform,
} from '~~/lib/desktop-download-platforms'
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: 'portal' })
usePrivatePageSeo('Installer downloads', 'Review MatterDraft Studio installer download requests.')

const route = useRoute()
const before = computed(() => route.query.before)
const { data, error, refresh, pending } = await useFetch('/api/internal/downloads', {
  query: { before },
})

function platformLabel(platform: string) {
  return isDesktopDownloadPlatform(platform) ? desktopDownloadPlatforms[platform].label : platform
}
</script>

<template>
  <div class="portal-content">
    <h1 class="portal-page-title">Installer downloads</h1>
    <p class="mt-3 text-studio-muted">
      Each entry shows when a customer requested an installer link.
    </p>
    <p v-if="pending" role="status" class="mt-6 text-sm text-studio-muted">Loading downloads…</p>
    <div v-else-if="error" role="alert" class="portal-error mt-6">
      {{ parseApiError(error).text }}
      <button type="button" class="portal-link ml-2" @click="refresh()">Try again</button>
    </div>
    <template v-else-if="data">
      <div v-if="data.downloads.length" class="mt-8 overflow-x-auto border border-studio-rule">
        <table
          class="block w-full text-left text-sm sm:table"
          role="table"
          aria-label="Installer download requests"
        >
          <thead
            class="sr-only bg-studio-tint sm:not-sr-only sm:table-header-group"
            role="rowgroup"
          >
            <tr role="row">
              <th scope="col" role="columnheader" class="p-3">Customer</th>
              <th scope="col" role="columnheader" class="p-3">Platform</th>
              <th scope="col" role="columnheader" class="p-3">Version</th>
              <th scope="col" role="columnheader" class="p-3">Requested at</th>
            </tr>
          </thead>
          <tbody class="block divide-y divide-studio-rule sm:table-row-group" role="rowgroup">
            <tr
              v-for="entry in data.downloads"
              :key="entry.id"
              role="row"
              class="grid grid-cols-2 gap-3 p-4 sm:table-row sm:p-0"
            >
              <td class="col-span-2 block sm:table-cell sm:p-3" role="cell">
                <NuxtLink :to="`/internal/customers/${entry.userId}`" class="portal-link">
                  {{ entry.name }}
                </NuxtLink>
                <span class="block break-all text-studio-muted">{{ entry.email }}</span>
              </td>
              <td class="block sm:table-cell sm:p-3" role="cell">
                <span class="block text-xs font-semibold text-studio-muted sm:hidden"
                  >Platform</span
                >
                {{ platformLabel(entry.platform) }}
              </td>
              <td class="block sm:table-cell sm:p-3" role="cell">
                <span class="block text-xs font-semibold text-studio-muted sm:hidden">Version</span>
                {{ entry.version }}
              </td>
              <td class="col-span-2 block sm:table-cell sm:p-3" role="cell">
                <span class="block text-xs font-semibold text-studio-muted sm:hidden"
                  >Requested at</span
                >
                <NuxtTime
                  :datetime="entry.requestedAt"
                  year="numeric"
                  month="short"
                  day="numeric"
                  hour="numeric"
                  minute="2-digit"
                  time-zone-name="short"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="mt-8 text-studio-muted">No installer requests to show.</p>
      <nav
        v-if="before || data.nextCursor"
        class="mt-6 flex flex-wrap gap-4"
        aria-label="Download history pages"
      >
        <NuxtLink v-if="before" to="/internal/downloads" class="portal-link"
          >Latest requests</NuxtLink
        >
        <NuxtLink
          v-if="data.nextCursor"
          :to="{ query: { before: data.nextCursor } }"
          class="portal-link"
        >
          Older requests
        </NuxtLink>
      </nav>
    </template>
  </div>
</template>
