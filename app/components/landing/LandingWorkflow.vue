<script setup lang="ts">
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const steps = [
  ['Create / open matter', 'Start with the case context.'],
  ['Import documents', 'Bring PDFs, Word files and images.'],
  ['Process & OCR', 'Prepare pages and recognise text.'],
  ['Organise & categorise', 'Set groups, relationships and order.'],
  ['Generate documents', 'Fill the selected templates.'],
  ['Collate', 'Arrange the parts of the bundle.'],
  ['Paginate', 'Calculate the numbered ranges.'],
  ['Index & bookmark', 'Build references and navigation.'],
  ['Validate', 'Inspect rule-based findings.'],
  ['Split into volumes', 'Preserve document boundaries.'],
  ['Review', 'Check the generated result.'],
  ['Export', 'Create structured final files.'],
]
</script>
<template>
  <section id="workflow" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.workflow" layout="stack" />
      <ol class="workflow-grid" role="list" data-enter>
        <li v-for="([name, caption], i) in steps" :key="name" class="panel">
          <small aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</small>
          <h3>{{ name }}</h3>
          <p>{{ caption }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
