<script setup lang="ts">
/* Neutral styling lets the status word describe model breadth without
   presenting partial coverage as an alert. */
import type { ReportCoverage } from 'businesslens/report'

withDefaults(defineProps<{
  status: ReportCoverage['status']
  /** The surface does not already name the fact, so the mark names it. */
  named?: boolean
  size?: 'sm' | 'md'
}>(), {
  named: false,
  size: 'md'
})
</script>

<template>
  <!-- The pill shape of the report's status bar. -->
  <UBadge
    :label="named ? `Coverage: ${status}` : status"
    color="neutral"
    variant="subtle"
    :size="size"
    class="whitespace-nowrap rounded-full"
  />
</template>
