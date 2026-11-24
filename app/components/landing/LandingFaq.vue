<script setup lang="ts">
import site from '~~/content/site.json'
</script>

<template>
  <section id="faq" class="studio-section" aria-labelledby="faq-title">
    <div class="frame faq-layout">
      <header class="section-heading stack">
        <h2 id="faq-title">Frequently asked questions</h2>
      </header>
      <div class="faq-list">
        <div v-for="{ question, answer, link } in site.faq" :key="question" class="faq-answer">
          <h3>{{ question }}</h3>
          <p>{{ answer }}</p>
          <NuxtLink v-if="link" :to="link.path" class="text-action">
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
