<script setup lang="ts">
import '~/assets/css/customer-dashboard.css'
import '~/assets/css/customer-pages.css'
import '~/assets/css/portal-page-header.css'
import { parseApiError } from '~/utils/api-error'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FocusScope,
} from 'reka-ui'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Users,
  ContactRound,
  LifeBuoy,
  CreditCard,
  Download,
  House,
  ScrollText,
  Settings2,
} from '@lucide/vue'
import { authClient } from '~~/lib/auth-client'

withDefaults(
  defineProps<{ title?: string; description?: string; loading?: boolean; pending?: boolean }>(),
  { title: 'Workspace' },
)
const slots = useSlots()
const route = useRoute()
const router = useRouter()
const currentPath = computed(() => router.currentRoute.value.path)
const isInternal = computed(() => route.path.startsWith('/internal/'))
const contextRequest = useLazyFetch('/api/portal/context', {
  key: 'portal-context',
})
const { data: context, error, refresh: refreshContext, pending: loadingContext } = contextRequest
async function checkAccess() {
  if (error.value && (error.value as { statusCode?: number }).statusCode === 401) {
    await navigateTo({ path: '/sign-in', query: { returnTo: route.fullPath } })
  } else if (context.value?.isStaff && !isInternal.value && route.path !== '/portal') {
    await navigateTo('/internal/overview', { replace: true })
  }
}
if (import.meta.server) {
  await contextRequest
  await checkAccess()
} else watch([context, error, () => route.path], checkAccess, { immediate: true })
const mobileOpen = ref(false)
const desktopNavigation = ref(false)
const navigationTrigger = ref<HTMLButtonElement | null>(null)
const signOutError = ref('')
onMounted(() => {
  const media = window.matchMedia('(min-width: 1024px)')
  const update = () => {
    desktopNavigation.value = media.matches
    if (media.matches) mobileOpen.value = false
  }
  update()
  media.addEventListener('change', update)
  onBeforeUnmount(() => media.removeEventListener('change', update))
})
async function closeNavigation() {
  if (!mobileOpen.value) return
  mobileOpen.value = false
  await nextTick()
  navigationTrigger.value?.focus()
}
const currentAccount = computed(
  () =>
    context.value?.accounts.find((account) => currentPath.value.startsWith(`/a/${account.id}/`)) ||
    context.value?.accounts[0],
)
const accountPath = computed(() => (currentAccount.value ? `/a/${currentAccount.value.id}` : ''))
const workspaceName = computed(() => {
  if (currentAccount.value?.accountType === 'personal') return 'Personal workspace'
  return currentAccount.value?.name || 'Workspaces'
})
const customerLinks = computed(() => {
  if (!currentAccount.value) return []
  return [
    { path: 'overview', label: 'Home', icon: House },
    { path: 'download', label: 'Download app', icon: Download },
    ...(['owner', 'billing_manager'].includes(currentAccount.value.role)
      ? [{ path: 'billing', label: 'Plans & billing', icon: CreditCard }]
      : []),
    ...(currentAccount.value.accountType === 'organisation' &&
    ['owner', 'admin'].includes(currentAccount.value.role)
      ? [
          { path: 'members', label: 'Members', icon: Users },
          { path: 'activity', label: 'Activity log', icon: ScrollText },
        ]
      : []),
    { path: 'tickets', label: 'Support', icon: LifeBuoy },
  ]
})
function isCustomerLinkCurrent(path: string) {
  const destination = `${accountPath.value}/${path}`
  return currentPath.value === destination || currentPath.value.startsWith(`${destination}/`)
}
const initials = computed(
  () =>
    context.value?.user.name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'MD',
)
watch(
  () => router.currentRoute.value.fullPath,
  async () => {
    if (mobileOpen.value) {
      mobileOpen.value = false
      await nextTick()
      document.getElementById('main-content')?.focus()
    }
  },
)

async function signOut() {
  signOutError.value = ''
  try {
    const result = await authClient.signOut()
    if (result.error) {
      signOutError.value = 'Sign out could not be confirmed. Please try again.'
      return
    }
    clearNuxtData()
    await navigateTo('/sign-in')
  } catch {
    signOutError.value = 'Sign out could not be confirmed. Check your connection and try again.'
  }
}
</script>

