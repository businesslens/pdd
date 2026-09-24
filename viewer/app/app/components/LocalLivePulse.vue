<script setup lang="ts">
/**
 * The pulse: the report is being built while you watch, and this says so.
 *
 * A dot for the stream, and the moment the model last changed on screen — not
 * the count of edits. It shows when the current report last refreshed.
 */
const live = useLocalLive()
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 5000) })
onBeforeUnmount(() => { if (ticker) clearInterval(ticker) })

const ago = computed(() => {
  if (!live.value.updatedAt) return ''
  const seconds = Math.max(0, Math.round((now.value - live.value.updatedAt) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
})
const title = computed(() => live.value.connected
  ? (ago.value ? `Live · the report changed ${ago.value}` : 'Live · watching the model for edits')
  : 'Not connected · restart businesslens view')
</script>

<template>
  <UTooltip :text="title">
    <span
      data-local-live
      :data-connected="live.connected"
      class="blr-header-pill hidden items-center gap-1.5 border border-default text-muted md:inline-flex"
      :aria-label="title"
    >
      <span
        class="size-1.5 shrink-0 rounded-full"
        :class="live.connected ? 'bg-success animate-pulse' : 'bg-accented'"
        aria-hidden="true"
      />
      <span>{{ live.connected ? 'Live' : 'Offline' }}</span>
      <span v-if="ago" class="text-dimmed">· {{ ago }}</span>
    </span>
  </UTooltip>
</template>
