<script setup lang="ts">
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const protections = [
  [
    'Encrypted workspace',
    'MatterDraft encrypts case files and working copies stored in your local vault.',
  ],
  [
    'Encrypted matter backups',
    'Save a .matterdraft backup and restore it with the PIN or recovery key used to protect it.',
  ],
  ['Originals stay intact', 'Edit working copies while keeping the files you imported intact.'],
]
</script>
<template>
  <section id="local-processing" class="studio-section">
    <div class="frame two-col local-grid">
      <div>
        <SectionHeading v-bind="featureHeadings.local" layout="stack" />
        <NuxtLink
          class="mt-3 inline-block text-sm text-studio-accent underline underline-offset-4"
          to="/privacy"
        >
          Read the Privacy Policy
        </NuxtLink>
      </div>
      <dl class="panel privacy-panel" data-enter>
        <div v-for="[title, description] in protections" :key="title">
          <dt>{{ title }}</dt>
          <dd>{{ description }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
