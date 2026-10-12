<script setup lang="ts">
const consentToastId = 'analytics-cookie-consent'
const toast = useToast()
const { available, consent, accept, reject } = useAnalyticsConsent()

function dismissConsentToast() {
  toast.remove(consentToastId)
}

function chooseAccepted() {
  accept()
  dismissConsentToast()
}

function chooseRejected() {
  reject()
  dismissConsentToast()
}

watch([available, consent], ([isAvailable, currentConsent]) => {
  // Calling toast.remove() before the toast exists still schedules Nuxt UI's
  // delayed cleanup. If PostHog becomes available during that delay, the
  // cleanup removes the newly added consent notice. There is nothing to
  // dismiss until analytics has finished initializing.
  if (!isAvailable) return

  if (currentConsent) {
    dismissConsentToast()
    return
  }

  toast.add({
    id: consentToastId,
    title: 'Analytics cookies',
    // Say what the choice actually changes, as the privacy policy does:
    // analytics is already cookieless, and allowing cookies adds a persistent
    // identifier and session replay.
    description: 'Analytics already runs without cookies. Allowing them connects your visits over time and may record a replay of what you do on the site.',
    icon: 'i-lucide-cookie',
    duration: 0,
    close: false,
    onEscapeKeyDown: event => event.preventDefault(),
    onSwipeEnd: event => event.preventDefault(),
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: chooseAccepted
      },
      {
        label: 'Reject',
        color: 'neutral',
        variant: 'ghost',
        onClick: chooseRejected
      }
    ]
  })
}, { immediate: true })
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
