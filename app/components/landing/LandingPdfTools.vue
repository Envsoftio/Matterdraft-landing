<script setup lang="ts">
import { ToolbarRoot, ToolbarButton } from 'reka-ui'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const operations: Record<string, string> = {
  Merge: 'Two working copies are combined into one document.',
  Split: 'The working copy is split at the selected page.',
  Extract: 'The selected page is copied into a separate document.',
  Reorder: 'Page 2 now appears before page 1 in the working copy.',
  Replace: 'The selected page is replaced in the working copy.',
  Insert: 'A new page is inserted after the current page.',
  Delete: 'The selected page is removed from the working copy.',
  Highlight: 'The selected clause is highlighted for review.',
  Comment: 'A review note is attached to the selected clause.',
  Redact: 'The selected text is masked in this example.',
  Rotate: 'The working page is rotated 90 degrees clockwise.',
  Crop: 'The margins of the working page are trimmed.',
}
const selection = ref('Highlight')
const changed = ref(false)
function apply(tool: string) {
  selection.value = tool
  changed.value = true
}
</script>
<template>
  <section id="pdf-engine" class="studio-section">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.pdf" />
      <div class="pdf-bench panel" data-enter>
        <ToolbarRoot aria-label="Sample PDF tools" class="pdf-toolbar">
          <template
            v-for="(group, index) in [
              Object.keys(operations).slice(0, 7),
              Object.keys(operations).slice(7),
            ]"
            :key="index"
          >
            <strong>{{ index ? 'Page tools' : 'Document tools' }}</strong>
            <ToolbarButton
              v-for="tool in group"
              :key="tool"
              :aria-pressed="selection === tool"
              :class="{ danger: tool === 'Delete' }"
              @click="apply(tool)"
            >
              {{ tool }}
            </ToolbarButton>
          </template>
        </ToolbarRoot>
        <div class="two-col pdf-details">
          <article class="pdf-paper">
            <small>Imported original preserved</small>
            <h3>{{ changed ? selection + ' · Working copy' : 'Sample PDF working copy' }}</h3>
            <p aria-live="polite">
              {{
                changed
                  ? operations[selection]
                  : 'Try the tools on this sample. In the desktop app, changes are made to a working copy so the original stays intact.'
              }}
            </p>
            <footer>
              Page 1 of {{ selection === 'Delete' ? 38 : selection === 'Insert' ? 40 : 39 }}　 Zoom
              100%　
              <span class="positive">Sample working copy</span>
            </footer>
          </article>
          <div class="pdf-notes">
            <article>
              <h4>Bring different source formats together</h4>
              <p>
                Work with PDFs, Word documents and images. Convert images and documents to PDF
                within the preparation workflow.
              </p>
            </article>
            <article>
              <h4>Prepare the output you need</h4>
              <p>
                Compress PDFs and use PDF conversion where supported. Review conversion results
                before including them in the bundle.
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
