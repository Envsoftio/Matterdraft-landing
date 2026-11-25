<script setup lang="ts">
import { ArrowLeft, Download, Monitor } from '@lucide/vue'
import {
  desktopDownloadPlatforms,
  type DesktopDownloadPlatform,
} from '~~/lib/desktop-download-platforms'
import { parseApiError } from '~/utils/api-error'

definePageMeta({ layout: 'portal', key: (route) => String(route.params.accountId) })
usePrivatePageSeo(
  'Download and install',
  'Download MatterDraft Studio and follow the installation guide.',
)

const accountId = String(useRoute().params.accountId)
const accountPath = `/a/${accountId}`
const downloadPath = `/api/accounts/${accountId}/download` as const
const { data, error, refresh, pending } = await useFetch(downloadPath)
const platform = ref<DesktopDownloadPlatform>()
const installer = computed(
  () =>
    data.value?.installers.find((entry) => entry.platform === platform.value) ??
    data.value?.installers[0],
)
const isMac = computed(() => installer.value?.platform !== 'windows-x64')
const busy = ref(false)
const message = ref('')
const downloadRequested = ref(false)

watch(platform, () => {
  message.value = ''
  downloadRequested.value = false
})

async function download() {
  if (!installer.value || busy.value) return
  const { platform, version } = installer.value
  busy.value = true
  message.value = ''
  downloadRequested.value = false
  try {
    const { url } = await $fetch(downloadPath, { method: 'POST', body: { platform, version } })
    const link = document.createElement('a')
    link.href = url
    link.rel = 'noreferrer'
    link.click()
    downloadRequested.value = true
  } catch (cause) {
    message.value = parseApiError(cause).text
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="portal-content customer-content">
    <NuxtLink
      :to="`${accountPath}/overview`"
      class="portal-link mb-4 inline-flex items-center gap-2 text-sm"
    >
      <ArrowLeft :size="16" aria-hidden="true" /> Back to Home
    </NuxtLink>
    <h1 class="portal-page-title">Download and install</h1>
    <p class="mt-3 text-studio-muted">Get MatterDraft Studio for your computer.</p>

    <div v-if="error" role="alert" class="portal-error mt-6">
      {{ parseApiError(error).text }}
      <button type="button" class="portal-link ml-2" @click="refresh()">Try again</button>
    </div>
    <div v-else-if="pending" role="status" class="mt-8 h-32 rounded-xl bg-studio-chip">
      <span class="sr-only">Loading installers</span>
    </div>
    <template v-else-if="installer && data">
      <section class="workspace-panel mt-8" aria-labelledby="installer-heading">
        <div class="flex items-start gap-4 sm:gap-6">
          <span class="workspace-monitor" aria-hidden="true"><Monitor :size="26" /></span>
          <div class="min-w-0 flex-1">
            <h2 id="installer-heading" class="text-xl font-semibold sm:text-2xl">
              Choose your installer
            </h2>
            <fieldset v-if="data.installers.length > 1" class="mt-4 grid gap-2" :disabled="busy">
              <legend class="sr-only">Platform</legend>
              <label
                v-for="option in data.installers"
                :key="option.platform"
                class="flex items-center gap-2"
              >
                <input
                  type="radio"
                  name="installer-platform"
                  :value="option.platform"
                  :checked="installer.platform === option.platform"
                  @change="platform = option.platform"
                />
                {{ desktopDownloadPlatforms[option.platform].label }}
              </label>
            </fieldset>
            <p v-else class="mt-3 font-semibold">
              {{ desktopDownloadPlatforms[installer.platform].label }}
            </p>
            <p class="workspace-description mt-2 break-words text-sm">
              Version {{ installer.version }} · {{ installer.requirements }}
            </p>
            <p v-if="installer.notarized === false" class="mt-2 text-sm text-studio-muted">
              This version has not been notarized by Apple.
            </p>
            <button type="button" class="workspace-primary mt-4" :disabled="busy" @click="download">
              <Download :size="18" aria-hidden="true" />
              {{ busy ? 'Preparing download…' : 'Download installer' }}
            </button>
            <p v-if="message" class="portal-error mt-4" role="alert">{{ message }}</p>
            <p v-if="downloadRequested" role="status" class="mt-4 text-sm text-studio-muted">
              Check your browser’s downloads for the installer.
            </p>
          </div>
        </div>
      </section>

      <section class="mt-8 sm:mt-10" aria-labelledby="install-heading">
        <h2 id="install-heading" class="text-xl font-semibold sm:text-2xl">How to install</h2>
        <ol v-if="isMac" class="workspace-description mt-4 list-decimal space-y-3 pl-6">
          <li>
            Open the Apple menu and choose <strong>About This Mac</strong>. A
            <strong>Chip</strong> field means Apple silicon. A <strong>Processor</strong> field
            showing Intel means Intel.
          </li>
          <li>Open the downloaded <strong>.dmg</strong> file.</li>
          <li>Drag <strong>MatterDraft Studio</strong> into <strong>Applications</strong>.</li>
          <li>
            Open MatterDraft Studio from Applications and sign in with the same email address you
            used here.
          </li>
        </ol>
        <ol v-else class="workspace-description mt-4 list-decimal space-y-3 pl-6">
          <li>Open the downloaded <strong>.msi</strong> file.</li>
          <li>Follow the installation wizard.</li>
          <li>
            Open <strong>MatterDraft Studio</strong> from the Start menu and sign in with the same
            email address you used here.
          </li>
        </ol>
      </section>
    </template>
    <section v-else class="workspace-panel mt-8" aria-labelledby="no-installers-heading">
      <h2 id="no-installers-heading" class="text-xl font-semibold">
        No installer is available right now
      </h2>
    </section>

    <p class="mt-6 text-sm text-studio-muted">
      <span v-if="installer"
        >If your platform is missing or your computer blocks installation,
      </span>
      <NuxtLink :to="`${accountPath}/tickets`" class="portal-link">{{
        installer ? 'contact support' : 'Contact support for help getting the app'
      }}</NuxtLink>.
    </p>
  </div>
</template>
