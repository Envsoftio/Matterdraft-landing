import { AwsClient } from 'aws4fetch'
import {
  desktopDownloadPlatforms,
  isDesktopDownloadPlatform,
  type DesktopDownloadPlatform,
} from '../../lib/desktop-download-platforms'
import { applicationFailure } from './application-error'

type Installer = {
  platform: DesktopDownloadPlatform
  version: string
  requirements: string
  notarized: boolean | null
  objectKey: string
}

export function getDesktopInstallers() {
  const manifest = process.env.DESKTOP_INSTALLERS?.trim()
  if (!manifest) return []

  let entries: unknown
  try {
    entries = JSON.parse(manifest)
  } catch {
    applicationFailure(503)
  }
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) applicationFailure(503)

  return Object.entries(entries).map(([platform, installer]): Installer => {
    if (!isDesktopDownloadPlatform(platform) || !installer || typeof installer !== 'object') {
      applicationFailure(503)
    }
    const { objectKey, version, requirements, notarized } = installer as Record<string, unknown>
    const { extension } = desktopDownloadPlatforms[platform]
    if (
      typeof objectKey !== 'string' ||
      !/^[a-zA-Z0-9._/-]{1,512}$/.test(objectKey) ||
      objectKey.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
      !objectKey.endsWith(`.${extension}`) ||
      typeof version !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9.+-]{0,39}$/.test(version) ||
      typeof requirements !== 'string' ||
      !requirements.trim() ||
      requirements.length > 200 ||
      (notarized !== undefined && (extension !== 'dmg' || typeof notarized !== 'boolean'))
    ) {
      applicationFailure(503)
    }
    return {
      platform,
      objectKey,
      version,
      requirements: requirements.trim(),
      notarized: notarized ?? null,
    }
  })
}

function installerStorage() {
  const bucket = process.env.DESKTOP_DOWNLOAD_S3_BUCKET
  const region = process.env.DESKTOP_DOWNLOAD_S3_REGION
  const accessKeyId = process.env.DESKTOP_DOWNLOAD_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.DESKTOP_DOWNLOAD_S3_SECRET_ACCESS_KEY
  if (
    !bucket ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    !region ||
    !/^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(region) ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    applicationFailure(503)
  }
  return {
    host: `${bucket}.s3.${region}.amazonaws.com`,
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.DESKTOP_DOWNLOAD_S3_SESSION_TOKEN || undefined,
      service: 's3',
      region,
      retries: 0,
    }),
  }
}

export function listDesktopInstallers() {
  const installers = getDesktopInstallers()
  if (installers.length) installerStorage()
  return installers.map(({ platform, version, requirements, notarized }) => ({
    platform,
    version,
    requirements,
    notarized,
  }))
}

export async function makeInstallerDownloadUrl(installer: Installer) {
  const { host, client } = installerStorage()
  const url = new URL(`https://${host}/${installer.objectKey}`)
  const extension = desktopDownloadPlatforms[installer.platform].extension
  const filename = `MatterDraft-Studio-${installer.version}-${installer.platform}.${extension}`

  try {
    const availability = await client.fetch(url, {
      method: 'HEAD',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
    if (!availability.ok) applicationFailure(503)

    url.searchParams.set('X-Amz-Expires', '120')
    url.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`)
    url.searchParams.set('response-cache-control', 'private, no-store')
    const request = await client.sign(url, { method: 'GET', aws: { signQuery: true } })
    return request.url
  } catch {
    applicationFailure(503)
  }
}
