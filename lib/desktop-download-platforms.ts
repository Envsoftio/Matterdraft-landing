export const desktopDownloadPlatforms = {
  'macos-arm64': { label: 'Mac with Apple silicon', extension: 'dmg' },
  'macos-x64': { label: 'Mac with Intel', extension: 'dmg' },
  'windows-x64': { label: 'Windows 64-bit', extension: 'msi' },
  'linux-x64': { label: 'Linux 64-bit', extension: 'AppImage' },
} as const

export type DesktopDownloadPlatform = keyof typeof desktopDownloadPlatforms

export function isDesktopDownloadPlatform(value: unknown): value is DesktopDownloadPlatform {
  return typeof value === 'string' && Object.hasOwn(desktopDownloadPlatforms, value)
}
