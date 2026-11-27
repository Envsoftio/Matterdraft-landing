<script setup lang="ts">
import { Download } from '@lucide/vue'
import {
  desktopDownloadPlatforms,
  type DesktopDownloadPlatform,
} from '~~/lib/desktop-download-platforms'
import { parseApiError } from '~/utils/api-error'

definePageMeta({
  layout: false,
  pageTransition: false,
})
usePrivatePageSeo(
  'Download and install',
  'Download MatterDraft Studio and follow the installation guide.',
)

const accountId = String(useRoute().params.accountId)
const accountPath = `/a/${accountId}`
const downloadPath = `/api/accounts/${accountId}/download` as const
const { data, error, refresh, pending } = useDashboardFetch(downloadPath)
const platform = ref<DesktopDownloadPlatform>()
const installer = computed(
  () =>
    data.value?.installers.find((entry) => entry.platform === platform.value) ??
    data.value?.installers[0],
)
const isMac = computed(() => installer.value?.platform.startsWith('macos-'))
const isLinux = computed(() => installer.value?.platform === 'linux-x64')
const busy = ref(false)
const message = ref('')
const downloadRequested = ref(false)

watch(platform, () => {
  message.value = ''
  downloadRequested.value = false
})

async function download() {
  if (!installer.value || busy.value) return
  const { platform, version, releaseTag } = installer.value
  busy.value = true
  message.value = ''
  downloadRequested.value = false
  try {
    const { url } = await $fetch(downloadPath, {
      method: 'POST',
      body: { platform, version, releaseTag },
    })
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
  <NuxtLayout
    :loading="!data && !error"
    :pending="pending"
    name="portal"
    title="Download and install"
    description="Choose the installer for your computer."
  >
    <div class="portal-content customer-content customer-page">
      <div v-if="error" role="alert" class="portal-error">
        {{ parseApiError(error).text }}
        <button type="button" class="portal-link ml-2" @click="refresh()">Try again</button>
      </div>
      <div
        v-else-if="pending && !data"
        class="customer-loading-panel"
        role="status"
        aria-busy="true"
      >
        <span class="sr-only">Loading installers</span>
      </div>
      <template v-else-if="installer && data">
        <div class="customer-page-columns">
          <div class="customer-page-main">
            <section class="customer-panel" aria-labelledby="installer-heading">
              <header class="customer-panel-heading">
                <h2 id="installer-heading" class="title-3">Choose your installer</h2>
                <span class="body-6">MatterDraft Studio</span>
              </header>
              <div class="customer-panel-body">
                <fieldset class="installer-options" :disabled="busy">
                  <legend class="sr-only">Platform</legend>
                  <label
                    v-for="option in data.installers"
                    :key="option.platform"
                    class="installer-option"
                    :class="{ 'is-selected': installer.platform === option.platform }"
                  >
                    <input
                      type="radio"
                      name="installer-platform"
                      :value="option.platform"
                      :checked="installer.platform === option.platform"
                      :aria-label="desktopDownloadPlatforms[option.platform].label"
                      @change="platform = option.platform"
                    />
                    <span class="title-4">{{
                      desktopDownloadPlatforms[option.platform].label
                    }}</span>
                    <span class="installer-extension caption-5">.{{ option.extension }}</span>
                  </label>
                </fieldset>
                <div class="installer-selection" aria-live="polite">
                  <dl class="customer-key-values body-6">
                    <div>
                      <dt>Version</dt>
                      <dd>{{ installer.version }}</dd>
                    </div>
                    <div>
                      <dt>Build</dt>
                      <dd>{{ installer.releaseTag }}</dd>
                    </div>
                    <div>
                      <dt>Requirements</dt>
                      <dd>{{ installer.requirements }}</dd>
                    </div>
                  </dl>
                  <p v-if="installer.notarized === false" class="customer-muted body-6">
                    This version has not been notarized by Apple.
                  </p>
                  <p v-if="installer.unsigned" class="customer-muted body-6">
                    Your computer may ask you to confirm installation.
                  </p>
                </div>
                <div class="customer-form-actions">
                  <button
                    type="button"
                    class="workspace-primary button-sm"
                    :disabled="busy"
                    :aria-busy="busy"
                    @click="download"
                  >
                    <Download :size="18" aria-hidden="true" />{{
                      busy ? 'Preparing download…' : 'Download installer'
                    }}
                  </button>
                </div>
                <p v-if="message" class="portal-error" role="alert">{{ message }}</p>
                <p v-if="downloadRequested" role="status" class="customer-muted body-6">
                  Check your browser’s downloads for the installer.
                </p>
              </div>
            </section>
            <section class="customer-section" aria-labelledby="install-heading">
              <h2 id="install-heading" class="title-3">How to install</h2>
              <ol v-if="isMac" class="installation-steps body-6">
                <li><strong>Open the downloaded .dmg file.</strong></li>
                <li>
                  <strong>Move MatterDraft Studio to Applications.</strong
                  ><span>Drag the app into the Applications folder.</span>
                </li>
                <li>
                  <strong>Open the app and sign in.</strong
                  ><span>Use the same email address you used here.</span>
                </li>
              </ol>
              <ol v-else-if="isLinux" class="installation-steps body-6">
                <li><strong>Download the .AppImage file.</strong></li>
                <li><strong>Allow the file to run as a program.</strong></li>
                <li><strong>Open MatterDraft Studio and sign in.</strong></li>
              </ol>
              <ol v-else class="installation-steps body-6">
                <li>
                  <strong>Open the downloaded .{{ installer.extension }} file.</strong>
                </li>
                <li><strong>Follow the installation wizard.</strong></li>
                <li>
                  <strong>Open MatterDraft Studio from the Start menu.</strong
                  ><span>Sign in with the same email address you used here.</span>
                </li>
              </ol>
            </section>
          </div>
          <aside class="customer-page-aside">
            <section v-if="isMac" aria-labelledby="mac-help-heading">
              <h2 id="mac-help-heading" class="title-3">Which Mac installer?</h2>
              <p class="body-6">Open the Apple menu and choose <strong>About This Mac</strong>.</p>
              <dl class="installer-chip-help body-6">
                <div>
                  <dt>Chip</dt>
                  <dd>Choose Apple silicon.</dd>
                </div>
                <div>
                  <dt>Processor: Intel</dt>
                  <dd>Choose Mac with Intel.</dd>
                </div>
              </dl>
            </section>
            <section aria-labelledby="download-help-heading">
              <h2 id="download-help-heading" class="title-3">Installation help</h2>
              <p class="body-6">
                If your platform is missing or your computer blocks installation, contact support.
              </p>
              <NuxtLink :to="`${accountPath}/tickets`" class="portal-link body-6"
                >Contact support</NuxtLink
              >
            </section>
          </aside>
        </div>
      </template>
      <section v-else class="customer-empty" aria-labelledby="no-installers-heading">
        <h2 id="no-installers-heading" class="title-3">No installer is available right now</h2>
        <p class="body-6">Contact support for help getting the app.</p>
        <NuxtLink :to="`${accountPath}/tickets`" class="portal-button-secondary button-sm"
          >Contact support</NuxtLink
        >
      </section>
      <NuxtLink :to="`${accountPath}/overview`" class="customer-back-link body-6"
        >Back to Home</NuxtLink
      >
    </div>
  </NuxtLayout>
</template>
