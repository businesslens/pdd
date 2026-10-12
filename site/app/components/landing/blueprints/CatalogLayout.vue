<script setup lang="ts">
import type { BlueprintCard as CatalogBlueprint } from '~/utils/blueprints'
import type { CatalogFilters } from '~/utils/blueprintCatalog'
import { Motion } from 'motion-v'
import BlueprintCard from '~/components/landing/blueprints/BlueprintCard.vue'
import CatalogEmpty from '~/components/landing/blueprints/CatalogEmpty.vue'
import CatalogHero from '~/components/landing/blueprints/CatalogHero.vue'
import CatalogInvitations from '~/components/landing/blueprints/CatalogInvitations.vue'
import CatalogSearch from '~/components/landing/blueprints/CatalogSearch.vue'
import CategoryNav from '~/components/landing/blueprints/CategoryNav.vue'
import { blueprintCategoryEntries } from '~/utils/blueprintCategories'
import {
  catalogFiltersActive,
  catalogResultSummary,
  filterBlueprints
} from '~/utils/blueprintCatalog'

/**
 * The catalog listing: the hero, then search, the result row, and the grid,
 * set close beneath it. One layout at every size — see ADR-0019.
 *
 * The category sidebar is the one part that depends on the catalog: it appears
 * from `lg` only when there is more than one category to choose between, and
 * below `lg` the toolbar's category select does its job. A sidebar holding a
 * single category is a control with nothing to control.
 *
 * Besides the listing there is one state: `empty`, a catalog with nothing
 * listed. The list is generated with the page, so it never arrives late.
 *
 * Filtering happens here, because the toolbar, the sidebar, and the result row
 * all act on it.
 */
const props = defineProps<{
  blueprints: CatalogBlueprint[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const search = defineModel<string>('search', { default: '' })
const category = defineModel<string | undefined>('category', { default: undefined })

const state = computed(() => props.blueprints.length ? 'listing' : 'empty')
const categories = computed(() => blueprintCategoryEntries(props.blueprints))
const sidebar = computed(() => state.value === 'listing' && categories.value.length > 1)

// A category the catalog does not list is no filter at all, rather than an
// empty result naming a shelf that does not exist.
const filters = computed<CatalogFilters>(() => ({
  search: search.value,
  category: categories.value.some(entry => entry.value === category.value) ? category.value : undefined
}))

const filtering = computed(() => catalogFiltersActive(filters.value))
const filtered = computed(() => filterBlueprints(props.blueprints, filters.value))
const summary = computed(() => catalogResultSummary(props.blueprints.length, filtered.value.length, filtering.value))

const { staggerMotion } = useLandingMotion()
</script>

<template>
  <div :class="sidebar ? 'grid gap-8 lg:grid-cols-[15rem_1fr]' : undefined" :data-catalog-state="state">
    <!-- The rule runs the full height of the row, the way the mock draws the
      sidebar as its own column rather than a floating panel. -->
    <aside v-if="sidebar" class="hidden lg:block lg:border-e lg:border-default lg:pe-6">
      <CategoryNav v-model:category="category" :categories="categories" />
      <CatalogInvitations class="mt-6" />
    </aside>

    <div class="min-w-0">
      <CatalogHero />

      <CatalogEmpty
        v-if="state === 'empty'"
        :total="0"
        class="mt-8"
      />

      <template v-else>
        <CatalogSearch
          v-model:search="search"
          v-model:category="category"
          :categories="categories"
          :sidebar="sidebar"
          class="mt-8"
        />

        <!-- Fixed height, so the clear action arriving with the first
          keystroke moves nothing. -->
        <div class="mt-3 flex h-8 items-center gap-3">
          <p class="text-sm text-muted" role="status" data-catalog-summary>
            {{ summary }}
          </p>
          <UButton
            v-if="filtering"
            label="Clear filters"
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="sm"
            class="-ms-1"
            @click="emit('clear')"
          />
        </div>

        <div
          v-if="filtered.length"
          class="mt-3 grid gap-5 sm:grid-cols-2"
          :class="sidebar ? 'xl:grid-cols-3 2xl:grid-cols-4' : 'lg:grid-cols-3 2xl:grid-cols-4'"
        >
          <Motion
            v-for="(blueprint, index) in filtered"
            :key="blueprint.slug"
            v-bind="staggerMotion(index % 6)"
          >
            <BlueprintCard :blueprint="blueprint" class="h-full" />
          </Motion>
        </div>
        <CatalogEmpty
          v-else
          :total="blueprints.length"
          class="mt-3"
          @clear="emit('clear')"
        />

        <!-- With a sidebar these live in it from `lg`, so this copy covers only
          the widths below. Without one, this is their only place: after the
          listing, where a reader who did not find what they came for ends up. -->
        <CatalogInvitations
          layout="row"
          class="mt-10"
          :class="sidebar ? 'lg:hidden' : undefined"
        />
      </template>
    </div>
  </div>
</template>
