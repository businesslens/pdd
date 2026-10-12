<script setup lang="ts">
import CommandBlock from '~/components/landing/CommandBlock.vue'
import { blueprintCategoryMeta } from '~/utils/blueprintCategories'
import { BRAND_WARM_COMMAND_TOKEN_COLORS } from '~/utils/syntaxTheme'

/**
 * The pull step of the Blueprint way in. The slug inside the command is the
 * picker: pressing it opens a panel of the catalog, and choosing one rewrites
 * the command the copy control takes.
 *
 * The command is what the reader copies, so it has to name the Blueprint they
 * want rather than the one the copy happened to cite. The list is the catalog's
 * own, generated with the page the way `/blueprints` is.
 *
 * **The default is always a real slug** — the one the content names, or the
 * first published Blueprint when that one is gone. When the list is empty the
 * slug is drawn as plain text and the command still copies.
 *
 * **The command never wraps.** A slug pushed onto its own line read as a broken
 * command, so the line stays whole: the overlay is wide enough for it on a
 * desktop, and on a phone it scrolls sideways resting at its end, where the
 * slug is (`CommandBlock`'s `nowrap`).
 *
 * Each row wears the Blueprint's own Product logo, as the record page's switcher
 * does, so a Blueprint looks the same here as there (ADR-0020); the category's
 * label below the title says which shelf it sits on. A logo that fails to load
 * falls back to the category's icon in its tint. The slug is left out: the
 * command above already shows it.
 *
 * The panel was chosen over four other treatments (a dashed slug with a short
 * list, a pill, a hint line, a searchable list) auditioned in the theme lab.
 */
const { fallback } = defineProps<{ fallback: string }>()

const { data } = await useFetch('/_data/blueprints.json')

const blueprints = computed(() => (data.value?.blueprints ?? []).map(blueprint => ({
  slug: blueprint.slug,
  title: blueprint.title,
  logo: blueprint.logo,
  category: blueprintCategoryMeta(blueprint.category)
})))

// The menu renders only once opened, after hydration, so a failed logo can be
// caught by its error event alone.
const failedLogos = ref(new Set<string>())

const chosen = ref(fallback)
watch(blueprints, (list) => {
  if (list.length && !list.some(item => item.slug === chosen.value)) chosen.value = list[0]!.slug
}, { immediate: true })

const current = computed(() => blueprints.value.find(item => item.slug === chosen.value))
const prefix = ' @itai-gendler/pdd-kit blueprint pull '
const command = computed(() => `npx${prefix}${chosen.value}`)

const open = ref(false)
function pick(slug: string) {
  chosen.value = slug
  open.value = false
}

const triggerLabel = computed(() => `Choose a Blueprint, currently ${current.value?.title ?? chosen.value}`)

/**
 * A dropdown menu rather than a popover. The home page already loads the menu
 * for the header, so the panel adds nothing it must preload: a popover pulled
 * in floating primitives it shares with the tooltip and navigation menu, which
 * split those into new preloaded chunks and broke the performance budget. The
 * menu also brings arrow-key navigation through the list.
 */
const menuItems = computed(() => [
  [{ type: 'label' as const, label: 'Choose a Blueprint' }],
  blueprints.value.map(item => ({
    label: item.title,
    description: item.category.label,
    slot: 'blueprint' as const,
    blueprint: item,
    onSelect: () => pick(item.slug)
  })),
  [{ label: 'Browse all Blueprints', to: '/blueprints', slot: 'browse' as const, class: 'font-medium text-primary' }]
])

const MENU_UI = {
  content: 'w-[min(20rem,calc(100vw-2rem))]',
  label: 'font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-toned',
  itemDescription: 'text-xs text-dimmed'
}
</script>

<template>
  <CommandBlock :command="command" size="sm" nowrap>
    <span data-syntax-token="executable" :style="{ color: BRAND_WARM_COMMAND_TOKEN_COLORS.executable }">npx</span>
    <span data-syntax-token="arguments" :style="{ color: BRAND_WARM_COMMAND_TOKEN_COLORS.arguments }">{{ prefix }}</span>
    <span
      v-if="!blueprints.length"
      data-syntax-token="arguments"
      :style="{ color: BRAND_WARM_COMMAND_TOKEN_COLORS.arguments }"
    >{{ chosen }}</span>
    <UDropdownMenu
      v-else
      v-model:open="open"
      :items="menuItems"
      :content="{ align: 'end', side: 'bottom', sideOffset: 6, collisionPadding: 12 }"
      :ui="MENU_UI"
    >
      <!-- Focus is drawn inside the button: the line scrolls, so an outline
        outside it would be clipped. -->
      <button
        type="button"
        data-syntax-token="arguments"
        class="inline cursor-pointer rounded-xs border-b border-dotted border-current font-mono transition-colors hover:bg-primary/10 focus-visible:bg-primary/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary"
        :style="{ color: BRAND_WARM_COMMAND_TOKEN_COLORS.arguments }"
        :aria-label="triggerLabel"
      >
        {{ chosen }}<UIcon
          name="i-lucide-chevrons-up-down"
          class="ms-0.5 inline-block size-3 align-[-1px]"
          aria-hidden="true"
        />
      </button>

      <template #blueprint-leading="{ item }">
        <img
          v-if="!failedLogos.has(item.blueprint.logo)"
          :src="item.blueprint.logo"
          alt=""
          class="size-8 shrink-0 rounded-lg shadow-xs"
          @error="failedLogos = new Set(failedLogos).add(item.blueprint.logo)"
        >
        <span v-else class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-default bg-default shadow-xs">
          <UIcon :name="item.blueprint.category.icon" class="size-4" :class="item.blueprint.category.tone.ink" />
        </span>
      </template>
      <template #blueprint-trailing="{ item }">
        <UIcon v-if="item.blueprint.slug === chosen" name="i-lucide-check" class="size-4 shrink-0 text-primary" />
      </template>
      <template #browse-trailing>
        <UIcon name="i-lucide-arrow-right" class="ms-auto size-4 shrink-0 text-primary" />
      </template>
    </UDropdownMenu>
  </CommandBlock>
</template>
