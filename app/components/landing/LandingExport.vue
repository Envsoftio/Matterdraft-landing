<script setup lang="ts">
import { FileText, Files, FileType, Table2 } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const outputs = [
  [FileText, 'Combined PDF', 'Indexed & paginated'],
  [Files, 'Separate PDF volumes', 'Index for each volume'],
  [FileType, 'Word documents', 'From templates'],
  [Table2, 'Excel or CSV index', 'Page references in a table'],
] as const
</script>
<template>
  <section id="export" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.outputs" layout="stack" />
      <div class="outputs" data-enter>
        <article v-for="[icon, name, caption] in outputs" :key="name" class="panel">
          <component :is="icon" />
          <h3>{{ name }}</h3>
          <small>{{ caption }}</small>
        </article>
      </div>
    </div>
  </section>
</template>
