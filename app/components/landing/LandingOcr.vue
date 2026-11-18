<script setup lang="ts">
import { BadgeCheck, Play } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const state = ref<'ready' | 'scanning' | 'done'>('ready')
let timer: ReturnType<typeof setTimeout>
function run() {
  state.value = 'scanning'
  timer = setTimeout(() => {
    state.value = 'done'
  }, 700)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <section id="ocr" class="studio-section ocr-section-new">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.ocr" />
      <div class="two-col ocr-grid" data-enter>
        <article class="panel ocr-card">
          <header>
            01 / Scanned page (source)
            <span class="code-tag">Original preserved</span>
          </header>
          <div class="scan-sheet" :class="{ scanning: state === 'scanning' }">
            <i />
            <i />
            <i />
            <span>[Non-searchable bitmap image layer]</span>
            <i />
          </div>
          <footer>
            Aster Works v. Banyan Projects
            <span>MD-DEMO-026</span>
          </footer>
        </article>
        <article class="panel ocr-card recognized">
          <header>
            02 / Searchable working copy
            <span class="status-tag">{{ state === 'scanning' ? 'Scanning…' : 'OCR Ready' }}</span>
          </header>
          <div class="ocr-result" aria-live="polite">
            <h4>Supporting record: Clause 14.1 (Recognised)</h4>
            <p>
              “All contractual covenants and indemnities under this schedule shall remain enforceable across
              secondary filings...”
            </p>
            <small class="positive">
              <BadgeCheck :size="13" />
              {{
                state === 'done'
                  ? 'Sample text recognised. Ready for review.'
                  : 'Searchable text in this local example'
              }}
            </small>
          </div>
          <footer>
            <button class="mini-action" :disabled="state === 'scanning'" @click="run">
              <Play :size="12" />
              {{ state === 'scanning' ? 'Recognising…' : state === 'done' ? 'Run again' : 'Run OCR example' }}
            </button>
            Review recognised text before use
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
