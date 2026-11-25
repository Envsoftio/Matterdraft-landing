<script setup lang="ts">
defineProps<{ loading?: boolean; pending?: boolean; customer?: boolean }>()
</script>

<template>
  <div class="portal-async-content" :aria-busy="loading || pending">
    <Transition name="portal-result" appear>
      <div
        v-if="loading"
        key="loading"
        class="portal-content"
        :class="{ 'customer-content': customer }"
        role="status"
      >
        <p class="body-6 text-studio-muted">Loading…</p>
        <div class="portal-loading-shape" aria-hidden="true">
          <div class="portal-loading-line" />
          <div class="portal-loading-line" />
          <div class="portal-loading-panel" />
        </div>
      </div>
      <div v-else key="content" class="portal-loaded-content" :class="{ 'is-refreshing': pending }">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.portal-async-content {
  position: relative;
}
.portal-loaded-content {
  transition: opacity 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.portal-loaded-content.is-refreshing {
  opacity: 0.65;
}
.portal-result-enter-active {
  transition:
    opacity 300ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.portal-result-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.portal-result-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.portal-result-leave-to {
  opacity: 0;
}
.portal-loading-shape {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}
.portal-loading-line,
.portal-loading-panel {
  border-radius: 8px;
  background: var(--chip);
}
.portal-loading-line {
  height: 16px;
  width: 40%;
}
.portal-loading-line + .portal-loading-line {
  width: 65%;
}
.portal-loading-panel {
  height: 160px;
}
@media (prefers-reduced-motion: reduce) {
  .portal-loaded-content,
  .portal-result-enter-active,
  .portal-result-leave-active {
    transition: none;
  }
  .portal-result-enter-from {
    transform: none;
  }
}
</style>
