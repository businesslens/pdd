<script setup lang="ts">
/**
 * Where a resource belongs, in one short line under its title: its type, the
 * nearest place containing it with that place's own mark, and its Domains as
 * marks. The full containing path is the nearest place's tooltip; each place
 * and Domain opens.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { resourceAncestors, resourceDomains } from '../utils/reportDestinations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const ancestors = computed(() => resourceAncestors(props.workspace, props.resource))
const domains = computed(() => resourceDomains(props.workspace, props.resource))
/* A set reads as the type it varies. */
const label = computed(() => props.resource.kind === 'variation'
  ? `${ENTITY_KIND_META[props.resource.memberKind].label} variation`
  : ENTITY_KIND_META[props.resource.kind].label)
const parent = computed(() => ancestors.value.at(-1))
const path = computed(() => ancestors.value.map(item => item.title).join(' › '))
const domain = computed(() => domains.value[0])
const hidden = computed(() => domains.value.slice(1))
const overflowLabel = computed(() => `${hidden.value.length} more ${hidden.value.length === 1 ? 'domain' : 'domains'}`)
const open = ref(false)
watch([() => props.resource.key, domains], () => { open.value = false })
function select(domain: AnyResourceView) { open.value = false; emit('open', domain) }
</script>

<template>
  <p class="flex min-w-0 items-center gap-1.5 text-xs leading-5 whitespace-nowrap text-muted" data-resource-context>
    <span class="shrink-0">{{ label }}</span>
    <template v-if="parent">
      <span class="shrink-0">in</span>
      <UTooltip :text="path" :disabled="ancestors.length < 2" :delay-duration="150">
        <BlrResourceLink :resource-key="parent.key" class="inline-flex min-w-6 items-center gap-1 text-default hover:[&>span]:underline" data-context-parent @open="emit('open', parent)">
          <BlrKind :kind="parent.kind" :interface-type="parent.kind === 'interface' ? parent.interfaceType : undefined" :labelled="false" size="xs" class="shrink-0" />
          <span class="min-w-0 truncate">{{ parent.title }}</span>
        </BlrResourceLink>
      </UTooltip>
    </template>
    <span v-if="domain" class="-my-1 inline-flex shrink-0 items-center gap-0.5" data-context-domains>
      <UTooltip :text="`Domain: ${domain.title}`" :delay-duration="150">
        <BlrResourceLink :resource-key="domain.key" :aria-label="`Domain: ${domain.title}`" class="inline-flex size-6 items-center justify-center rounded-sm hover:bg-elevated" @open="emit('open', domain)">
          <BlrKind kind="domain" :labelled="false" size="xs" />
        </BlrResourceLink>
      </UTooltip>
      <UPopover v-if="hidden.length" v-model:open="open" :content="{ align: 'start', sideOffset: 4, collisionPadding: 12 }"
        :ui="{ content: 'blr-report-shell w-max max-w-[min(20rem,calc(100vw-1.5rem))] p-1' }">
        <button type="button" class="rounded-sm px-1 text-xs text-muted hover:bg-elevated hover:text-default" :aria-label="`Show ${overflowLabel}`" data-domain-overflow>+{{ hidden.length }}</button>
        <template #content>
          <ul class="max-h-64 overflow-y-auto" :aria-label="`${domains.length} domains`">
            <li v-for="item in domains" :key="item.key">
              <BlrResourceLink :resource-key="item.key" :aria-label="`Domain: ${item.title}`" class="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-start text-sm text-default hover:bg-elevated focus-visible:bg-elevated" @open="select(item)">
                <BlrKind kind="domain" :labelled="false" size="xs" class="mt-0.5 shrink-0" />
                <span class="min-w-0 [overflow-wrap:anywhere]">{{ item.title }}</span>
              </BlrResourceLink>
            </li>
          </ul>
        </template>
      </UPopover>
    </span>
  </p>
</template>
