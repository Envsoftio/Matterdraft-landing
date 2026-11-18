export function toggleStudioTheme() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('matterdraft-theme', theme)
  } catch {
    /* The theme still applies for this visit. */
  }
}
