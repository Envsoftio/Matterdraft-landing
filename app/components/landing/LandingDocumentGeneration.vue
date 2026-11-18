<script setup lang="ts">
import { Label } from 'reka-ui'
import { RefreshCw } from '@lucide/vue'
import { featureHeadings } from '~/data/feature-headings'
import { vAnimateChange } from '~/utils/landing/animate-change'
import SectionHeading from './SectionHeading.vue'
const fields = {
  applicant: 'Applicant',
  respondent: 'Respondent',
  number: 'Application number',
  date: 'Filing date',
  court: 'Court',
  representative: 'Authorised representative',
}
const draft = reactive({
  applicant: 'Aster Works Enterprise',
  respondent: 'Banyan Projects Infrastructure LLP',
  number: '26 of 2026',
  date: '7 April 2026',
  court: 'Commercial Court at Nashik',
  representative: 'Ananya Rao',
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
            <h3>Application to add delivery records</h3>
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
        <article v-animate-change="preview" class="panel court-paper" aria-live="polite">
          <header>
            <small>In the {{ preview.court }}</small>
            <h3>Application to add delivery records</h3>
            <small>Commercial application no. {{ preview.number }}</small>
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
            1. The applicant asks the court to accept the supply agreement dated 14 March 2026,
            delivery receipt DN-184 and the email dated 25 March 2026.
          </p>
          <p>
            2. The applicant asks that these records be included in the bundle and that the
            respondent be given an opportunity to reply.
          </p>
          <p>Filed on {{ preview.date }} by {{ preview.representative }} for the applicant.</p>
          <footer>
            <span>Fictional matter</span>
            <span v-if="generated" class="positive">Preview updated</span>
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
