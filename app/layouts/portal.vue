<script setup lang="ts">
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
  ScrollText,
  ContactRound,
  LifeBuoy,
} from '@lucide/vue'
import { authClient } from '~~/lib/auth-client'

type Context = {
  user: { id: string; name: string; email: string }
  accounts: { id: string; name: string; accountType: string; role: string }[]
  isStaff: boolean
  staffRole: string | null
}
const route = useRoute()
const isInternal = computed(() => route.path.startsWith('/internal/'))
const { data: context, error } = await useFetch<Context>('/api/portal/context', {
  key: 'portal-context',
})
if (error.value && (error.value as { statusCode?: number }).statusCode === 401) {
  await navigateTo({ path: '/sign-in', query: { returnTo: route.fullPath } })
}
if (context.value?.isStaff && !isInternal.value && route.path !== '/portal') {
  await navigateTo('/internal/overview', { replace: true })
}
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
    context.value?.accounts.find((account) => route.path.startsWith(`/a/${account.id}/`)) ||
    context.value?.accounts[0],
)
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
  () => route.fullPath,
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
  <div class="portal min-h-screen bg-studio-canvas text-studio-heading">
    <a class="portal-skip" href="#main-content">Skip to content</a>
    <div v-if="error && !context" class="mx-auto max-w-xl px-5 py-20">
      <h1 class="portal-page-title">Workspace unavailable</h1>
      <p class="mt-3 text-studio-muted">{{ parseApiError(error).text }}</p>
      <NuxtLink class="portal-link mt-5 inline-block" to="/sign-in">Go to sign in</NuxtLink>
    </div>
    <div v-else class="min-h-screen lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
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
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ]"
        >
          <div class="flex h-[72px] items-center justify-between border-b border-studio-rule px-5">
            <NuxtLink
              :to="isInternal ? '/internal/overview' : '/portal'"
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
          <div class="flex h-[calc(100vh-72px)] flex-col overflow-y-auto px-3 py-6">
            <div
              v-if="isInternal"
              class="mx-2 mb-7 rounded-md bg-studio-chip px-3 py-3 text-xs leading-5 text-studio-heading"
            >
              <strong class="block text-sm">MatterDraft administration</strong>
              <span v-if="context?.staffRole">{{
                context.staffRole === 'super_admin'
                  ? 'Super Admin'
                  : context.staffRole.replaceAll('_', ' ')
              }}</span>
            </div>
            <div
              v-else-if="currentAccount"
              class="mx-2 mb-6 rounded-md bg-studio-chip px-3 py-3 text-xs leading-5 text-studio-heading"
            >
              <strong class="block truncate text-sm text-studio-heading">{{
                currentAccount?.name
              }}</strong>{{
                currentAccount?.accountType === 'personal' ? 'Personal' : 'Organisation'
              }}
              ·
              {{ currentAccount?.role }}
            </div>
            <p v-if="isInternal || currentAccount" class="portal-nav-label">Workspace</p>
            <NuxtLink
              v-if="isInternal || currentAccount"
              :to="isInternal ? '/internal/overview' : `/a/${currentAccount?.id}/overview`"
              class="portal-nav-link"
              :class="
                (
                  isInternal
                    ? route.path === '/internal/overview'
                    : route.path.endsWith('/overview')
                )
                  ? 'portal-nav-active'
                  : ''
              "
              ><LayoutDashboard :size="18" />{{ isInternal ? 'Dashboard' : 'Overview' }}</NuxtLink
            >
            <NuxtLink
              v-if="
                !isInternal &&
                currentAccount?.accountType === 'organisation' &&
                ['owner', 'admin'].includes(currentAccount.role)
              "
              :to="`/a/${currentAccount.id}/members`"
              class="portal-nav-link"
              :class="route.path.endsWith('/members') ? 'portal-nav-active' : ''"
              ><Users :size="18" />Members</NuxtLink
            >
            <NuxtLink
              v-if="
                !isInternal &&
                currentAccount?.accountType === 'organisation' &&
                ['owner', 'admin'].includes(currentAccount.role)
              "
              :to="`/a/${currentAccount.id}/activity`"
              class="portal-nav-link"
              :class="route.path.endsWith('/activity') ? 'portal-nav-active' : ''"
              ><ScrollText :size="18" />Activity log</NuxtLink
            >
            <NuxtLink
              v-if="!isInternal && currentAccount"
              :to="`/a/${currentAccount.id}/tickets`"
              class="portal-nav-link"
              :class="route.path.includes('/tickets') ? 'portal-nav-active' : ''"
              ><LifeBuoy :size="18" />Support</NuxtLink
            >
            <NuxtLink
              v-if="isInternal && context?.staffRole === 'super_admin'"
              to="/internal/organisations"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/organisations') ? 'portal-nav-active' : ''"
              ><Users :size="18" />Organisations</NuxtLink
            >
            <NuxtLink
              v-if="isInternal && context?.staffRole === 'super_admin'"
              to="/internal/customers"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/customers') ? 'portal-nav-active' : ''"
              ><ContactRound :size="18" />Customers</NuxtLink
            >
            <NuxtLink
              v-if="isInternal && context?.staffRole === 'super_admin'"
              to="/internal/tickets"
              class="portal-nav-link"
              :class="route.path.startsWith('/internal/tickets') ? 'portal-nav-active' : ''"
              ><LifeBuoy :size="18" />Support tickets</NuxtLink
            >
            <div v-if="!isInternal" class="mt-5">
              <p class="portal-nav-label">Accounts</p>
              <NuxtLink to="/portal" class="portal-nav-link">All accounts</NuxtLink
              ><NuxtLink
                v-for="account in context?.accounts"
                :key="account.id"
                :to="`/a/${account.id}/overview`"
                class="portal-nav-link"
                ><span class="truncate">{{ account.name }}</span></NuxtLink
              >
            </div>
          </div>
        </aside>
      </FocusScope>

      <div class="min-w-0" :inert="mobileOpen">
        <header
          class="portal-topbar sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-studio-rule px-5 sm:px-8"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              ref="navigationTrigger"
              class="portal-icon-button inline-grid lg:hidden"
              aria-label="Open navigation"
              aria-controls="portal-navigation"
              :aria-expanded="mobileOpen"
              @click="mobileOpen = true"
            >
              <Menu :size="20" />
            </button>
            <div class="min-w-0">
              <p class="truncate text-xs font-medium uppercase tracking-wider text-studio-muted">
                {{
                  isInternal
                    ? 'MatterDraft'
                    : currentAccount?.accountType === 'personal'
                      ? 'Personal account'
                      : currentAccount
                        ? 'Organisation account'
                        : 'Account access'
                }}
              </p>
              <p class="truncate font-heading text-base font-semibold text-studio-heading">
                {{ isInternal ? 'Super Admin' : currentAccount?.name || 'Your accounts' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenuRoot v-if="!isInternal && (context?.accounts.length || 0) > 1">
              <DropdownMenuTrigger class="portal-top-action hidden sm:inline-flex"
                >Switch account <ChevronDown :size="15"
              /></DropdownMenuTrigger>
              <DropdownMenuPortal
                ><DropdownMenuContent class="portal-menu" :side-offset="8" align="end"
                  ><DropdownMenuItem
                    v-for="account in context?.accounts"
                    :key="account.id"
                    class="portal-menu-item"
                    @select="navigateTo(`/a/${account.id}/overview`)"
                    >{{ account.name }}
                    <span class="ml-auto text-xs text-studio-muted">{{
                      account.role
                    }}</span></DropdownMenuItem
                  ></DropdownMenuContent
                ></DropdownMenuPortal
              >
            </DropdownMenuRoot>
            <DropdownMenuRoot
              ><DropdownMenuTrigger
                class="portal-avatar"
                :aria-label="`Profile for ${context?.user.name}`"
                >{{ initials }}</DropdownMenuTrigger
              ><DropdownMenuPortal
                ><DropdownMenuContent class="portal-menu" :side-offset="8" align="end"
                  ><div class="px-3 py-2">
                    <p class="font-semibold">{{ context?.user.name }}</p>
                    <p class="text-xs text-studio-muted">{{ context?.user.email }}</p>
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
        <main id="main-content" tabindex="-1" class="min-h-[calc(100vh-72px)]"><slot /></main>
      </div>
    </div>
  </div>
</template>
