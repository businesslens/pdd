<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { resourceAncestors } from '../utils/reportDestinations'
import { variationMembers } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const members = computed(() => variationMembers(props.workspace, props.resource))
const scope = computed(() => JSON.stringify([props.workspace.identity.id, 'variations', props.resource.key]))
const keys = computed(() => members.value.map(member => member.key))
const defaults = computed(() => [props.resource.key])
const expanded = useBlrStructureExpansion(scope, keys, defaults)
const owners = computed(() => new Map(members.value.map(member => [member.key, resourceAncestors(props.workspace, member)])))
const showOwners = computed(() => new Set([...owners.value.values()].map(items => items.map(item => item.key).join('|'))).size > 1)
const panelId = useId()
function toggle(key: string) {
  expanded.value = expanded.value.includes(key) ? expanded.value.filter(item => item !== key) : [...expanded.value, key]
}
</script>

<template>
  <section v-if="resource.variation" class="space-y-3" data-variations>
    <div class="space-y-1">
      <p class="blr-block-heading"><BlrTerm :slug="resource.variation.kind" /></p>
      <p class="text-sm text-muted">{{ members.length }} supported variations, including this resource.</p>
    </div>
    <article v-for="(member, index) in members" :key="member.key" class="rounded-lg border border-default p-4" :data-variation-member="member.key">
      <div class="flex min-w-0 items-start gap-2">
        <BlrKind :kind="member.kind" :labelled="false" class="mt-0.5 shrink-0" />
        <h3 class="min-w-0 flex-1 text-sm font-semibold text-highlighted [overflow-wrap:anywhere]">
          <span v-if="member.key === resource.key">{{ member.title }}</span>
          <BlrResourceLink v-else :resource-key="member.key" class="flex items-start justify-between gap-3 hover:underline" @open="emit('open', member)">
            <span>{{ member.title }}</span><UIcon name="i-lucide-chevron-right" class="mt-0.5 size-4 shrink-0 text-muted" />
          </BlrResourceLink>
        </h3>
        <span v-if="member.key === resource.key" class="shrink-0 text-xs text-muted" data-current-variation>Current</span>
      </div>
      <p v-if="showOwners && owners.get(member.key)?.length" class="mt-1 text-xs text-muted [overflow-wrap:anywhere]" data-variation-owner>
        Within {{ owners.get(member.key)!.map(owner => owner.title).join(' › ') }}
      </p>
      <button type="button" class="mt-2 flex min-h-7 items-center gap-1.5 rounded text-xs text-muted hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
        :aria-expanded="expanded.includes(member.key)" :aria-controls="`${panelId}-${index}`" :aria-label="`When used: ${member.title}`" @click="toggle(member.key)">
        <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0" :class="expanded.includes(member.key) && 'rotate-90'" />
        When used
      </button>
      <div v-show="expanded.includes(member.key)" :id="`${panelId}-${index}`" class="mt-2" data-variation-conditions>
        <BlrVariationUsage :workspace="workspace" :resource="member" @open="emit('open', $event)" />
      </div>
    </article>
  </section>
</template>
