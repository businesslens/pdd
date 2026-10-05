<script setup lang="ts">
/**
 * A resource slideover's name: its type mark, title and definition, then where
 * it belongs — the type, its containing places and its Domains.
 *
 * An alternative is titled by its Variation, and the picker beside the title
 * names the alternative being read. Switching replaces the reading under the
 * same title.
 */
import type { AnyResourceView, ReportWorkspace } from '../utils/reportWorkspace'
import { KIND_TERM } from '../utils/vocabulary'
import { titledBy } from '../utils/variations'

const props = defineProps<{ workspace: ReportWorkspace, resource: AnyResourceView, tab?: string }>()
const emit = defineEmits<{ open: [resource: AnyResourceView] }>()
const heading = useTemplateRef('heading')
defineExpose({ focus: (options?: FocusOptions) => heading.value?.focus(options) })
const title = computed(() => titledBy(props.workspace, props.resource))
const varied = computed(() => title.value.kind === 'variation')
</script>

<template>
  <div class="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
    <BlrKind
      :kind="title.kind"
      :interface-type="title.kind === 'interface' ? title.interfaceType : undefined"
      :member-kind="title.kind === 'variation' ? title.memberKind : undefined"
      :facet="title.kind === 'variation' ? title.memberFacet : undefined"
      :labelled="false"
      class="mt-0.5 shrink-0"
    />
    <div class="min-w-0 flex-1">
      <h2 ref="heading" tabindex="-1" class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base leading-6 font-semibold text-highlighted outline-none" data-resource-heading>
        <span class="min-w-0 break-words" data-resource-title>{{ title.title }}</span>
        <BlrTerm :slug="KIND_TERM[title.kind]" :text="title.title" icon-only />
        <!-- The alternative being read, said where the reader looks first. -->
        <BlrVariationPicker
          v-if="varied"
          :workspace="workspace"
          :resource="resource"
          :tab="tab"
          mode="replace"
          class="font-medium"
          @open="emit('open', $event)"
        />
      </h2>
      <BlrResourceContext :key="resource.key" :workspace="workspace" :resource="resource" class="mt-0.5" @open="emit('open', $event)" />
    </div>
  </div>
</template>
