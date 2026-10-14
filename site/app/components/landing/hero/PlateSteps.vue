<script setup lang="ts">
import CommandBlock from '~/components/landing/CommandBlock.vue'
import LandingHeroWaySteps from '~/components/landing/hero/WaySteps.vue'

/**
 * The consolidated hero: the shared install command, the plate row, and the
 * steps for whichever plate you press.
 *
 * The plate row carries each way as a brass button; pressing one opens its
 * steps (`WaySteps.vue`) in a modal. The `primary` way — mapping the reader's
 * own repository — is the same solid as the header's Get started, and the other
 * two are outlined, so the row leads with one door without dropping the others.
 *
 * The overlay owns the heading and the link, not the steps component: the plate
 * and label go in the header so they align with the close button, and the link
 * goes in the footer so it reads as the one thing to do next rather than
 * another step.
 *
 * The modal keeps the hero at a fixed height whatever is pressed, which matters
 * more than it looks: hero height moves the eyebrow into brighter chart.
 */
const { align = 'left' } = defineProps<{
  align?: 'left' | 'center' | 'responsive'
}>()

const { hero } = homeContent

const open = ref(false)
// The overlay opens on whichever way was pressed; emphasis only changes the button.
const selected = ref(0)
const current = computed(() => hero.actions[selected.value] ?? hero.actions[0]!)

function reveal(index: number) {
  selected.value = index
  open.value = true
}

const BLOCK = { left: '', center: 'mx-auto', responsive: 'mx-auto xl:mx-0' } as const
const block = computed(() => BLOCK[align])

/**
 * The steps' question stays available to assistive technology only.
 *
 * One step wider than the modal's default `max-w-lg`: the Blueprint pull command
 * is the longest line in any way in, and at the default width its slug — the
 * part the reader presses to pick a Blueprint — wrapped onto a line of its own.
 */
const OVERLAY_UI = { description: 'sr-only', content: 'sm:max-w-xl' }
</script>

<template>
  <!-- `max-w-xl` is the copy column's own width from `xl`, and the width at
    which a third of the row holds *Start from a Blueprint* on one line. -->
  <div class="w-full max-w-xl" :class="block">
    <CommandBlock
      :command="hero.installCommand"
      :copy-label="hero.commandCopyLabel"
      :copied-label="hero.commandCopiedLabel"
      class="mb-3 backdrop-blur"
      nowrap
    />

    <!-- The plates carry an explicit focus ring. Closing an overlay with Escape
      returns focus to its trigger, which is correct — but unstyled that surfaced
      as the browser's default blue. It must stay visible: removing it would
      strand keyboard users with no indication of where focus went. -->
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="(action, index) in hero.actions"
        :key="action.id"
        type="button"
        :data-way="action.id"
        :aria-label="action.label"
        class="group flex flex-col gap-2 outline-none"
        @click="reveal(index)"
      >
        <span
          class="overflow-hidden rounded-lg border transition group-hover:border-primary/40 group-focus-visible:outline-solid group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary"
          :class="action.primary ? 'border-primary/40' : 'border-default'"
        >
          <!-- Decorative: the label sits directly beneath. -->
          <img :src="action.plate" alt="" class="block aspect-square w-full object-cover">
        </span>
        <!-- A span, not a nested button: the card is already the control that
          opens this way's steps. The label goes in the slot rather than the prop
          because the prop's span truncates. `sm` plus `sm:text-sm` is the
          header's `md` button from the `sm` breakpoint up, down one step where a
          third of a phone is all a label has. -->
        <UButton
          as="span"
          block
          size="sm"
          :variant="action.primary ? 'solid' : 'outline'"
          class="sm:text-sm"
          :class="action.primary ? 'group-hover:bg-primary/75' : 'hero-way-outline'"
        >
          <span class="w-full whitespace-nowrap text-center">
            <span class="sm:hidden">{{ action.shortLabel }}</span>
            <span class="hidden sm:inline">{{ action.label }}</span>
          </span>
        </UButton>
      </button>
    </div>

    <UModal
      v-model:open="open"
      :title="current.label"
      :description="hero.actionsQuestion"
      :ui="OVERLAY_UI"
    >
      <!-- The plate and label go in the header slot rather than the body, so
        they sit on the same line as the close button instead of below an empty
        one. -->
      <template #title>
        <span class="flex items-center gap-3">
          <span class="overflow-hidden rounded border border-primary/40">
            <img :src="current.plate" alt="" class="block size-9 object-cover">
          </span>
          <span class="text-base font-semibold tracking-tight text-primary">{{ current.label }}</span>
        </span>
      </template>

      <template #body>
        <LandingHeroWaySteps :action="current" />
      </template>

      <!-- A link to somewhere else is not a step, so it sits below them all as
        the one thing to do next. -->
      <template #footer>
        <UButton
          :label="current.moreLabel"
          :to="current.to"
          block
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        />
      </template>
    </UModal>
  </div>
</template>
