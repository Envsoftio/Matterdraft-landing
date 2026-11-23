<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { Check, ChevronDown } from '@lucide/vue'
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  id: string
  options: readonly (string | { value: string; label: string })[]
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  name?: string
}>()
const model = defineModel<string>()
const clearSelection = '__empty_selection__'
const choices = computed(() =>
  props.options.map((option) =>
    typeof option === 'string' ? { value: option, label: optionLabel(option) } : option,
  ),
)
const selection = computed({
  get: () =>
    model.value === '' && choices.value.some((option) => option.value === '')
      ? clearSelection
      : model.value,
  set: (value: string | undefined) => {
    model.value = value === clearSelection ? '' : value
  },
})
function optionLabel(value: string) {
  if (value !== value.toLowerCase()) return value
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ')
}
</script>

<template>
  <SelectRoot v-model="selection" :disabled="disabled" :name="name">
    <SelectTrigger :id="id" v-bind="$attrs" class="studio-select">
      <SelectValue class="studio-select-value" :placeholder="placeholder" />
      <SelectIcon class="studio-select-icon"><ChevronDown :size="14" /></SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper" :side-offset="4" class="studio-options">
        <SelectViewport>
          <SelectItem v-if="clearable && model" :value="clearSelection" class="studio-option">
            <SelectItemText>Clear selection</SelectItemText>
          </SelectItem>
          <SelectItem
            v-for="item in choices"
            :key="item.value"
            :value="item.value || clearSelection"
            class="studio-option"
          >
            <SelectItemText>
              {{ item.label }}
            </SelectItemText>
            <SelectItemIndicator><Check :size="14" /></SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
