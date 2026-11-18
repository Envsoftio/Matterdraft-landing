// Keep every section readable with JavaScript disabled or reduced motion enabled.
export function useLandingExperience() {
  let observer: IntersectionObserver | undefined
  onMounted(() => {
    if (
      !('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('arrived')
            observer?.unobserve(entry.target)
          }
      },
      { threshold: 0.05 },
    )
    document
      .querySelectorAll('.studio-landing .section-heading, .studio-landing [data-enter]')
      .forEach((node) => observer?.observe(node))
  })
  onBeforeUnmount(() => observer?.disconnect())
}
