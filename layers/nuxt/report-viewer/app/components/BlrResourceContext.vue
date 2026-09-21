<script setup lang="ts">
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { ENTITY_KIND_META } from '../utils/reportWorkspace'
import { resourceReviewKey, reviewResource } from '../utils/resourceReview'
import { resourceAncestors, resourceDomains } from '../utils/reportDestinations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const ancestors = computed(() => resourceAncestors(props.workspace, props.resource))
const domains = computed(() => resourceDomains(props.workspace, props.resource))
const review = inject(resourceReviewKey, computed(() => null))
const beforeResource = computed(() => reviewResource(review.value, 'before', props.resource.key))
const previousDomains = computed(() => beforeResource.value && review.value?.before ? resourceDomains(review.value.before.workspace, beforeResource.value) : [])
const domainIds = (values: Array<{ id: string }>) => values.map(value => value.id)
const label = computed(() => ENTITY_KIND_META[props.resource.kind].label)
const open = ref(false)
const domain = computed(() => domains.value[0])
const hidden = computed(() => domains.value.slice(1))
const overflowLabel = computed(() => `${hidden.value.length} more ${hidden.value.length === 1 ? 'domain' : 'domains'}`)
watch([() => props.resource.key, domains], () => { open.value = false })
function select(domain: AnyResourceView) { open.value = false; emit('open', domain) }
</script>

<template>
  <div class="min-w-0 text-xs text-muted" data-resource-context>
    <div class="flex min-h-7 min-w-0 items-center gap-1.5 whitespace-nowrap">
      <span class="shrink-0">{{ label }}</span>
      <span v-for="ancestor in ancestors" :key="ancestor.key" class="inline-flex min-w-6 items-center gap-1.5">
        <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0" />
        <BlrResourceLink :resource-key="ancestor.key" :title="ancestor.title" class="min-w-0 truncate hover:underline" @open="emit('open', ancestor)">{{ ancestor.title }}</BlrResourceLink>
      </span>
      <BlrReviewValue v-if="domains.length || previousDomains.length" inline :before="domainIds(previousDomains)" :after="domainIds(domains)" label="Domain">
      <span v-if="domain" class="inline-flex min-w-0 items-center gap-1.5" data-inline-domain>
        <span aria-hidden="true" class="shrink-0">·</span>
        <BlrResourceLink :resource-key="domain.key" :aria-label="`Domain: ${domain.title}`" :title="domain.title" class="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-default hover:underline" @open="emit('open', domain)">
          <BlrKind kind="domain" :labelled="false" size="xs" class="shrink-0" />
          <span class="truncate">{{ domain.title }}</span>
        </BlrResourceLink>
      </span>
      <UPopover v-if="hidden.length" v-model:open="open" class="shrink-0" :content="{ align: 'start', sideOffset: 4, collisionPadding: 12 }"
        :ui="{ content: 'blr-report-shell w-max max-w-[min(20rem,calc(100vw-1.5rem))] p-1' }">
        <UButton :label="`+${hidden.length} more`" :aria-label="`Show ${overflowLabel}`" color="neutral" variant="ghost" size="sm" :ui="{ label: 'text-xs' }" data-domain-overflow />
        <template #content>
          <ul class="max-h-64 overflow-y-auto" :aria-label="overflowLabel">
            <li v-for="domain in hidden" :key="domain.key">
              <BlrResourceLink :resource-key="domain.key" :aria-label="`Domain: ${domain.title}`" class="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-start text-sm text-default hover:bg-elevated focus-visible:bg-elevated" @open="select(domain)">
                <BlrKind kind="domain" :labelled="false" size="xs" class="mt-0.5 shrink-0" />
                <span class="min-w-0 [overflow-wrap:anywhere]">{{ domain.title }}</span>
              </BlrResourceLink>
            </li>
          </ul>
        </template>
      </UPopover>
      <span v-if="!domains.length">{{ previousDomains.map(domain => domain.title).join(', ') }}</span>
      <template #before>{{ previousDomains.map(domain => domain.title).join(', ') }}</template>
      </BlrReviewValue>
    </div>
  </div>
</template>
