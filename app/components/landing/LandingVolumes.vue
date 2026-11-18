<script setup lang="ts">
import { ToggleGroupRoot, ToggleGroupItem, ProgressRoot, ProgressIndicator } from 'reka-ui'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const target = ref(300)
const documents = [18, 24, 60, 194, 125, 170, 148, 125]
const volumes = computed(() => {
  const result: { start: number; pages: number; count: number }[] = []
  let next = 1
  for (const size of documents) {
    let current = result.at(-1)
    if (!current || current.pages + size > target.value) {
      current = { start: next, pages: 0, count: 0 }
      result.push(current)
    }
    current.pages += size
    current.count++
    next += size
  }
  return result
})
function description(index: number, pages: number) {
  if (pages > target.value)
    return 'One source document exceeds the target. It stays together in this volume.'
  if (target.value === 300 && index === 1)
    return 'The 125-page Correspondence record begins intact here without a mid-document split.'
  if (index === volumes.value.length - 1)
    return 'Concludes the master bundle file. 864 document pages across 8 preserved source files.'
  return (
    'Leaves ' +
    (target.value - pages) +
    ' pages below target. Generates a dedicated Volume ' +
    (index + 1) +
    ' index.'
  )
}
</script>
<template>
  <section id="volumes" class="studio-section">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.volumes" layout="stack" />
      <div class="target-row">
        <strong>Target per volume:</strong>
        <ToggleGroupRoot
          type="single"
          :model-value="String(target)"
          aria-label="Target pages per volume"
          @update:model-value="
            (v) => {
              if (v) target = Number(v)
            }
          "
        >
          <ToggleGroupItem v-for="n in [150, 200, 300, 450]" :key="n" :value="String(n)">
            {{ n === 300 ? '~' : '' }}{{ n }} pages
          </ToggleGroupItem>
        </ToggleGroupRoot>
      </div>
      <div class="volume-grid" data-enter aria-live="polite">
        <article v-for="(volume, i) in volumes" :key="i" class="volume-card panel">
          <header>
            <h3>Volume {{ i + 1 }}</h3>
            <span class="status-tag">{{ volume.pages }} / {{ target }} pp</span>
          </header>
          <small>
            Pages {{ volume.start }}–{{ volume.start + volume.pages - 1 }} · {{ volume.count }}
            {{ volume.count === 1 ? 'document' : 'documents' }}
          </small>
          <ProgressRoot
            :model-value="Math.min(volume.pages, target)"
            :max="target"
            :aria-label="'Capacity for volume ' + (i + 1)"
            class="capacity"
          >
            <ProgressIndicator
              :style="{ width: Math.min(100, (volume.pages / target) * 100) + '%' }"
            />
          </ProgressRoot>
          <p>{{ description(i, volume.pages) }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
