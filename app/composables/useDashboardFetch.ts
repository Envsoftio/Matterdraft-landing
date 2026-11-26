import { useNuxtApp } from '#app'
import { defineUseFetchAddon } from '#app/composables/addons'
import { computed, onMounted, ref } from 'vue'
import { createUseFetch } from '#app/composables/fetch'

export const useDashboardFetch = createUseFetch({
  lazy: true,
  addons: [
    defineUseFetchAddon({
      setup() {
        if (import.meta.server || useNuxtApp().isHydrating) return

        return (request) => {
          // A populated result during setup means this navigation can render from cache.
          if (request.data.value === undefined) return
          const backgroundRefresh = ref(false)
          const { pending, refresh } = request
          onMounted(async () => {
            backgroundRefresh.value = true
            try {
              await refresh({ dedupe: 'defer' })
            } finally {
              backgroundRefresh.value = false
            }
          })

          function refreshNow(options?: Parameters<typeof refresh>[0]) {
            backgroundRefresh.value = false
            return refresh(options)
          }

          return {
            pending: computed(() => pending.value && !backgroundRefresh.value),
            refresh: refreshNow,
            execute: refreshNow,
          }
        }
      },
    }),
  ],
  getCachedData(key, nuxtApp, { cause }) {
    // The Nuxt payload is local to the current app and is discarded on a browser reload.
    if (cause === 'initial' && !nuxtApp.payload._errors[key]) {
      return nuxtApp.payload.data[key]
    }
  },
})
