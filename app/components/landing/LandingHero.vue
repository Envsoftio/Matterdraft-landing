<script setup lang="ts">
import {
  ToggleGroupRoot,
  ToggleGroupItem,
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import {
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Crop,
  Download,
  Eraser,
  FileText,
  FolderOpen,
  GripVertical,
  ListChecks,
  Monitor,
  PencilLine,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  X,
  Zap,
} from '@lucide/vue'
import { matterName, matterReference, numberedDocuments } from '~/data/example-matter'
import { vAnimateChange } from '~/utils/landing/animate-change'
import site from '~~/content/site.json'
const selected = ref('Agreement')
const steps = [
  ['Import', '#matter-workspace'],
  ['OCR', '#ocr'],
  ['Organise', '#matter-workspace'],
  ['Collate', '#collation'],
  ['Paginate', '#automation'],
  ['Index', '#automation'],
  ['Validate', '#validation'],
  ['Export', '#export'],
] as const
const compact = ref(false)
const workspace = useTemplateRef('workspace')
let mobileQuery: MediaQueryList | undefined
function updateLayout() {
  compact.value = Boolean(mobileQuery?.matches)
}
onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 640px)')
  updateLayout()
  mobileQuery.addEventListener('change', updateLayout)
})
onBeforeUnmount(() => mobileQuery?.removeEventListener('change', updateLayout))
watch(
  [compact, selected],
  () => {
    if (!compact.value) return
    const list = workspace.value?.querySelector<HTMLElement>('.document-list')
    const active = list?.querySelector<HTMLElement>('[data-state="on"]')
    if (!list || !active) return
    const offset = active.getBoundingClientRect().left - list.getBoundingClientRect().left
    if (offset < 0 || offset + active.offsetWidth > list.clientWidth) list.scrollLeft += offset - 4
  },
  { flush: 'post' },
)
const file = computed(() => numberedDocuments.find((doc) => doc.name === selected.value)!)
let gesture: { x: number; y: number } | undefined
function startGesture(event: PointerEvent) {
  if (event.pointerType === 'touch' && event.isPrimary)
    gesture = { x: event.clientX, y: event.clientY }
}
function finishGesture(event: PointerEvent) {
  if (!gesture || !event.isPrimary) return
  const dx = event.clientX - gesture.x
  const dy = event.clientY - gesture.y
  gesture = undefined
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  const index = numberedDocuments.findIndex((doc) => doc.name === selected.value)
  const next = numberedDocuments[index + (dx < 0 ? 1 : -1)]
  if (next) selected.value = next.name
}
</script>

