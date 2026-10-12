<script setup lang="ts">
import { Motion } from 'motion-v'
import type { HomeMissingPiece } from '~/utils/homeContent'
import SectionHead from '~/components/landing/home/SectionHead.vue'

/** The selected side-by-side composition: shared definition, illustration, sources. */
const { data } = defineProps<{ data: HomeMissingPiece }>()
const { scrollMotion } = useLandingMotion()
</script>

<template>
  <Motion
    :id="data.id"
    v-bind="scrollMotion()"
    as="section"
    class="scroll-mt-(--ui-header-height) overflow-hidden rounded-2xl border border-default bg-default"
  >
    <div class="p-6 pb-0 sm:p-8 sm:pb-0">
      <SectionHead
        :title="data.title"
        :description="data.description"
        :more="data.more"
      />
    </div>

    <div class="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-2">
      <div class="mx-auto w-full min-w-0 max-w-xl">
        <img
          :src="data.image"
          :alt="data.imageAlt"
          class="aspect-square w-full rounded-xl object-contain"
          width="1254"
          height="1254"
          loading="lazy"
          decoding="async"
        >
      </div>

      <div
        role="region"
        :aria-label="data.stackCaption"
        tabindex="0"
        class="content-table-frame"
      >
        <table class="content-table">
          <caption class="sr-only">
            {{ data.stackCaption }}
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Source
              </th>
              <th scope="col">
                Focus
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="layer in data.layers" :key="layer.label">
              <th scope="row" class="lg:whitespace-nowrap">
                {{ layer.label }}
              </th>
              <td>
                {{ layer.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Motion>
</template>
