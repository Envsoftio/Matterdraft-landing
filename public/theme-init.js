;(function () {
  var storageKey = 'matterdraft-theme'
  var saved = null
  try {
    saved = localStorage.getItem(storageKey)
  } catch (_) {
    /* Storage may be disabled. */
  }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.dataset.theme =
    saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light'

  function syncThemeColor() {
    var dark = document.documentElement.dataset.theme === 'dark'
    var themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', dark ? '#071b37' : '#f4f7fc')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncThemeColor, { once: true })
  } else {
    syncThemeColor()
  }
  new MutationObserver(syncThemeColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
})()
