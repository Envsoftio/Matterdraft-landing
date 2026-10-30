export interface LandingScope {
  readonly disposed: boolean
  on: (
    target: EventTarget | null | undefined,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void
  onMedia: (query: MediaQueryList, listener: (event: MediaQueryListEvent) => void) => void
  timeout: (callback: () => void, delay?: number) => number
  clearTimeout: (id: number) => void
  frame: (callback: FrameRequestCallback) => number
  intersectionObserver: (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) => IntersectionObserver
  onCleanup: (callback: () => void) => void
  dispose: () => void
}

/** Owns all effects created by one mounted landing-page instance. */
export function createLandingScope(): LandingScope {
  let disposed = false
  const listeners: Array<() => void> = []
  const cleanups: Array<() => void> = []
  const timers = new Set<number>()
  const frames = new Set<number>()
  const observers = new Set<IntersectionObserver>()

  const scope: LandingScope = {
    get disposed() { return disposed },

    on(target, type, listener, options) {
      if (!target || disposed) return
      target.addEventListener(type, listener, options)
      listeners.push(() => target.removeEventListener(type, listener, options))
    },

    onMedia(query, listener) {
      if (disposed) return
      if (typeof query.addEventListener === 'function') {
        scope.on(query, 'change', listener as EventListener)
      } else {
        // Compatibility with older Safari MediaQueryList implementations.
        query.addListener(listener)
        listeners.push(() => query.removeListener(listener))
      }
    },

    timeout(callback, delay = 0) {
      if (disposed) return -1
      const id = window.setTimeout(() => {
        timers.delete(id)
        if (!disposed) callback()
      }, delay)
      timers.add(id)
      return id
    },

    clearTimeout(id) {
      window.clearTimeout(id)
      timers.delete(id)
    },

    frame(callback) {
      if (disposed) return -1
      const id = window.requestAnimationFrame((timestamp) => {
        frames.delete(id)
        if (!disposed) callback(timestamp)
      })
      frames.add(id)
      return id
    },

    intersectionObserver(callback, options) {
      const observer = new IntersectionObserver((entries, instance) => {
        if (!disposed) callback(entries, instance)
      }, options)
      observers.add(observer)
      if (disposed) observer.disconnect()
      return observer
    },

    onCleanup(callback) {
      if (disposed) callback()
      else cleanups.push(callback)
    },

    dispose() {
      if (disposed) return
      disposed = true
      // Stop events first: closing dialogs during teardown must not restore focus
      // to a route that is about to disappear.
      listeners.splice(0).reverse().forEach(remove => remove())
      timers.forEach(id => window.clearTimeout(id))
      frames.forEach(id => window.cancelAnimationFrame(id))
      observers.forEach(observer => observer.disconnect())
      timers.clear()
      frames.clear()
      observers.clear()
      cleanups.splice(0).reverse().forEach(cleanup => cleanup())
    },
  }

  return scope
}