<template>
  <section class="studio-hero" id="landing-hero" aria-labelledby="hero-title">
    <div class="frame hero-intro">
      <p class="hero-eyebrow">Desktop document preparation for advocates and chambers</p>
      <h1 id="hero-title">From case papers to an indexed court bundle</h1>
      <p class="hero-description">
        Bring your PDFs and scans into one matter, edit working copies and choose which papers go in
        the bundle. Add a late annexure or change the order, then rebuild to update the page
        numbers, linked index and bookmarks together. Review the result and export one PDF or
        separate volumes.
      </p>
      <div class="hero-actions">
        <a href="#early-access" class="action primary">
          <Zap aria-hidden="true" />
          Early access
        </a>
        <a href="#workflow" class="action secondary">
          Explore the workflow
          <ArrowDown aria-hidden="true" />
        </a>
      </div>
      <p class="hero-privacy">
        <a href="#local-processing">
          <ShieldCheck :size="16" aria-hidden="true" />
          <span
            >Case files stay on your computer. Your workspace and matter backups are
            encrypted.</span
          >
        </a>
      </p>
      <p class="hero-offer">
        <BadgeCheck :size="16" aria-hidden="true" />
        <span>Early access signups get <strong>one month free after launch.</strong></span>
      </p>
      <p class="hero-survey">
        <a
          class="survey-link text-action"
          :href="site.advocateSurveyUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Advocate survey on Google Forms
          <ArrowUpRight :size="14" aria-hidden="true" />
        </a>
      </p>
    </div>
    <figure
      id="workspace-preview"
      ref="workspace"
      class="workspace-window"
      aria-label="Fictional matter workspace preview"
    >
      <figcaption class="window-bar">
        <span class="traffic-lights" aria-hidden="true"><i /><i /><i /></span>
        <span class="window-caption">
          <Monitor :size="14" />
          <span class="window-product">MatterDraft Studio ·</span>
          <b>{{ matterName }}</b>
          <span class="window-reference">({{ matterReference }})</span>
        </span>
        <span class="local-state">Fictional matter</span>
      </figcaption>
      <div class="workspace-columns">
        <aside class="workspace-side">
          <div class="workspace-label">
            Matter documents ({{ numberedDocuments.length }})
            <span class="code-tag">196 pages</span>
          </div>
          <ToggleGroupRoot
            type="single"
            :model-value="selected"
            :orientation="compact ? 'horizontal' : 'vertical'"
            class="document-list"
            aria-label="Select a sample document"
            @update:model-value="
              (value) => {
                if (value) selected = String(value)
              }
            "
          >
            <ToggleGroupItem
              v-for="doc in numberedDocuments"
              :key="doc.name"
              :value="doc.name"
              class="document-item"
            >
              <GripVertical :size="13" />
              <FileText :size="16" />
              <strong>{{ doc.name }}.pdf</strong>
              <small>{{ doc.pages }} pp</small>
            </ToggleGroupItem>
          </ToggleGroupRoot>
          <a class="preflight" href="#validation">
            <span>
              <ListChecks :size="15" />
              Bundle checks
              <b>3 items to review</b>
            </span>
            <i />
          </a>
        </aside>
        <div
          class="document-desk"
          @pointerdown="startGesture"
          @pointerup="finishGesture"
          @pointercancel="gesture = undefined"
        >
          <div class="reading-tools">
            <span v-animate-change="file.pages">Page 1 of {{ file.pages }}</span>
            <i />
            <span>Zoom 100%</span>
            <i />
            <span class="positive">
              <ScanSearch :size="12" />
              Searchable text
            </span>
            <span class="reading-icons" aria-hidden="true">
              <RefreshCw />
              <Crop />
              <PencilLine />
              <Eraser />
            </span>
          </div>
          <article class="sample-paper" aria-live="polite" :key="file.name">
            <header>
              <div>
                <small>
                  {{ file.name === 'Agreement' ? 'ANNEXURE A' : file.name.toUpperCase() }} / BUNDLE
                  PAGES {{ file.start }}–{{ file.end }}
                </small>
                <h3>{{ file.name }} (Working Copy)</h3>
              </div>
              <div class="paper-ref">
                REF: {{ matterReference }}
                <b>Original Preserved</b>
              </div>
            </header>
            <h4>{{ file.heading }}</h4>
            <p>{{ file.excerpt }}</p>
            <blockquote>
              <strong>
                <PencilLine :size="13" />
                Review note
              </strong>
              {{ file.reviewNote }}
            </blockquote>
            <p class="paper-note">{{ file.recordNote }}</p>
            <footer>
              <span>{{ matterName }}</span>
              <span class="code-tag">BATES NO. MD-{{ String(file.start).padStart(4, '0') }}</span>
            </footer>
          </article>
        </div>
        <aside class="workspace-side references">
          <div class="workspace-label">
            Bundle index
            <small>Page references</small>
          </div>
          <div class="index-list">
            <button
              v-for="(doc, i) in numberedDocuments"
              :key="doc.name"
              :class="{ chosen: doc.name === selected }"
              :aria-pressed="doc.name === selected"
              @click="selected = doc.name"
            >
              <span>{{ i + 1 }}. {{ doc.name }}</span>
              <span>p. {{ doc.start }}</span>
            </button>
          </div>
          <div class="workspace-label">
            Bookmarks
            <small>Parts and documents</small>
          </div>
          <div
            v-for="(part, i) in ['Core documents', 'Supporting documents']"
            :key="part"
            class="bookmark-group"
          >
            <strong>
              <FolderOpen :size="13" />
              {{ i + 1 }}. {{ part }}
            </strong>
            <button
              v-for="(doc, j) in numberedDocuments.filter((doc) => doc.part === i)"
              :key="doc.name"
              :class="{ chosen: doc.name === selected }"
              @click="selected = doc.name"
            >
              <span>{{ i + 1 }}{{ j === 0 ? 'a' : 'b' }}. {{ doc.name }}</span>
              p. {{ doc.start }}
            </button>
          </div>
          <DialogRoot>
            <DialogTrigger class="export-example">
              <Download :size="15" />
              Preview bundle export
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="studio-overlay" />
              <DialogContent class="studio-dialog">
                <DialogTitle>Bundle export preview</DialogTitle>
                <DialogDescription>
                  This fictional matter contains six documents across four parts and 196 numbered
                  pages. The preview shows what a bundle includes.
                </DialogDescription>
                <ul class="export-checks">
                  <li
                    v-for="item in [
                      'Index and page ranges generated',
                      'Document bookmarks included',
                      'Three pre-flight findings to review',
                    ]"
                    :key="item"
                  >
                    <Check :size="16" />
                    {{ item }}
                  </li>
                </ul>
                <DialogClose class="action secondary">
                  Close preview
                  <X :size="14" />
                </DialogClose>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </aside>
      </div>
    </figure>
  </section>
  <nav class="bundle-shortcuts" aria-labelledby="bundle-shortcuts-title">
    <div class="frame">
      <strong id="bundle-shortcuts-title">Explore the bundle workflow</strong>
      <ol role="list">
        <li v-for="([label, href], index) in steps" :key="label">
          <a :href="href"
            ><span aria-hidden="true">{{ index + 1 }}.</span> {{ label }}</a
          >
        </li>
      </ol>
    </div>
  </nav>
</template>
