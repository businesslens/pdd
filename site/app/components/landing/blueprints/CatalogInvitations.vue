<script setup lang="ts">
/**
 * The two ways past a catalog that does not have what a reader came for: ask us
 * to build it, or bring your own.
 *
 * They read as a pair, so they are drawn as one — matching boxes, same order
 * everywhere. Requesting comes first because it answers the scan that just
 * failed; submitting is for a different reader entirely, one who arrives with a
 * Product Model already in hand.
 *
 * After the listing in every populated shape. When `CatalogLayout` renders the
 * category sidebar, a second copy sits in it from `lg` and the one after the
 * listing hides there. Exactly one of the two is in the accessibility tree at
 * any width — never both, never neither — which is why the visibility classes
 * live at the call sites rather than in here. An empty catalog carries the same
 * two actions in its empty state instead.
 *
 * `row` is the copy after the listing: side by side from `sm`, and from `lg`,
 * where it spans the whole column, each box sets its button beside its text
 * rather than under it, so two wide boxes do not read as mostly empty.
 */
const props = withDefaults(defineProps<{
  layout?: 'stack' | 'row'
}>(), {
  layout: 'stack'
})

const row = computed(() => props.layout === 'row')

const invitations = [
  {
    icon: 'i-lucide-sparkles',
    title: 'Can\'t find what you need?',
    body: 'Request a Blueprint and we\'ll build it for you.',
    label: 'Request a Blueprint',
    to: '/contact'
  },
  {
    icon: 'i-lucide-git-pull-request-arrow',
    title: 'Built one already?',
    body: 'Contribute your Product Model by pull request; merging it publishes the Blueprint.',
    label: 'Submit a Blueprint',
    to: '/docs/cli-contribute'
  }
]
</script>

<template>
  <div :class="row ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'">
    <div
      v-for="invitation in invitations"
      :key="invitation.to"
      class="flex flex-col rounded-xl border border-default bg-default p-4"
      :class="row ? 'lg:flex-row lg:items-center lg:gap-4 lg:p-5' : undefined"
    >
      <div class="min-w-0 lg:flex-1">
        <UIcon :name="invitation.icon" class="size-4 text-primary" aria-hidden="true" />
        <p class="mt-2 text-sm font-semibold tracking-tight text-highlighted">
          {{ invitation.title }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-dimmed">
          {{ invitation.body }}
        </p>
      </div>
      <!-- Pushed to the bottom so the two buttons share a baseline when the boxes
        sit side by side and their blurbs wrap to different heights. -->
      <div class="mt-3 sm:mt-auto sm:pt-3" :class="row ? 'lg:mt-0 lg:shrink-0 lg:pt-0' : undefined">
        <UButton
          :label="invitation.label"
          :to="invitation.to"
          color="primary"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
