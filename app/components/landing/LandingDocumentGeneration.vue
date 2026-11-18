<script setup lang="ts">
import { Label } from 'reka-ui'
import { RefreshCw } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import SectionHeading from './SectionHeading.vue'
const fields = {
  applicant: 'Applicant',
  respondent: 'Respondent',
  number: 'Matter Number',
  date: 'Date',
  court: 'Court Jurisdiction',
  representative: 'Deponent Representative',
}
const draft = reactive({
  applicant: 'Aster Works Enterprise',
  respondent: 'Banyan Projects Infrastructure LLP',
  number: 'DEMO / 026 / 2026',
  date: '18 Mar 2026',
  court: 'High Court Commercial Division',
  representative: 'Senior Authorized Officer',
})
const preview = ref({ ...draft })
const generated = ref(false)
function generate() {
  preview.value = { ...draft }
  generated.value = true
}
</script>
<template>
  <section id="document-generation" class="studio-section">
    <div class="frame">
      <SectionHeading v-bind="featureHeadings.templates" />
      <div class="template-grid" data-enter>
        <form
          class="panel template-form"
          autocomplete="off"
          aria-describedby="template-privacy"
          @submit.prevent="generate"
        >
          <header>
            <small>Template example</small>
            <h3>Procedural application</h3>
            <p id="template-privacy" class="mt-2 text-sm text-studio-muted">
              Use fictional details in this example.
            </p>
          </header>
          <div class="template-fields">
            <div
              v-for="(label, key) in fields"
              :key="key"
              :class="{ half: key === 'number' || key === 'date' }"
            >
              <Label :for="'field-' + key">{{ label }}</Label>
              <input :id="'field-' + key" v-model.trim="draft[key]" required maxlength="120" />
            </div>
          </div>
          <button class="mini-action" type="submit">
            <RefreshCw :size="14" />
            Generate template preview
          </button>
        </form>
        <article class="panel court-paper" aria-live="polite">
          <header>
            <small>In the {{ preview.court }}</small>
            <h3>Procedural application</h3>
            <small>Matter no: {{ preview.number }}</small>
          </header>
          <div class="parties">
            <span>
              APPLICANT:
              <b>{{ preview.applicant }}</b>
            </span>
            <span>
              RESPONDENT:
              <b>{{ preview.respondent }}</b>
            </span>
          </div>
          <p>1. The applicant requests permission to submit the documents listed in the bundle.</p>
          <p>2. The bundle index shows which volume and page each document appears on.</p>
          <p v-if="generated">{{ preview.date }} · {{ preview.representative }}</p>
          <footer>
            <span>Sample document</span>
            <span v-if="generated" class="positive">Preview updated</span>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
