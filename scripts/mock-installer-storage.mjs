// Opt-in fixture for a disposable portal. Load with node --import.
if (
  process.env.NODE_ENV === 'production' ||
  !/^file:\/private\/tmp\/.+\.db$/.test(process.env.TURSO_DATABASE_URL || '') ||
  !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.BETTER_AUTH_URL || '')
) {
  throw new Error('Use the installer fixture only with a disposable loopback portal.')
}

const host = 'matterdraft-portal-test.s3.ap-south-1.amazonaws.com'
Object.assign(process.env, {
  DESKTOP_DOWNLOAD_S3_BUCKET: 'matterdraft-portal-test',
  DESKTOP_DOWNLOAD_S3_REGION: 'ap-south-1',
  DESKTOP_DOWNLOAD_S3_ACCESS_KEY_ID: 'TESTDOWNLOADKEY',
  DESKTOP_DOWNLOAD_S3_SECRET_ACCESS_KEY: 'local-fixture-signing-key',
  DESKTOP_DOWNLOAD_S3_SESSION_TOKEN: '',
  DESKTOP_INSTALLERS: JSON.stringify({
    'macos-arm64': {
      objectKey: 'fixtures/arm.dmg',
      version: '1.2.3',
      requirements: 'macOS 14 or later',
      notarized: false,
    },
    'macos-x64': {
      objectKey: 'fixtures/missing.dmg',
      version: '1.2.3',
      requirements: 'macOS 14 or later',
    },
    'windows-x64': {
      objectKey: 'fixtures/windows.msi',
      version: '1.2.3',
      requirements: 'Windows 11',
    },
  }),
})

const fetchNormally = globalThis.fetch
globalThis.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input)
  if (url.hostname !== host) return fetchNormally(input, options)

  const request = new Request(input, options)
  if (
    request.method !== 'HEAD' ||
    !request.headers.get('authorization')?.startsWith('AWS4-HMAC-SHA256 ')
  ) {
    return new Response(null, { status: 403 })
  }
  return new Response(null, { status: url.pathname.includes('missing') ? 404 : 200 })
}
