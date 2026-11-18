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
        <form class="panel template-form" @submit.prevent="generate">
          <header>
            <small>Dynamic form fields</small>
            <h3>Procedural Application Generator</h3>
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
          <p>
            1. The Applicant respectfully submits this application seeking leave for expedited presentation of
            the evidentiary bundle annexures listed in this matter.
          </p>
          <p>
            2. The evidentiary exhibits referenced herein have been indexed and partitioned into volumes to
            facilitate direct bench review.
          </p>
          <p v-if="generated">{{ preview.date }} · {{ preview.representative }}</p>
          <footer>
            <span>Template-driven document preview 01</span>
            <span class="positive">{{ generated ? 'Preview updated' : 'Structured document preview' }}</span>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
