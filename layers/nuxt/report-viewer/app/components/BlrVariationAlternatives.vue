<script setup lang="ts">
/**
 * A Variation's alternatives, each read in its own words: its statement or
 * description, its Version label, and the condition that selects it. Where the
 * alternatives sit under different owners, each says where; membership never
 * moves anything.
 */
import type { AnyResourceView, ReportWorkspace, VariationSetView } from '../utils/reportWorkspace'
import { resourceAncestors } from '../utils/reportDestinations'
import { variationAlternatives } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, set: VariationSetView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const alternatives = computed(() => variationAlternatives(props.workspace, props.set))
const selection = (key: string) => props.set.alternatives.find(item => item.key === key)
const owners = computed(() => new Map(alternatives.value.map(item => [item.key, resourceAncestors(props.workspace, item)])))
const showOwners = computed(() => new Set([...owners.value.values()].map(items => items.map(item => item.key).join('|'))).size > 1)
</script>

<template>
  <section class="space-y-3" data-variation-alternatives>
    <article v-for="alternative in alternatives" :key="alternative.key" class="rounded-lg border border-default p-4" :data-variation-alternative="alternative.key">
      <div class="flex min-w-0 items-start gap-2">
        <BlrKind
          :kind="alternative.kind"
          :interface-type="alternative.kind === 'interface' ? alternative.interfaceType : undefined"
          :labelled="false"
          class="mt-0.5 shrink-0"
        />
        <h3 class="min-w-0 flex-1 text-sm font-semibold text-highlighted [overflow-wrap:anywhere]">
          <BlrResourceLink :resource-key="alternative.key" class="flex items-start justify-between gap-3 hover:underline" @open="emit('open', alternative)">
            <span>
              {{ alternative.title }}
              <span v-if="selection(alternative.key)?.label" class="ms-1.5 font-mono text-xs font-normal text-muted">{{ selection(alternative.key)?.label }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="mt-0.5 size-4 shrink-0 text-muted" />
          </BlrResourceLink>
        </h3>
      </div>
      <p v-if="showOwners && owners.get(alternative.key)?.length" class="mt-1 ps-7 text-xs text-muted [overflow-wrap:anywhere]" data-variation-owner>
        Within {{ owners.get(alternative.key)!.map(owner => owner.title).join(' › ') }}
      </p>
      <BlrProse v-if="alternative.lead" :text="alternative.lead" size="sm" class="mt-1 ps-7" />
      <dl class="@container mt-3 ps-7 text-sm">
        <div class="grid gap-1 @min-sm:grid-cols-[9rem_minmax(0,1fr)] @min-sm:gap-x-4" data-selected-when>
          <dt class="text-xs font-medium text-muted">Selected when</dt>
          <dd><BlrProse :text="selection(alternative.key)?.selectedWhen ?? ''" size="sm" /></dd>
        </div>
      </dl>
    </article>
  </section>
</template>