<template>
  <div
    class="portal min-h-screen bg-studio-canvas text-studio-heading"
    :class="{ 'customer-portal': !isInternal }"
  >
    <a class="portal-skip" href="#main-content">Skip to content</a>
    <div v-if="error && !context" class="mx-auto max-w-xl px-5 py-20">
      <h1 class="portal-page-title">Workspace unavailable</h1>
      <p class="mt-3 text-studio-muted">{{ parseApiError(error).text }}</p>
      <button class="portal-button mt-5 mr-4" :disabled="loadingContext" @click="refreshContext()">
        Try again
      </button>
      <NuxtLink class="portal-link mt-5 inline-block" to="/sign-in">Go to sign in</NuxtLink>
    </div>
    <div
      v-else
      class="min-h-screen"
      :class="isInternal ? 'lg:grid lg:grid-cols-[238px_minmax(0,1fr)]' : 'customer-shell'"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-30 bg-[#06152b]/50 lg:hidden"
        @click="closeNavigation"
      />
      <FocusScope
        as-child
        :present="mobileOpen"
        :trapped="mobileOpen"
        :loop="mobileOpen"
        @unmount-auto-focus.prevent
      >
        <aside
          id="portal-navigation"
          :inert="!desktopNavigation && !mobileOpen"
          :role="mobileOpen ? 'dialog' : undefined"
          :aria-modal="mobileOpen || undefined"
          aria-label="Navigation"
          @keydown.esc="closeNavigation"
          :class="[
            'portal-sidebar fixed inset-y-0 left-0 z-40 w-[270px] lg:sticky lg:top-0 lg:h-screen lg:w-auto',
            { 'customer-sidebar': !isInternal },
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ]"
        >
          <div
            class="flex h-[72px] items-center justify-between border-b border-studio-rule px-5"
            :class="{ 'customer-sidebar-brand': !isInternal }"
          >
            <NuxtLink
              :to="
                isInternal
                  ? '/internal/overview'
                  : accountPath
                    ? `${accountPath}/overview`
                    : '/portal'
              "
              class="flex items-center gap-2.5 font-heading text-[17px] font-bold tracking-tight text-studio-heading"
              ><BrandLogo class="portal-wordmark"
            /></NuxtLink>
            <button
              class="portal-icon-button inline-grid lg:hidden"
              aria-label="Close navigation"
              @click="closeNavigation"
            >
              <X :size="20" />
            </button>
          </div>
          <div
            v-if="isInternal"
            class="flex h-[calc(100vh-72px)] flex-col overflow-y-auto px-3 py-6"
          >
            <div
              class="mx-2 mb-7 rounded-md bg-studio-chip px-3 py-3 text-xs leading-5 text-studio-heading"
            >
              <strong class="block text-sm">MatterDraft administration</strong>
              <span v-if="context?.staffRole">{{
                context.staffRole === 'super_admin'
                  ? 'Super Admin'
                  : context.staffRole.replaceAll('_', ' ')
              }}</span>
            </div>
            <p class="portal-nav-label">Workspace</p>
            <NuxtLink
              to="/internal/overview"
              class="portal-nav-link"
              exact-active-class="portal-nav-active"
            >
              <LayoutDashboard :size="18" />Dashboard
            </NuxtLink>
            <NuxtLink
              v-if="context?.staffRole === 'super_admin'"
              to="/internal/organisations"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/organisations') ? 'portal-nav-active' : ''"
              ><Users :size="18" />Organisations</NuxtLink
            >
            <NuxtLink
              v-if="context?.staffRole === 'super_admin'"
              to="/internal/customers"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/customers') ? 'portal-nav-active' : ''"
              ><ContactRound :size="18" />Customers</NuxtLink
            >
            <NuxtLink
              v-if="context?.staffRole === 'super_admin'"
              to="/internal/plans"
              class="portal-nav-link"
              :class="route.path === '/internal/plans' ? 'portal-nav-active' : ''"
              ><CreditCard :size="18" />Licence plans</NuxtLink
            >
            <NuxtLink
              v-if="context?.staffRole === 'super_admin'"
              to="/internal/downloads"
              class="portal-nav-link"
              exact-active-class="portal-nav-active"
            >
              <Download :size="18" aria-hidden="true" />Installer downloads
            </NuxtLink>
            <NuxtLink
              v-if="context?.staffRole === 'super_admin'"
              to="/internal/tickets"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/tickets') ? 'portal-nav-active' : ''"
              ><LifeBuoy :size="18" />Support tickets</NuxtLink
            >
          </div>
          <div v-else class="customer-sidebar-body">
            <p class="customer-nav-label caption-3">Workspace</p>
            <nav class="customer-side-nav" aria-label="Workspace">
              <NuxtLink
                v-for="link in customerLinks"
                :key="link.path"
                :to="`${accountPath}/${link.path}`"
                class="customer-side-link title-4"
                :aria-current="isCustomerLinkCurrent(link.path) ? 'page' : undefined"
              >
                <component :is="link.icon" :size="20" aria-hidden="true" />
                {{ link.label }}
              </NuxtLink>
            </nav>
            <div class="customer-sidebar-bottom">
              <NuxtLink
                to="/portal/accounts"
                class="customer-side-link title-4"
                :aria-current="currentPath === '/portal/accounts' ? 'page' : undefined"
              >
                <Settings2 :size="20" aria-hidden="true" />Manage workspaces
              </NuxtLink>
            </div>
          </div>
        </aside>
      </FocusScope>

      <div
        class="min-w-0"
        :class="{ 'flex min-h-screen flex-col': !isInternal }"
        :inert="mobileOpen"
      >
        <header
          class="portal-topbar portal-page-header sticky top-0 z-20 border-b border-studio-rule"
        >
          <button
            ref="navigationTrigger"
            class="portal-icon-button portal-navigation-trigger inline-grid lg:hidden"
            aria-label="Open navigation"
            aria-controls="portal-navigation"
            :aria-expanded="mobileOpen"
            @click="mobileOpen = true"
          >
            <Menu :size="20" aria-hidden="true" />
          </button>
          <div class="portal-header-heading">
            <h1 id="portal-page-heading" class="heading-5">{{ title }}</h1>
            <div v-if="description || slots.description" class="portal-header-description body-6">
              <slot name="description">{{ description }}</slot>
            </div>
          </div>
          <div class="portal-header-controls flex min-w-0 items-center gap-2 sm:gap-3">
            <DropdownMenuRoot v-if="!isInternal">
              <DropdownMenuTrigger
                class="workspace-switch"
                :aria-label="`Switch workspace, current: ${workspaceName}`"
              >
                <span v-if="currentAccount?.accountType === 'personal'" class="workspace-short-name"
                  >Personal</span
                >
                <span
                  :class="[
                    'truncate',
                    { 'workspace-full-name': currentAccount?.accountType === 'personal' },
                  ]"
                >
                  {{ workspaceName }}
                </span>
                <ChevronDown :size="15" class="shrink-0" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  class="portal-menu workspace-menu customer-menu"
                  :side-offset="8"
                  align="end"
                >
                  <DropdownMenuItem
                    v-for="account in context?.accounts"
                    :key="account.id"
                    class="portal-menu-item workspace-menu-item"
                    @select="navigateTo(`/a/${account.id}/overview`)"
                  >
                    <span class="min-w-0 flex-1 break-words">
                      {{ account.accountType === 'personal' ? 'Personal workspace' : account.name }}
                    </span>
                    <span v-if="account.id === currentAccount?.id" class="text-xs text-studio-muted"
                      >Current</span
                    >
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    v-if="context?.accounts.length"
                    class="my-1 h-px bg-studio-rule"
                  />
                  <DropdownMenuItem
                    class="portal-menu-item"
                    @select="navigateTo('/portal/accounts')"
                  >
                    Manage workspaces
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
            <ThemeToggle />
            <DropdownMenuRoot
              ><DropdownMenuTrigger
                class="portal-avatar"
                :aria-label="`Profile for ${context?.user.name}`"
                >{{ initials }}</DropdownMenuTrigger
              ><DropdownMenuPortal
                ><DropdownMenuContent
                  class="portal-menu workspace-menu"
                  :class="{ 'customer-menu': !isInternal }"
                  :side-offset="8"
                  align="end"
                  ><div class="px-3 py-2">
                    <p class="font-semibold">{{ context?.user.name }}</p>
                    <p class="break-words text-xs text-studio-muted">{{ context?.user.email }}</p>
                  </div>
                  <DropdownMenuSeparator class="my-1 h-px bg-studio-rule" /><DropdownMenuItem
                    class="portal-menu-item"
                    @select="signOut"
                    ><LogOut :size="16" />Sign out</DropdownMenuItem
                  ></DropdownMenuContent
                ></DropdownMenuPortal
              ></DropdownMenuRoot
            >
          </div>
        </header>
        <p v-if="signOutError" role="alert" class="portal-error mx-5 mt-4">{{ signOutError }}</p>
        <main
          id="main-content"
          tabindex="-1"
          aria-labelledby="portal-page-heading"
          :class="isInternal ? 'min-h-[calc(100vh-72px)]' : 'grow'"
        >
          <PortalAsyncContent
            :loading="loading || (!context && !error)"
            :pending="pending"
            :customer="!isInternal"
          >
            <slot />
          </PortalAsyncContent>
        </main>
        <footer v-if="!isInternal" class="customer-footer caption-5">
          <span>MatterDraft Studio</span>
          <nav aria-label="Legal">
            <NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink>
          </nav>
        </footer>
      </div>
    </div>
  </div>
</template>
