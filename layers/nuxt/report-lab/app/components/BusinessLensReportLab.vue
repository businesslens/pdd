<script setup lang="ts">
/**
 * Renders the Product Report through whichever design is currently selected.
 *
 * The whole report is projected once here and handed to the design, so no
 * design can quietly show less than another because of what it fetched.
 */
import type { Component } from 'vue'
import type { ProductReportV8 } from 'businesslens/report'
import { projectReportView } from 'businesslens/report/view-model'
import { SHIPPED_DESIGN_ID, WIDTH_CLASS } from '../utils/reportDesigns'
import { projectReportWorkspace } from '../utils/reportWorkspace'

/**
 * Designs are imported by name rather than resolved from the global component
 * registry: a Layer's components are registered lazily, and a `<component :is>`
 * given a bare string silently renders nothing when the name has not been
 * resolved yet. Async imports also keep each design in its own chunk, so
 * auditioning many of them costs one download, not every design at once.
 */
const DESIGN_COMPONENTS: Record<string, Component> = {
  BlrMeridian: defineAsyncComponent(() => import('./BlrMeridian.vue')),
  BlrInquiry: defineAsyncComponent(() => import('./BlrInquiry.vue')),
  BlrCanvas: defineAsyncComponent(() => import('./BlrCanvas.vue')),
  BlrTripane: defineAsyncComponent(() => import('./BlrTripane.vue')),
  BlrWorkbench: defineAsyncComponent(() => import('./BlrWorkbench.vue')),
  BlrNarrative: defineAsyncComponent(() => import('./BlrNarrative.vue')),
  BlrPromises: defineAsyncComponent(() => import('./BlrPromises.vue')),
  BlrGateway: defineAsyncComponent(() => import('./BlrGateway.vue')),
  BlrCrossgrid: defineAsyncComponent(() => import('./BlrCrossgrid.vue')),
  BlrBeacon: defineAsyncComponent(() => import('./BlrBeacon.vue')),
  BlrPanorama: defineAsyncComponent(() => import('./BlrPanorama.vue')),
  BlrOrbit: defineAsyncComponent(() => import('./BlrOrbit.vue'))
}

const props = defineProps<{
  report: ProductReportV8
  logoSrc?: string | null
}>()

const { active, width } = useBusinessLensReportDesign()
const { visible: labVisible } = useBusinessLensThemeLab()

const workspace = computed(() => projectReportWorkspace(props.report))
const shippedView = computed(() => projectReportView(props.report))
const isShipped = computed(() => active.value.id === SHIPPED_DESIGN_ID)
const designComponent = computed(() => DESIGN_COMPONENTS[active.value.component] ?? null)
</script>

<template>
  <div
    class="blr-lab"
    :data-design="active.id"
    :data-fills="active.fills ? '' : undefined"
  >
    <div
      v-if="labVisible"
      class="shrink-0 border-b border-default bg-elevated/40"
    >
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-highlighted">
          <UIcon :name="active.icon" class="size-3.5" />
          {{ active.name }}
        </span>
        <span class="text-xs text-dimmed">{{ active.approach }}</span>
        <span class="blr-meta ms-auto hidden lg:inline">
          Shift + ← / → to compare
        </span>
      </div>
    </div>

    <BusinessLensReportViewer
      v-if="isShipped"
      :report="shippedView"
      :logo-src="logoSrc"
    />
    <div
      v-else
      :class="[WIDTH_CLASS[width], active.fills && 'blr-fills']"
    >
      <component
        :is="designComponent"
        v-if="designComponent"
        :workspace="workspace"
        :logo-src="logoSrc"
      />
    </div>
  </div>
</template>

<style scoped>
/* A filling design owns the viewport: the lab column is sized to what is left
   under the header and the lab bar, the design note keeps its natural height,
   and the design itself takes the remainder and scrolls internally. Sizing the
   whole column rather than the design alone is what keeps the note strip from
   pushing the design below the fold. */
.blr-lab[data-fills] {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 4rem - var(--businesslens-theme-lab-height, 0px));
}

.blr-fills {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
</style>
