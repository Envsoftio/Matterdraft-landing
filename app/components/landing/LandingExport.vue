<script setup lang="ts">
import { FileText, Files, FileType, Table2, SquarePlay, FolderArchive } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const outputs = [
  [FileText, 'Combined PDF', 'Indexed & paginated'],
  [Files, 'Individual Volumes', 'Dedicated indexes'],
  [FileType, 'Word Documents', 'Template outputs'],
  [Table2, 'Excel / CSV Index', 'Structured tabular'],
  [SquarePlay, 'PowerPoint', 'Where supported'],
  [FolderArchive, 'Structured ZIP', 'Complete archive'],
] as const
</script>
<template>
  <section id="export" class="studio-section alt">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.outputs" layout="stack" />
      <div class="outputs" data-enter>
        <article v-for="[icon, name, caption] in outputs" :key="name" class="panel">
          <component :is="icon" />
          <h4>{{ name }}</h4>
          <small>{{ caption }}</small>
        </article>
      </div>
    </div>
  </section>
</template>
