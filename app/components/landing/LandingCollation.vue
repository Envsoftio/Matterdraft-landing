<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui'
import { documents, categories, numberDocuments } from '~/data/example-matter'
import { featureHeadings } from '~/data/feature-headings'
import { vAnimateChange } from '~/utils/landing/animate-change'
import SectionHeading from './SectionHeading.vue'
const files = ref(documents.map((d) => ({ ...d })))
const extra = ref(false)
const dragging = ref('')
const rows = computed(() =>
  numberDocuments(
    categories.flatMap((_, i) =>
      files.value
        .filter((d) => d.part === i)
        .map((d) => ({ ...d, pages: d.pages + (extra.value && d.name === 'Affidavit' ? 2 : 0) })),
    ),
  ),
)
const parts = computed(() =>
  categories.map((name, index) => {
    const documents = rows.value.filter((document) => document.part === index)
    const pages = documents.reduce((total, document) => total + document.pages, 0)
    return { name, documents, pages }
  }),
)
const agreementStart = computed(() => rows.value.find(({ name }) => name === 'Agreement')?.start)
function move(name: string, part: number, before?: string) {
  const doc = files.value.find((d) => d.name === name)
  if (!doc || name === before) return
  const others = files.value.filter((d) => d !== doc)
  const index = before ? others.findIndex((d) => d.name === before) : -1
  others.splice(index < 0 ? others.length : index, 0, { ...doc, part })
  files.value = others
  dragging.value = ''
}
function startDragging(event: DragEvent, name: string) {
  dragging.value = name
  event.dataTransfer?.setData('text/plain', name)
}
function reset() {
  files.value = documents.map((d) => ({ ...d }))
  extra.value = false
}
</script>
<template>
  <section id="automation" class="studio-section alt">
    <div id="collation" class="frame">
      <SectionHeading v-bind="featureHeadings.collation" />
      <div class="part-grid" data-enter>
        <article
          v-for="(part, i) in parts"
          :key="part.name"
          class="part-card panel"
          @dragover.prevent
          @drop.prevent="move(dragging, i)"
        >
          <header>
            Part 0{{ i + 1 }}
            <span v-animate-change="part.documents.length">
              {{ part.documents.length }}
              {{ part.documents.length === 1 ? 'document' : 'documents' }}
            </span>
          </header>
          <h3>{{ part.name }}</h3>
          <DropdownMenuRoot v-for="doc in part.documents" :key="doc.name">
            <DropdownMenuTrigger
              class="part-file"
              draggable="true"
              :aria-label="'Move ' + doc.name"
              @dragstart="startDragging($event, doc.name)"
              @dragend="dragging = ''"
              @drop.stop.prevent="move(dragging, i, doc.name)"
            >
              <span>{{ doc.name }}.pdf</span>
              <span v-animate-change="`${doc.start}–${doc.end}`" class="shrink-0">
                {{ doc.start }}–{{ doc.end }}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent class="studio-options" :side-offset="4">
                <DropdownMenuItem
                  v-for="(category, j) in categories"
                  :key="category"
                  class="studio-option"
                  @select="move(doc.name, j)"
                >
                  Move to end of {{ category }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
          <footer v-animate-change="part.pages">
            Part total:
            {{ part.pages }} pages
          </footer>
        </article>
      </div>
      <div class="part-actions panel">
        <button :aria-pressed="extra" @click="extra = !extra">
          {{ extra ? 'Remove 2 added pages' : 'Add 2 pages to Affidavit' }}
        </button>
        <button @click="reset">Reset example</button>
        <span
          >Combine the parts → Pagination → Index &amp; bookmarks → Volume allocation → Final
          bundle</span
        >
      </div>
      <p class="mt-3 text-sm text-studio-muted" role="status">
        Agreement.pdf starts on page <strong>{{ agreementStart }}</strong>. The sample bundle has
        <strong>{{ rows.at(-1)?.end }}</strong> pages across four parts.
      </p>
    </div>
  </section>
</template>
