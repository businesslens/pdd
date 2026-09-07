<script setup lang="ts">
/*
  Coverage is one fact rendered on two surfaces — the status bar and the
  Overview disclosure — and a reader who learns the mark in one has to
  recognise it in the other. One component owns that reading.

  It is drawn in umber at every status, because coverage is a position on a
  ramp and not an alert: a partial model is the honest declaration the format
  asks for, and colouring it as a fault reads as a defect the reader has to
  clear. The status word carries the whole of the fact; the chip only says
  which fact it is. An earlier mark spent amber on partial and green on
  complete — two ramps this theme never chose, printed on parchment they sit a
  few degrees off.
*/
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
