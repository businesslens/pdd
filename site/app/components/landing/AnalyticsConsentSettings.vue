<script setup lang="ts">
const { available, consent, accept, reject } = useAnalyticsConsent()

const status = computed(() => {
  if (!available.value) {
    return 'Analytics preferences are available when website analytics is enabled.'
  }

  if (consent.value === 'accepted') {
    return 'Analytics cookies are allowed. PostHog can connect your visits between pages and sessions.'
  }

  if (consent.value === 'rejected') {
    return 'Analytics cookies are rejected. PostHog uses cookieless analytics without a browser identifier.'
  }

  return 'PostHog currently uses cookieless analytics without a browser identifier. Choose whether to allow analytics cookies.'
})
</script>

<template>
  <div class="mt-4 rounded-xl border border-default bg-elevated/40 p-4 sm:p-5">
    <p class="text-sm text-muted" aria-live="polite">
      {{ status }}
    </p>

    <div
      v-if="available"
      class="mt-4 flex flex-col gap-2 sm:flex-row"
      role="group"
      aria-label="Analytics preference"
    >
      <UButton
        label="Allow analytics cookies"
        color="neutral"
        :variant="consent === 'accepted' ? 'solid' : 'outline'"
        :aria-pressed="consent === 'accepted'"
        @click="accept"
      />
      <UButton
        label="Reject analytics cookies"
        color="neutral"
        :variant="consent === 'rejected' ? 'solid' : 'outline'"
        :aria-pressed="consent === 'rejected'"
        @click="reject"
      />
    </div>
  </div>
</template>
