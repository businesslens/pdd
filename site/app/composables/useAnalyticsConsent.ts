import {
  setAnalyticsConsent,
  subscribeAnalyticsState,
  type AnalyticsConsent,
  type AnalyticsConsentChoice
} from '~/utils/analytics'

export function useAnalyticsConsent() {
  const available = ref(false)
  const consent = ref<AnalyticsConsent>(null)

  let unsubscribe: (() => void) | undefined

  onMounted(() => {
    unsubscribe = subscribeAnalyticsState((state) => {
      available.value = state.available
      consent.value = state.consent
    })
  })

  onBeforeUnmount(() => unsubscribe?.())

  function choose(value: AnalyticsConsentChoice) {
    setAnalyticsConsent(value)
  }

  return {
    available: readonly(available),
    consent: readonly(consent),
    accept: () => choose('accepted'),
    reject: () => choose('rejected')
  }
}
