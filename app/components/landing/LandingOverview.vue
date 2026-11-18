<script setup lang="ts">
import { Files, FolderOpen, LockKeyhole, PanelsTopLeft } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const capabilities = [
  {
    icon: PanelsTopLeft,
    label: '01 / Organise',
    title: 'Gather the matter.',
    text: 'Bring PDFs and scanned images into one place. Arrange the documents in the order you need.',
  },
  {
    icon: FolderOpen,
    label: '02 / Prepare',
    title: 'Work through the pages.',
    text: 'Use page tools and OCR to prepare the working copies while preserving the originals.',
  },
  {
    icon: Files,
    label: '03 / Review',
    title: 'Check the details.',
    text: 'Inspect the sequence, page references and output. Give flagged items a closer look.',
  },
  {
    icon: LockKeyhole,
    label: '04 / Export',
    title: 'Build the bundle.',
    text: 'Export indexed, numbered and bookmarked PDFs, as one bundle or separate volumes.',
  },
]
const darkCapabilities = [
  [
    'Document processing',
    'Work with PDFs, documents and scans. Redact, run OCR, split, reorder and compress working copies.',
  ],
  [
    'Legal workflow',
    'Organise matters and generate documents. Maintain structured multi-part groupings from day one.',
  ],
  [
    'Automation',
    'Coordinate pages, indexes and bookmarks. Keep running Bates pagination aligned automatically.',
  ],
  [
    'Local-first control',
    'Keep core document work on your desktop while preparing and reviewing files.',
  ],
] as const
</script>
<template>
  <section id="product" class="studio-section">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.overview" class="light-design" />
      <SectionHeading
        v-bind="featureHeadings.overview"
        label="Matter preparation"
        class="dark-design"
      />
      <div class="capability-grid">
        <article
          v-for="(card, i) in capabilities"
          :key="card.label"
          class="capability-card"
          data-enter
        >
          <span class="icon-tile"><component :is="card.icon" /></span>
          <div class="light-design">
            <small>{{ card.label }}</small>
            <h3>{{ card.title }}</h3>
            <p>{{ card.text }}</p>
          </div>
          <div class="dark-design">
            <small>0{{ i + 1 }} / Capability</small>
            <h3>{{ darkCapabilities[i]?.[0] }}</h3>
            <p>{{ darkCapabilities[i]?.[1] }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
