<script setup lang="ts">
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const shortcuts = [
  ['O', 'Open Matter'],
  ['S', 'Save Local'],
  ['F', 'Search Bundle'],
  ['P', 'Print / Export'],
]
const modifier = ref('Ctrl')
onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform)) modifier.value = '⌘'
})
</script>
<template>
  <section id="local-processing" class="studio-section">
    <div class="frame two-col local-grid">
      <SectionHeading v-bind="featureHeadings.local" layout="stack" />
      <div class="panel shortcut-panel" data-enter>
        <strong>Everyday desktop essentials</strong>
        <dl>
          <div v-for="[key, name] in shortcuts" :key="key">
            <dt>
              <kbd>{{ modifier }} + {{ key }}</kbd>
            </dt>
            <dd>{{ name }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
