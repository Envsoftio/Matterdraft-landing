(function () {
  var storageKey = 'matterdraft-theme'
  var saved = null
  try { saved = localStorage.getItem(storageKey) } catch (_) { /* Storage may be disabled. */ }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.dataset.theme = saved === 'dark' || saved === 'light'
    ? saved
    : prefersDark ? 'dark' : 'light'

  function syncButtons() {
    var dark = document.documentElement.dataset.theme === 'dark'
    var themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', dark ? '#071b37' : '#f4f7fc')
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var label = dark ? 'Switch to light mode' : 'Switch to dark mode'
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label)
      if (button.getAttribute('aria-pressed') !== String(dark)) button.setAttribute('aria-pressed', String(dark))
    })
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.theme-toggle')
    if (!button) return
    var theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(storageKey, theme) } catch (_) { /* Storage may be disabled. */ }
    syncButtons()
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncButtons, { once: true })
  } else {
    syncButtons()
  }
  new MutationObserver(syncButtons).observe(document.documentElement, { childList: true, subtree: true })
})()
