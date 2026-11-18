<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Label,
} from 'reka-ui'
import { CircleCheck, CircleAlert } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import { categories } from '~/data/example-matter'
import SectionHeading from './SectionHeading.vue'
const findings = [
  { title: 'Missing date: Affidavit.pdf', action: 'Add date', label: 'Document date' },
  { title: 'Document category not assigned', action: 'Assign category', label: 'Document category' },
  { title: 'Page numbering requires review', action: 'Review numbering', label: 'Starting page' },
] as const
const editing = ref<number | null>(null)
const values = ref(['', '', ''])
const input = ref('')
const remaining = computed(() => values.value.filter((v) => !v).length)
function edit(index: number) {
  editing.value = index
  input.value = values.value[index] || (index === 2 ? '1' : '')
}
function save() {
  if (editing.value === null || !input.value) return
  values.value[editing.value] = input.value
  editing.value = null
}
</script>
<template>
  <section id="validation" class="studio-section alt">
    <div class="frame validation-grid">
      <div>
        <SectionHeading v-bind="featureHeadings.validation" layout="stack" />
        <p class="review-note">
          <strong>Review before filing.</strong>
          Check the final bundle against the court’s requirements.
        </p>
      </div>
      <div class="panel inspector" data-enter>
        <header>
          <strong>Pre-export bundle validation</strong>
          <span aria-live="polite">{{ remaining }} {{ remaining === 1 ? 'item' : 'items' }} to inspect</span>
        </header>
        <div class="check-row">
          <CircleCheck />
          Index generated
          <small>Page references present</small>
        </div>
        <div class="check-row">
          <CircleCheck />
          Bookmarks hierarchy generated
          <small>4-tier nested order</small>
        </div>
        <div
          v-for="(finding, i) in findings"
          :key="finding.title"
          class="check-row"
          :class="{ attention: !values[i] }"
        >
          <component :is="values[i] ? CircleCheck : CircleAlert" />
          <span>{{ values[i] ? finding.label + ': ' + values[i] : finding.title }}</span>
          <button @click="edit(i)">{{ values[i] ? 'Edit' : finding.action }}</button>
        </div>
      </div>
      <DialogRoot
        :open="editing !== null"
        @update:open="
          (open) => {
            if (!open) editing = null
          }
        "
      >
        <DialogPortal>
          <DialogOverlay class="studio-overlay" />
          <DialogContent v-if="editing !== null" class="studio-dialog">
            <DialogTitle>{{ findings[editing]?.action }}</DialogTitle>
            <DialogDescription>Update this finding in the sample bundle.</DialogDescription>
            <form @submit.prevent="save">
              <Label for="finding-value">{{ findings[editing]?.label }}</Label>
              <StudioSelect
                v-if="editing === 1"
                id="finding-value"
                v-model="input"
                :options="categories"
                placeholder="Choose a category"
              />
              <input
                v-else
                id="finding-value"
                v-model="input"
                :type="editing === 0 ? 'date' : 'number'"
                :min="editing === 2 ? 1 : undefined"
                required
              />
              <div class="dialog-actions">
                <DialogClose class="action secondary" type="button">Cancel</DialogClose>
                <button class="action primary" :disabled="!input">Save change</button>
              </div>
            </form>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
  </section>
</template>
