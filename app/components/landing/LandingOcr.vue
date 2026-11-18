<script setup lang="ts">
import { BadgeCheck, Play } from '@lucide/vue'
import { agreementRecordsClause, matterName, matterReference } from '~/data/example-matter'
import { featureHeadings } from '~/data/feature-headings'
import { vAnimateChange } from '~/utils/landing/animate-change'
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
            <h4>Supply agreement · Clause 3.2</h4>
            <p>{{ agreementRecordsClause }}</p>
          </div>
          <footer>
            {{ matterName }}
            <span>{{ matterReference }}</span>
          </footer>
        </article>
        <article class="panel ocr-card recognized">
          <header>
            02 / Searchable working copy
            <span v-animate-change="state" class="status-tag">
              {{ state === 'scanning' ? 'Scanning…' : 'OCR Ready' }}
            </span>
          </header>
          <div v-animate-change="state === 'done'" class="ocr-result" aria-live="polite">
            <h4>Supply agreement · Clause 3.2</h4>
            <p>{{ agreementRecordsClause }}</p>
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
              {{
                state === 'scanning'
                  ? 'Recognising…'
                  : state === 'done'
                    ? 'Run again'
                    : 'Run OCR example'
              }}
            </button>
            Review recognised text before use
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
