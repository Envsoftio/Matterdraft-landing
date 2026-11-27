import assert from 'node:assert/strict'
import test from 'node:test'

const downloads = 'https://github.com/Envsoftio/advocate_app/releases/download'
const platforms = ['macOS-arm64.dmg', 'macOS-x64.dmg', 'Windows-x64.exe', 'Linux-x64.AppImage']

function release(run, prerelease) {
  const tag = `v0.1.1-unsigned.${run}`
  const assets = platforms.map((platform) => {
    const suffix = prerelease ? platform.replace('.', '-unsigned.') : platform
    const name = `MatterDraft-Studio-0.1.1-${suffix}`
    return { name, size: 100, browser_download_url: `${downloads}/${tag}/${name}` }
  })
  return { tag_name: tag, draft: false, prerelease, assets }
}

test('Desktop downloads prefer the complete regular release and retain legacy prereleases', async (t) => {
  const legacy = release(7, true)
  const current = release(8, false)
  const incomplete = release(9, false)
  incomplete.assets.pop()
  const draft = { ...release(10, false), draft: true }
  const stable = { ...release(11, false), tag_name: 'v0.1.2' }
  const fixtures = [
    [current, [legacy, incomplete, current, draft, stable]],
    [legacy, [legacy, incomplete, draft, stable]],
  ]
  for (const [chosen, releases] of fixtures) {
    await t.test(chosen.tag_name, async (t) => {
      t.mock.method(globalThis, 'fetch', async () => Response.json(releases))
      const { getDesktopInstallers } = await import(
        `../server/utils/desktop-installers.ts?${chosen.tag_name}`
      )
      const installers = await getDesktopInstallers()
      assert.deepEqual(
        installers.map((installer) => installer.url),
        chosen.assets.map((asset) => asset.browser_download_url),
      )
      assert.ok(installers.every((installer) => installer.unsigned))
    })
  }
})
