<script setup lang="ts">
/**
 * One resource's standing against the baseline: added, changed, or removed.
 *
 * Worn on a row beside its title and on a page beside its name, with the
 * same three words and colours as the Review surface, so the mark is
 * read once and recognized everywhere.
 */
import type { ChangeKind } from 'businesslens/report'
import { CHANGE_META } from '../utils/reportChanges'

const props = withDefaults(defineProps<{
  change: ChangeKind
  /** A qualifier after the word, such as the baseline it is measured against. */
  since?: string
  size?: 'sm' | 'md'
}>(), { since: '', size: 'sm' })

const meta = computed(() => CHANGE_META[props.change])
</script>

<template>
  <UBadge
    :color="meta.color"
    variant="subtle"
    :size="size"
    :icon="meta.icon"
    data-change-mark
    :data-change="change"
    class="min-w-0 max-w-full shrink-0 gap-1 font-medium"
    :title="since ? `${meta.label} since ${since}` : meta.label"
  >
    <span class="truncate">{{ meta.label }}<template v-if="since"> since {{ since }}</template></span>
  </UBadge>
</template>
