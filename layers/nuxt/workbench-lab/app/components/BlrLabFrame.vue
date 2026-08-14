<script setup lang="ts">
/**
 * The chrome every variation keeps: which Product, which reading, and ⌘K.
 *
 * Deliberately thin. If a variation needed different chrome to work, that would
 * be a finding about the variation, so the frame gives each of them the same
 * strip and no more.
 */
import type { AnyEntityView, ReportWorkspace } from '../utils/model'
import type { WorkbenchVariant } from '../utils/workbenchVariants'

defineProps<{
  workspace: ReportWorkspace
  variant: WorkbenchVariant
  logoSrc?: string | null
  /** What the variation is showing right now, for the strip's right side. */
  status?: string
}>()

const emit = defineEmits<{ select: [entity: AnyEntityView] }>()

const searchOpen = ref(false)
</script>

<template>
  <div class="blr-lab flex h-full min-h-0 flex-col text-sm">
    <header class="flex shrink-0 items-center gap-3 border-b border-default px-4 py-2.5">
      <img v-if="logoSrc" :src="logoSrc" alt="" class="size-6 shrink-0 rounded-md border border-muted bg-elevated object-contain p-0.5">
      <UIcon v-else name="i-lucide-package" class="size-5 shrink-0 text-primary" />
      <span class="truncate text-sm font-semibold tracking-tight text-highlighted">
        {{ workspace.identity.title }}
      </span>

      <UIcon name="i-lucide-chevron-right" class="hidden size-3.5 shrink-0 text-dimmed sm:block" />
      <span class="blr-lab-eyebrow hidden shrink-0 items-center gap-1.5 sm:inline-flex">
        <UIcon :name="variant.icon" class="size-3.5" />
        {{ variant.name }}
      </span>
      <span v-if="status" class="blr-meta hidden min-w-0 truncate sm:inline">{{ status }}</span>

      <span class="ms-auto flex shrink-0 items-center gap-2.5">
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="outline"
          size="xs"
          label="Search"
          class="rounded-full"
          @click="searchOpen = true"
        >
          <template #trailing>
            <span class="hidden items-center gap-0.5 sm:flex">
              <UKbd value="meta" />
              <UKbd value="K" />
            </span>
          </template>
        </UButton>
        <span class="blr-meta hidden md:inline">{{ workspace.counts.journeys }}J · {{ workspace.counts.capabilities }}C · {{ workspace.counts.screens }}S</span>
      </span>
    </header>

    <div class="flex min-h-0 flex-1">
      <slot />
    </div>

    <BlrSearchPalette
      v-model:open="searchOpen"
      :workspace="workspace"
      @select="emit('select', $event)"
    />
  </div>
</template>

<style scoped>
.blr-lab {
  --blr-slot-0: #2a78d6;
  --blr-slot-1: #eb6834;
  --blr-slot-2: #1baf7a;
  --blr-slot-3: #eda100;
  --blr-slot-4: #e87ba4;
  --blr-slot-5: #008300;
  --blr-slot-6: #4a3aa7;
  --blr-slot-7: #e34948;
  --blr-slot-8: #746651;
  --blr-slot-9: #2a78d6;
  font-variant-numeric: tabular-nums;
}

:global(.dark) .blr-lab {
  --blr-slot-0: #3987e5;
  --blr-slot-1: #d95926;
  --blr-slot-2: #199e70;
  --blr-slot-3: #c98500;
  --blr-slot-4: #d55181;
  --blr-slot-5: #008300;
  --blr-slot-6: #9085e9;
  --blr-slot-7: #e66767;
  --blr-slot-8: #ab9d81;
  --blr-slot-9: #3987e5;
}

.blr-lab-eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}
</style>
