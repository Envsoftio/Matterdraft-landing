<script setup lang="ts">
const lines = ['Change the document order.', 'The index and bookmarks follow.']
const heading = useTemplateRef('heading')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (
    !heading.value ||
    !('IntersectionObserver' in window) ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return

  observer = new IntersectionObserver(
    (entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue
        target.classList.add('revealed')
        observer?.unobserve(target)
      }
    },
    { rootMargin: '0px 0px -15% 0px' },
  )

  for (const word of heading.value.querySelectorAll('.bundle-note-word')) {
    if (word.getBoundingClientRect().top >= window.innerHeight) {
      word.classList.add('pending-reveal')
      observer.observe(word)
    }
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="studio-section bundle-note" aria-labelledby="bundle-note-title">
    <div class="frame">
      <h2 id="bundle-note-title" ref="heading" :aria-label="lines.join(' ')">
        <span v-for="line in lines" :key="line" class="bundle-note-line" aria-hidden="true">
          <template v-for="(word, index) in line.split(' ')" :key="index">
            <span class="bundle-note-word" :style="{ transitionDelay: `${index * 42}ms` }">{{
              word
            }}</span>{{ ' ' }}
          </template>
        </span>
      </h2>
    </div>
  </section>
</template>
