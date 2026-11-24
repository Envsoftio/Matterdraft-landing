<script setup lang="ts">
import { Files, FolderOpen, ListChecks, ScanSearch } from '@lucide/vue'
import SectionHeading from './SectionHeading.vue'

const capabilities = [
  {
    icon: FolderOpen,
    title: 'Organise case papers',
    description:
      'Choose the papers that go in the bundle and keep the rest in the matter for reference.',
    href: '#matter-workspace',
  },
  {
    icon: ScanSearch,
    title: 'Prepare working copies',
    description:
      'Reorder PDF pages and make scanned text searchable while preserving the originals.',
    href: '#pdf-engine',
  },
  {
    icon: ListChecks,
    title: 'Revise the bundle as papers change',
    description:
      'Rebuild after adding or moving a document so the page numbers, index and bookmarks agree.',
    href: '#automation',
  },
  {
    icon: Files,
    title: 'Export an indexed PDF',
    description: 'Save one combined PDF or separate volumes with their own indexes.',
    href: '#export',
  },
]
</script>

<template>
  <section id="product" class="studio-section">
    <div class="frame">
      <SectionHeading
        title="What you can do in MatterDraft"
        description="Keep your originals, working copies and finished court bundles together on your computer."
      />
      <div class="product-capabilities">
        <article
          v-for="{ icon, title, description, href } in capabilities"
          :key="href"
          class="panel"
        >
          <span class="icon-tile"><component :is="icon" aria-hidden="true" /></span>
          <h3>
            <a :href="href" class="text-action">{{ title }}</a>
          </h3>
          <p>{{ description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
