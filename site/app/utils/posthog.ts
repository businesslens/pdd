import { registerAnalyticsClient } from './analytics'

/** PostHog settings, fixed when the site is generated. */
export type AnalyticsConfig = { enabled: false } | { enabled: true, key: string, host: string }

type PostHogBrowserClient = typeof import('posthog-js').default

type InitializePostHogDependencies = {
  fetchConfig: () => Promise<AnalyticsConfig>
  loadClient: () => Promise<PostHogBrowserClient>
  reportError: (error: unknown) => void
}

function reportInitializationError(error: unknown) {
  // Analytics remains optional, but a broken production configuration must be
  // visible instead of looking like a healthy deployment with zero traffic.
  console.warn('[pdd-kit analytics] PostHog initialization failed.', error)
}

const defaultDependencies: InitializePostHogDependencies = {
  fetchConfig: async () => ({ enabled: false }),
  loadClient: async () => (await import('posthog-js')).default,
  reportError: reportInitializationError
}

export async function initializePostHog(
  dependencies: Partial<InitializePostHogDependencies> = {}
) {
  const { fetchConfig, loadClient, reportError } = {
    ...defaultDependencies,
    ...dependencies
  }

  try {
    const config = await fetchConfig()
    if (!config.enabled || !config.host || !config.key) return

    const posthog = await loadClient()
    posthog.init(config.key, {
      api_host: config.host,
      defaults: '2026-05-30',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit'],
        element_allowlist: ['a', 'button', 'form'],
        capture_copied_text: false
      },
      capture_heatmaps: true,
      session_recording: {
        // Replays are consent-gated below. When they are enabled, never send
        // values typed into search or any other control to PostHog.
        maskAllInputs: true
      },
      // Keep replay disabled while the consent choice is unanswered or
      // rejected. An accepted choice starts it explicitly below.
      disable_session_recording: true,
      cookieless_mode: 'on_reject',
      // Treat an unanswered consent prompt like rejection for capture: events
      // are sent immediately, but without analytics persistence or identity.
      opt_out_capturing_by_default: true,
      person_profiles: 'identified_only',
      respect_dnt: true
    })

    if (posthog.get_explicit_consent_status() === 'granted') {
      posthog.startSessionRecording()
    }

    registerAnalyticsClient({
      capture: (event, properties) => posthog.capture(event, properties),
      getConsent: () => {
        const status = posthog.get_explicit_consent_status()

        if (status === 'granted') return 'accepted'
        if (status === 'denied') return 'rejected'
        return null
      },
      setConsent: (consent) => {
        if (consent === 'accepted') {
          posthog.opt_in_capturing({ captureEventName: false })
          posthog.startSessionRecording()
        } else {
          posthog.stopSessionRecording()
          posthog.opt_out_capturing()
        }
      }
    })
  } catch (error) {
    reportError(error)
  }
}
