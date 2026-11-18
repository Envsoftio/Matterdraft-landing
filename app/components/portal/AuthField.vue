<script setup lang="ts">
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'

defineOptions({ inheritAttrs: false })
defineProps<{ id: string; label: string; hint?: string }>()
const model = defineModel<string>()
</script>

<template>
  <FieldRoot>
    <div class="flex items-center justify-between gap-3">
      <FieldLabel :for="id" class="portal-label">{{ label }}</FieldLabel>
      <slot />
    </div>
    <FieldControl :id="id" v-model="model" v-bind="$attrs" class="portal-input" />
    <FieldDescription v-if="hint" class="mt-2 text-xs text-studio-muted">{{ hint }}</FieldDescription>
    <FieldError class="mt-2 text-xs text-studio-danger" />
  </FieldRoot>
</template>
