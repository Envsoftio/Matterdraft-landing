import type { DesktopDownloadPlatform } from '../../lib/desktop-download-platforms'
import { applicationFailure } from './application-error.ts'

type Installer = {
  platform: DesktopDownloadPlatform
  version: string
  requirements: string
  notarized: boolean | null
  extension: 'dmg' | 'exe' | 'AppImage'
  unsigned: true
  releaseTag: string
  url: string
}

const releaseApi = 'https://api.github.com/repos/Envsoftio/advocate_app/releases?per_page=30'
const releaseBase = 'https://github.com/Envsoftio/advocate_app/releases/download'
const publicPackages = {
  'macos-arm64': {
    label: 'macOS-arm64',
    requirements: 'macOS 14 or later',
    extension: 'dmg',
  },
  'macos-x64': {
    label: 'macOS-x64',
    requirements: 'macOS 14 or later',
    extension: 'dmg',
  },
  'windows-x64': {
    label: 'Windows-x64',
    requirements: '64-bit Windows',
    extension: 'exe',
  },
  'linux-x64': {
    label: 'Linux-x64',
    requirements: '64-bit Linux with AppImage support',
    extension: 'AppImage',
  },
} as const satisfies Record<
  DesktopDownloadPlatform,
  { label: string; requirements: string; extension: string }
>

let cached: { expires: number; installers: Installer[] } | undefined

export async function getDesktopInstallers(): Promise<Installer[]> {
  if (cached && cached.expires > Date.now()) return cached.installers

  let releases: unknown
  try {
    const response = await fetch(releaseApi, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) applicationFailure(503)
    releases = await response.json()
  } catch {
    applicationFailure(503)
  }
  if (!Array.isArray(releases)) applicationFailure(503)

  const candidates = releases
    .filter(
      (release) =>
        release &&
        typeof release === 'object' &&
        !release.draft &&
        /^v\d+\.\d+\.\d+-unsigned\.[1-9]\d*$/.test(release.tag_name) &&
        Array.isArray(release.assets),
    )
    .sort((a, b) => Number(b.tag_name.split('.').at(-1)) - Number(a.tag_name.split('.').at(-1)))

  for (const release of candidates) {
    const version = release.tag_name.slice(1).split('-')[0]
    const suffix = release.prerelease ? '-unsigned' : ''
    const installers = Object.entries(publicPackages).map(([platform, config]) => {
      const name = `MatterDraft-Studio-${version}-${config.label}${suffix}.${config.extension}`
      const url = `${releaseBase}/${release.tag_name}/${name}`
      const asset = release.assets.find(
        (entry: { name?: string; browser_download_url?: string; size?: number }) =>
          entry.name === name &&
          entry.browser_download_url === url &&
          typeof entry.size === 'number' &&
          entry.size > 0,
      )
      if (!asset) return null
      return {
        platform: platform as DesktopDownloadPlatform,
        version,
        requirements: config.requirements,
        notarized: platform.startsWith('macos-') ? false : null,
        extension: config.extension,
        unsigned: true,
        releaseTag: release.tag_name,
        url,
      }
    })
    if (installers.every((entry) => entry !== null)) {
      const complete = installers as Installer[]
      cached = { expires: Date.now() + 5 * 60_000, installers: complete }
      return complete
    }
  }

  cached = { expires: Date.now() + 60_000, installers: [] }
  return []
}

export async function listDesktopInstallers() {
  const installers = await getDesktopInstallers()
  return installers.map(({ url, ...entry }) => entry)
}

export function makeInstallerDownloadUrl(installer: Installer) {
  return installer.url
}
