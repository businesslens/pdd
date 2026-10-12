<script setup lang="ts">
import type { BlueprintCard } from '~/utils/blueprints'
import { blueprintCategoryMeta } from '~/utils/blueprintCategories'
import { BLUEPRINT_STAT_LABELS } from '~/utils/blueprints'

/**
 * One Blueprint on the index: its artwork bleeding to the card's edges, the
 * category badge straddling the seam, then category, title, summary, the five
 * resource counts, and a footer naming where the card goes.
 *
 * The whole card is one link — the title's stretched pseudo-element, covering
 * the artwork as well as the body. Nothing between the anchor and the `<article>` is positioned; a positioned
 * body would stop the hit area at the artwork seam. "View Blueprint" is the
 * visible promise of that link rather than a second one, so it is hidden from
 * assistive technology, which already hears the title as the link.
 *
 * The artwork is the Blueprint's engraved cover when it has one, in the house
 * style of the blog covers (ADR-0021), and the badge is the shelf it sits on;
 * the cover already identifies the product, so the logo would only repeat it. A
 * Blueprint without a cover falls back to its logo, large, on the category's
 * tint. Either way the card draws no picture of the product's
 * screens: a Product Model describes behavior, not looks.
 */
const props = defineProps<{
  blueprint: BlueprintCard
}>()

const meta = computed(() => blueprintCategoryMeta(props.blueprint.category))

// An image that fails to load falls back a step: cover → logo on the tint →
// category icon. Both start unfailed so the server and the client render the
// same HTML; an image that already failed before hydration attached its
// listener is caught on mount, and a new URL earns a fresh attempt.
const coverImage = useTemplateRef<HTMLImageElement>('coverImage')
const logoImage = useTemplateRef<HTMLImageElement>('logoImage')
const coverFailed = ref(false)
const logoFailed = ref(false)
const showCover = computed(() => Boolean(props.blueprint.cover) && !coverFailed.value)
const showLogo = computed(() => Boolean(props.blueprint.logo) && !logoFailed.value)
const broken = (image: HTMLImageElement | null) => Boolean(image?.complete && image.naturalWidth === 0)
watch(() => props.blueprint.cover, () => { coverFailed.value = false })
watch(() => props.blueprint.logo, () => { logoFailed.value = false })
onMounted(() => {
  if (broken(coverImage.value)) coverFailed.value = true
  if (broken(logoImage.value)) logoFailed.value = true
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-default bg-default transition-[border-color] hover:border-accented has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-primary"
    data-blueprint-card
  >
    <!-- The badge hangs off the artwork rather than off the body, so the body is
      not a positioned ancestor. That is what lets the title's stretched
      pseudo-element resolve against the whole card. -->
    <div class="relative" aria-hidden="true">
      <img
        v-if="showCover"
        ref="coverImage"
        :src="blueprint.cover!"
        alt=""
        class="block aspect-[16/9] w-full object-cover"
        loading="lazy"
        data-blueprint-card-cover
        @error="coverFailed = true"
      >
      <div v-else class="p-3 sm:p-4" :class="meta.tone.soft">
        <div class="flex aspect-[16/9] items-center justify-center" data-blueprint-card-artwork>
          <img
            v-if="showLogo"
            ref="logoImage"
            :src="blueprint.logo"
            alt=""
            class="size-20 rounded-2xl shadow-sm sm:size-24"
            loading="lazy"
            data-blueprint-card-logo
            @error="logoFailed = true"
          >
          <UIcon
            v-else
            :name="meta.icon"
            class="size-16"
            :class="meta.tone.ink"
            data-blueprint-card-logo
          />
        </div>
      </div>

      <div class="absolute -bottom-5 left-4">
        <span
          class="flex size-10 items-center justify-center rounded-xl border border-default bg-default shadow-xs"
        >
          <UIcon
            :name="meta.icon"
            class="size-5"
            :class="meta.tone.ink"
            data-blueprint-card-icon
          />
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col px-4 pb-3 pt-8">
      <p class="text-xs font-medium text-muted">
        {{ meta.label }}
      </p>

      <h3 class="mt-1 text-base font-semibold tracking-tight text-highlighted">
        <NuxtLink
          :to="`/blueprints/${blueprint.slug}`"
          class="after:absolute after:inset-0 focus-visible:outline-none"
          data-card-link
        >
          {{ blueprint.title }}
        </NuxtLink>
      </h3>

      <p class="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
        {{ blueprint.summary }}
      </p>

      <!-- Wraps between counts, never inside one, so a narrow card loses a line
        rather than a number. -->
      <ul
        class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-muted"
        aria-label="Model contents"
        data-blueprint-stats
      >
        <li
          v-for="stat in BLUEPRINT_STAT_LABELS"
          :key="stat.key"
          class="whitespace-nowrap"
        >
          <span class="font-semibold text-highlighted">{{ blueprint.stats[stat.key] }}</span>
          {{ stat.label }}
        </li>
      </ul>

      <div class="mt-auto pt-3">
        <div class="flex items-center justify-between gap-3 border-t border-default pt-2.5">
          <span
            class="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            aria-hidden="true"
            data-blueprint-card-cta
          >
            View Blueprint
            <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0" />
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
