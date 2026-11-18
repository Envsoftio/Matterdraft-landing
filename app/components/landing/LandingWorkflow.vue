<script setup lang="ts">
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const steps = [
  ['Create / open matter', 'Start with the case context.', '#matter-workspace'],
  ['Import documents', 'Bring PDFs, Word files and images.', '#matter-workspace'],
  ['Process & OCR', 'Prepare pages and recognise text.', '#ocr'],
  ['Organise & categorise', 'Set groups, relationships and order.', '#matter-workspace'],
  ['Generate documents', 'Fill the selected templates.', '#document-generation'],
  ['Collate', 'Arrange the parts of the bundle.', '#collation'],
  ['Paginate', 'Calculate the numbered ranges.', '#automation'],
  ['Index & bookmark', 'Build references and navigation.', '#automation'],
  ['Validate', 'Inspect rule-based findings.', '#validation'],
  ['Split into volumes', 'Preserve document boundaries.', '#volumes'],
  ['Review', 'Check the generated result.', '#validation'],
  ['Export', 'Create structured final files.', '#export'],
]
</script>
<template>
  <section id="workflow" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.workflow" layout="stack" />
      <ol class="workflow-grid" data-enter>
        <li v-for="([name, caption, href], i) in steps" :key="name">
          <a :href="href" class="panel">
            <small>{{ String(i + 1).padStart(2, '0') }}</small>
            <h4>{{ name }}</h4>
            <p>{{ caption }}</p>
          </a>
        </li>
      </ol>
    </div>
  </section>
</template>
