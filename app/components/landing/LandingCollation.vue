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
import SectionHeading from './SectionHeading.vue'
const files = ref(documents.map((d) => ({ ...d })))
const extra = ref(false)
const dragging = ref('')
const rows = computed(() =>
  numberDocuments(
    categories.flatMap((_, i) =>
      files.value
        .filter((d) => d.part === i)
        .map((d) => ({ ...d, pages: d.pages + (extra.value && d.name === 'Affidavit' ? 2 : 0) }))
    )
  )
)
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
          v-for="(name, i) in categories"
          :key="name"
          class="part-card panel"
          @dragover.prevent
          @drop.prevent="move(dragging, i)"
        >
          <header>
            Part 0{{ i + 1 }}
            <span>
              {{ rows.filter((d) => d.part === i).length }}
              {{ rows.filter((d) => d.part === i).length === 1 ? 'document' : 'documents' }}
            </span>
          </header>
          <h3>{{ name }}</h3>
          <DropdownMenuRoot v-for="doc in rows.filter((d) => d.part === i)" :key="doc.name">
            <DropdownMenuTrigger
              class="part-file"
              draggable="true"
              :aria-label="'Move ' + doc.name"
              @dragstart="startDragging($event, doc.name)"
              @dragend="dragging = ''"
              @drop.stop.prevent="move(dragging, i, doc.name)"
            >
              <span>{{ doc.name }}.pdf</span>
              {{ doc.start }}–{{ doc.end }}
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent class="studio-options" :side-offset="4">
                <DropdownMenuItem
                  v-for="(part, j) in categories"
                  :key="part"
                  class="studio-option"
                  @select="move(doc.name, j)"
                >
                  Move to end of {{ part }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
          <footer>
            Part total: {{ rows.filter((d) => d.part === i).reduce((total, d) => total + d.pages, 0) }} pages
          </footer>
        </article>
      </div>
      <div class="part-actions panel">
        <button :aria-pressed="extra" @click="extra = !extra">
          {{ extra ? 'Remove 2 added pages' : 'Add 2 pages to Affidavit' }}
        </button>
        <button @click="reset">Reset example</button>
        <span>Combine the parts → Pagination → Index &amp; bookmarks → Volume allocation → Final bundle</span>
      </div>
      <span class="sr-only" role="status">{{ rows.at(-1)?.end }} pages across four parts</span>
    </div>
  </section>
</template>
