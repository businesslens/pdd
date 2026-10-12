import { describe, expect, it, vi } from 'vitest'
import {
  captureBlueprintPullCommandCopied,
  captureHomepageCtaClicked,
  captureHomepageInstallCommandCopied,
  registerAnalyticsClient,
  setAnalyticsConsent,
  subscribeAnalyticsState
} from '../../app/utils/analytics'

describe('website analytics', () => {
  it('captures explicit funnel events', () => {
    const capture = vi.fn()
    registerAnalyticsClient({
      capture,
      getConsent: () => null,
      setConsent: vi.fn()
    })

    captureHomepageCtaClicked({
      cta: 'from-a-blueprint',
      destination: '/blueprints',
      interaction: 'navigate',
      placement: 'hero_overlay'
    })
    captureHomepageInstallCommandCopied('npx @itai-gendler/pdd-kit install')
    captureBlueprintPullCommandCopied('content-feed-reader')

    expect(capture.mock.calls).toEqual([
      ['homepage_cta_clicked', {
        cta: 'from-a-blueprint',
        destination: '/blueprints',
        interaction: 'navigate',
        placement: 'hero_overlay'
      }],
      ['homepage_install_command_copied', {
        command: 'npx @itai-gendler/pdd-kit install',
        placement: 'hero'
      }],
      ['blueprint_pull_command_copied', {
        slug: 'content-feed-reader'
      }]
    ])
  })

  it('publishes and updates the PostHog consent state', () => {
    const states: Array<{ available: boolean, consent: 'accepted' | 'rejected' | null }> = []
    let consent: 'accepted' | 'rejected' | null = null
    const setConsent = vi.fn((value: 'accepted' | 'rejected') => {
      consent = value
    })
    const unsubscribe = subscribeAnalyticsState(state => states.push({ ...state }))

    registerAnalyticsClient({
      capture: vi.fn(),
      getConsent: () => consent,
      setConsent
    })
    setAnalyticsConsent('rejected')
    unsubscribe()

    expect(setConsent).toHaveBeenCalledWith('rejected')
    expect(states.at(-2)).toEqual({ available: true, consent: null })
    expect(states.at(-1)).toEqual({ available: true, consent: 'rejected' })
  })
})
