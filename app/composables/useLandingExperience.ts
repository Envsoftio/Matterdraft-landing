import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { createLandingScope, type LandingScope } from '../utils/landing/lifecycle'
import { mountCoreExperience } from '../utils/landing/core.js'
import { mountWorkflowExamples } from '../utils/landing/workflow.js'
import { mountInterfaceTools } from '../utils/landing/interface.js'
import { mountHeroExperience } from '../utils/landing/hero.js'

/** Enhances the server-rendered landing content for this page's lifetime. */
export function useLandingExperience(): void {
  let active = true
  let scope: LandingScope | undefined

  onMounted(async () => {
    await nextTick()
    if (!active) return

    const mountedScope = createLandingScope()
    scope = mountedScope
    try {
      mountCoreExperience(mountedScope)
      mountWorkflowExamples(mountedScope)
      mountInterfaceTools(mountedScope)
      mountHeroExperience(mountedScope)
    } catch (error) {
      mountedScope.dispose()
      scope = undefined
      throw error
    }
  })

  onBeforeUnmount(() => {
    active = false
    scope?.dispose()
    scope = undefined
  })
}
