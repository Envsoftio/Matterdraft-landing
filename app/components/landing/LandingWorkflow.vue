<script setup lang="ts">
const steps = [
  {
    title: 'Prepare the case papers',
    description: 'Bring PDFs and scans into a matter and prepare copies for the bundle.',
    link: 'See the matter workspace',
    href: '#matter-workspace',
    stages: [
      'Create or open a matter',
      'Import documents',
      'Edit working copies and run OCR',
      'Select and order the papers for the bundle',
    ],
  },
  {
    title: 'Build the bundle',
    description:
      'MatterDraft calculates the page numbers, index links and bookmarks from the papers you put in order.',
    link: 'Try changing the sample bundle',
    href: '#automation',
    stages: [
      'Review any draft documents',
      'Arrange the parts and choose volume limits',
      'Paginate the bundle',
      'Generate the index and bookmarks',
    ],
  },
  {
    title: 'Check and export the bundle',
    description:
      'Check the generated PDF and its page references before sharing or filing the bundle.',
    link: 'See what the export includes',
    href: '#export',
    stages: [
      'Review the flagged issues',
      'Check the volume boundaries',
      'Review the generated PDF',
      'Export the bundle',
    ],
  },
]
</script>
<template>
  <section id="workflow" class="studio-section alt" aria-labelledby="workflow-title">
    <div class="frame">
      <header class="section-heading stack">
        <h2 id="workflow-title">How you build a court bundle</h2>
        <p class="section-description">
          Follow the same steps with the fictional matter shown on this page.
        </p>
      </header>
      <ol class="workflow-grid" role="list">
        <li v-for="({ title, description, link, href, stages }, index) in steps" :key="href">
          <span class="workflow-step" aria-hidden="true">{{ index + 1 }}.</span>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
          <ol class="workflow-stages" :start="index * 4 + 1">
            <li v-for="stage in stages" :key="stage">{{ stage }}</li>
          </ol>
          <a :href="href" class="text-action">{{ link }}</a>
        </li>
      </ol>
    </div>
  </section>
</template>
