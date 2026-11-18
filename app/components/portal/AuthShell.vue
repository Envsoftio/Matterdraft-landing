<template>
  <div class="portal-auth min-h-screen lg:grid lg:grid-cols-[minmax(360px,40%)_1fr]">
    <aside class="hidden flex-col portal-auth-aside px-12 py-10 text-white lg:flex">
      <NuxtLink to="/" class="inline-flex items-center gap-3 text-lg font-bold tracking-tight">
        <BrandLogo dark class="portal-wordmark" />
      </NuxtLink>
      <div class="my-auto max-w-md">
        <p class="mb-5 text-sm font-semibold uppercase tracking-[.18em] text-blue-200">MatterDraft account</p>
        <h1 class="font-heading text-5xl font-bold leading-[1.1] tracking-tight">Your account, in one place.</h1>
        <p class="mt-6 text-base leading-7 text-blue-100">Manage your account and the organisations you belong to.</p>
      </div>
    </aside>
    <main class="portal-auth-main flex min-h-screen items-center justify-center bg-studio-canvas px-5 py-10 sm:px-8">
      <ThemeToggle />
      <div class="w-full max-w-[440px]">
        <NuxtLink to="/" class="mb-10 inline-flex items-center gap-2 font-heading text-lg font-bold lg:hidden"><BrandLogo class="portal-wordmark" /></NuxtLink>
        <slot />
      </div>
    </main>
  </div>
</template>
