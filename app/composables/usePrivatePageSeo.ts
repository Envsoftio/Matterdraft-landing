import { NO_INDEX } from '~~/scripts/discovery.mjs'

export function usePrivatePageSeo(title: string, description: string): void {
  useSeoMeta({ title: `${title} · MatterDraft Studio`, description, robots: NO_INDEX })
}
