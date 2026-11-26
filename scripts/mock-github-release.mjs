// Opt-in fixture for a disposable loopback portal. Load with node --import.
if (
  !/^file:\/private\/tmp\/.+\.db$/.test(process.env.TURSO_DATABASE_URL || '') ||
  !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.BETTER_AUTH_URL || '')
) {
  throw new Error('Use the release fixture only with a disposable loopback portal.')
}

const tag = 'v0.1.1-unsigned.7'
const base = `https://github.com/Envsoftio/advocate_app/releases/download/${tag}/`
const names = [
  'MatterDraft-Studio-0.1.1-macOS-arm64-unsigned.dmg',
  'MatterDraft-Studio-0.1.1-macOS-x64-unsigned.dmg',
  'MatterDraft-Studio-0.1.1-Windows-x64-unsigned.exe',
  'MatterDraft-Studio-0.1.1-Linux-x64-unsigned.AppImage',
]
const release = {
  tag_name: tag,
  draft: false,
  prerelease: true,
  assets: names.map((name) => ({ name, size: 100, browser_download_url: base + name })),
}
const fetchNormally = globalThis.fetch
globalThis.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input)
  if (url.href === 'https://api.github.com/repos/Envsoftio/advocate_app/releases?per_page=30') {
    return Response.json([release])
  }
  return fetchNormally(input, options)
}
