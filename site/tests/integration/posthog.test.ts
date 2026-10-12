import { describe, expect, it, vi } from 'vitest'
import {
  captureHomepageCtaClicked,
  setAnalyticsConsent,
  subscribeAnalyticsState
} from '../../app/utils/analytics'
import { initializePostHog } from '../../app/utils/posthog'

function posthogFixture() {
  let consent: 'denied' | 'granted' | 'pending' = 'pending'

  const posthog = {
    capture: vi.fn(),
    get_explicit_consent_status: vi.fn(() => consent),
    init: vi.fn(),
    opt_in_capturing: vi.fn(() => {
      consent = 'granted'
    }),
    opt_out_capturing: vi.fn(() => {
      consent = 'denied'
    }),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn()
  }

  return posthog
}

describe('PostHog browser initialization', () => {
  it('installs the consent-gated client and drives real adapter transitions', async () => {
    const posthog = posthogFixture()
    const fetchConfig = vi.fn(async () => ({
      enabled: true as const,
      host: 'https://eu.i.posthog.com',
      key: 'phc_browser_test'
    }))
    const loadClient = vi.fn(async () => posthog as never)

    await initializePostHog({ fetchConfig, loadClient })

    expect(fetchConfig).toHaveBeenCalledOnce()
    expect(loadClient).toHaveBeenCalledOnce()
    expect(posthog.init).toHaveBeenCalledWith('phc_browser_test', expect.objectContaining({
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      cookieless_mode: 'on_reject',
      disable_session_recording: true,
      opt_out_capturing_by_default: true,
      person_profiles: 'identified_only',
      respect_dnt: true,
      session_recording: { maskAllInputs: true }
    }))
    expect(posthog.startSessionRecording).not.toHaveBeenCalled()

    const states: Array<{ available: boolean, consent: 'accepted' | 'rejected' | null }> = []
    const unsubscribe = subscribeAnalyticsState(state => states.push({ ...state }))
    expect(states.at(-1)).toEqual({ available: true, consent: null })

    setAnalyticsConsent('accepted')
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false })
    expect(posthog.startSessionRecording).toHaveBeenCalledOnce()
    expect(states.at(-1)).toEqual({ available: true, consent: 'accepted' })

    captureHomepageCtaClicked({
      cta: 'from-a-blueprint',
      destination: '/blueprints',
      interaction: 'navigate',
      placement: 'hero'
    })
    expect(posthog.capture).toHaveBeenCalledWith('homepage_cta_clicked', {
      cta: 'from-a-blueprint',
      destination: '/blueprints',
      interaction: 'navigate',
      placement: 'hero'
    })

    setAnalyticsConsent('rejected')
    expect(posthog.stopSessionRecording).toHaveBeenCalledOnce()
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce()
    expect(states.at(-1)).toEqual({ available: true, consent: 'rejected' })
    unsubscribe()
  })

  it('reports initialization failures without rejecting the site startup', async () => {
    const failure = new Error('configuration unavailable')
    const reportError = vi.fn()

    await expect(initializePostHog({
      fetchConfig: async () => { throw failure },
      reportError
    })).resolves.toBeUndefined()

    expect(reportError).toHaveBeenCalledWith(failure)
  })
})
