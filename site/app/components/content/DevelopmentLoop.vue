<script setup lang="ts">
import LoopPanel from '~/components/landing/home/loop/LoopPanel.vue'
import { homeContent } from '~/utils/homeContent'

/*
 * The home page's development loop, embedded in the OSS docs as
 * `::development-loop`. The docs keep a plain-text loop inside the block for
 * GitHub, which renders the slot; the site draws the wheel instead. It is the
 * home page's loop unchanged, so the two can never say different things.
 */
</script>

<template>
  <div class="my-8">
    <LoopPanel :loop="homeContent.loop" headless />
  </div>
</template>
