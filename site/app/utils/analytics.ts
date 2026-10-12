type AnalyticsClient = {
  capture: (event: string, properties: Record<string, string>) => unknown
  getConsent: () => AnalyticsConsent
  setConsent: (consent: AnalyticsConsentChoice) => unknown
}

export type AnalyticsConsentChoice = 'accepted' | 'rejected'
export type AnalyticsConsent = AnalyticsConsentChoice | null

export type AnalyticsState = Readonly<{
  available: boolean
  consent: AnalyticsConsent
}>

type AnalyticsStateListener = (state: AnalyticsState) => void

type HomepageCta = {
  cta: string
  destination: string
  interaction: 'navigate' | 'open_steps' | 'scroll'
  placement: 'closing' | 'hero' | 'hero_overlay'
}

let analyticsClient: AnalyticsClient | null = null
let analyticsState: AnalyticsState = {
  available: false,
  consent: null
}
const analyticsStateListeners = new Set<AnalyticsStateListener>()

function publishAnalyticsState() {
  for (const listener of analyticsStateListeners) {
    listener(analyticsState)
  }
}

export function registerAnalyticsClient(client: AnalyticsClient) {
  analyticsClient = client
  analyticsState = {
    available: true,
    consent: client.getConsent()
  }
  publishAnalyticsState()
}

export function subscribeAnalyticsState(listener: AnalyticsStateListener) {
  analyticsStateListeners.add(listener)
  listener(analyticsState)

  return () => analyticsStateListeners.delete(listener)
}

export function setAnalyticsConsent(consent: AnalyticsConsentChoice) {
  if (!analyticsClient) return

  analyticsClient.setConsent(consent)
  analyticsState = {
    available: true,
    consent: analyticsClient.getConsent()
  }
  publishAnalyticsState()
}

export function captureHomepageCtaClicked(properties: HomepageCta) {
  analyticsClient?.capture('homepage_cta_clicked', properties)
}

export function captureHomepageInstallCommandCopied(command: string) {
  analyticsClient?.capture('homepage_install_command_copied', {
    command,
    placement: 'hero'
  })
}

export function captureBlueprintPullCommandCopied(slug: string) {
  analyticsClient?.capture('blueprint_pull_command_copied', { slug })
}
