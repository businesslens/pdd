<script setup lang="ts">
import {
  businessLensLogoSrc,
  type BusinessLensLogoDisplay,
  type BusinessLensLogoVariant
} from '../utils/businesslensThemeLabVariants'

const {
  markVariants,
  lockupVariants,
  activeMark,
  activeLockup,
  display,
  selectMark,
  selectLockup,
  setDisplay
} = useBusinessLensLogoVariant()

const TEXT_OPTION = { id: 'text', name: 'Text', tagline: 'Live text beside the mark' }

function pick(group: BusinessLensLogoDisplay, id: string) {
  if (group === 'mark') {
    selectMark(id)
  } else if (id === TEXT_OPTION.id) {
    setDisplay('mark')
  } else {
    selectLockup(id)
    setDisplay('lockup')
  }
}

const groups = computed(() => [
  {
    key: 'mark' as const,
    label: 'Mark',
    items: markVariants,
    activeId: activeMark.value.id
  },
  {
    key: 'lockup' as const,
    label: 'Lockup',
    items: [TEXT_OPTION, ...lockupVariants],
    activeId: display.value === 'lockup' ? activeLockup.value.id : TEXT_OPTION.id
  }
])

type ChipState = 'active' | 'remembered' | 'idle'

function chipState(group: { key: BusinessLensLogoDisplay, activeId: string }, item: { id: string }): ChipState {
  if (item.id === group.activeId) return 'active'
  if (group.key === 'lockup' && item.id === activeLockup.value.id) return 'remembered'
  return 'idle'
}

const CHIP_CLASSES: Record<ChipState, string> = {
  active: 'border-primary bg-primary/10 text-highlighted',
  remembered: 'border-default bg-default/60 text-default',
  idle: 'border-transparent text-toned hover:border-default hover:bg-default/60'
}

function isWordmark(item: { id: string }): item is BusinessLensLogoVariant {
  return item.id !== TEXT_OPTION.id
}
</script>

<template>
  <div
    data-logo-row
    class="flex h-(--businesslens-theme-lab-row-height) items-center gap-3 overflow-x-auto px-3 sm:px-4"
  >
    <span class="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-toned sm:inline-flex">
      <UIcon name="i-lucide-shapes" class="size-3.5" />
      Logo
    </span>

    <div
      v-for="group in groups"
      :key="group.key"
      role="group"
      :aria-label="`${group.label} logo variants`"
      class="flex shrink-0 items-center gap-1"
    >
      <span class="inline-flex items-center ps-1 pe-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-toned">
        {{ group.label }}
      </span>
      <button
        v-for="item in group.items"
        :key="item.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs whitespace-nowrap transition-transform active:scale-[0.98]"
        :class="CHIP_CLASSES[chipState(group, item)]"
        :aria-pressed="chipState(group, item) === 'active'"
        :title="`${group.label}: ${item.tagline}`"
        @click="pick(group.key, item.id)"
      >
        <template v-if="isWordmark(item)">
          <img
            :src="businessLensLogoSrc(item)"
            alt=""
            class="h-4 shrink-0 object-contain dark:hidden"
            :class="group.key === 'lockup' ? 'w-10' : 'w-4'"
          >
          <img
            :src="businessLensLogoSrc(item, true)"
            alt=""
            class="hidden h-4 shrink-0 object-contain dark:block"
            :class="group.key === 'lockup' ? 'w-10' : 'w-4'"
          >
        </template>
        <UIcon
          v-else
          name="i-lucide-type"
          class="size-4 shrink-0"
        />
        <span class="font-medium">{{ item.name }}</span>
      </button>
    </div>
  </div>
</template>
