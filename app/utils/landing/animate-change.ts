import type { ObjectDirective } from 'vue'

const activeAnimations = new WeakMap<HTMLElement, Animation>()

export const vAnimateChange: ObjectDirective<HTMLElement, unknown> = {
  updated(element, { value, oldValue }) {
    if (Object.is(value, oldValue)) return

    activeAnimations.get(element)?.cancel()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate) return

    const animation = element.animate(
      [
        { opacity: 0.65, translate: '0 3px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 220, easing: 'ease-out' },
    )
    activeAnimations.set(element, animation)
  },
  unmounted(element) {
    activeAnimations.get(element)?.cancel()
  },
}
