<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot, Toggle } from 'reka-ui'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  id: string
  label: string
  hint?: string
  type?: string
  disabled?: boolean
}>()
const model = defineModel<string>()
const isPassword = computed(() => props.type === 'password')
const passwordVisible = ref(false)
</script>

<template>
  <FieldRoot>
    <div class="flex items-center justify-between gap-3">
      <FieldLabel :for="id" class="portal-label">{{ label }}</FieldLabel>
      <slot />
    </div>
    <div class="relative">
      <span v-if="$slots.icon" class="field-icon" aria-hidden="true"><slot name="icon" /></span>
      <FieldControl
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :type="isPassword && passwordVisible ? 'text' : type"
        :disabled="disabled"
        class="portal-input"
        :class="{ 'password-input': isPassword, 'input-with-icon': $slots.icon }"
      />
      <Toggle
        v-if="isPassword"
        v-model="passwordVisible"
        :disabled="disabled"
        :aria-controls="id"
        aria-label="Show password"
        class="password-toggle"
      >
        <EyeOff v-if="passwordVisible" :size="20" aria-hidden="true" />
        <Eye v-else :size="20" aria-hidden="true" />
      </Toggle>
    </div>
    <FieldDescription v-if="hint" class="mt-2 text-xs text-studio-muted">{{
      hint
    }}</FieldDescription>
    <FieldError class="mt-2 text-xs text-studio-danger" />
  </FieldRoot>
</template>

<style scoped>
.field-icon {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 13px;
  display: grid;
  place-items: center;
  color: var(--input-icon-color, var(--body-text));
  pointer-events: none;
}

.input-with-icon {
  padding-inline-start: 41px;
}

.password-input {
  padding-inline-end: 48px;
}

.password-input::-ms-reveal {
  display: none;
}

.password-toggle {
  position: absolute;
  inset-block: 2px;
  inset-inline-end: 2px;
  display: grid;
  inline-size: 40px;
  place-items: center;
  border-radius: 6px;
  color: var(--body-text);
}

.password-toggle:hover:enabled {
  background: var(--tint);
  color: var(--heading);
}

.password-toggle:active:enabled {
  background: var(--chip);
}

.password-toggle:focus-visible {
  outline-offset: -2px;
}
</style>
