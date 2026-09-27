<script setup lang="ts">
/**
 * A resource slideover's name: its type mark, title and definition, then where
 * it belongs — the type, its containing places and its Domains.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { KIND_TERM } from '../utils/vocabulary'

defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView, tab?: string }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const heading = useTemplateRef('heading')
defineExpose({ focus: (options?: FocusOptions) => heading.value?.focus(options) })
</script>

<template>
  <div class="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
    <BlrKind
      :kind="resource.kind"
      :interface-type="resource.kind === 'interface' ? resource.interfaceType : undefined"
      :member-kind="resource.kind === 'variation' ? resource.memberKind : undefined"
      :labelled="false"
      class="mt-0.5 shrink-0"
    />
    <div class="min-w-0 flex-1">
      <h2 ref="heading" tabindex="-1" class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base leading-6 font-semibold text-highlighted outline-none" data-resource-heading>
        <span class="min-w-0 break-words" data-resource-title>{{ resource.title }}</span>
        <BlrTerm :slug="KIND_TERM[resource.kind]" :text="resource.title" icon-only />
        <BlrNavigationMark v-if="resource.kind === 'screen' && resource.alwaysReachable" class="mt-0.5 shrink-0" />
        <!-- Whether this is one of a set, said where the reader looks first. -->
        <BlrVariationPill
          v-if="resource.kind === 'variation' || resource.variation"
          :workspace="workspace"
          :resource="resource"
          :tab="tab"
          class="text-xs font-medium"
          @open="emit('open', $event)"
        />
      </h2>
      <BlrResourceContext :key="resource.key" :workspace="workspace" :resource="resource" class="mt-0.5" @open="emit('open', $event)" />
    </div>
  </div>
</template>
