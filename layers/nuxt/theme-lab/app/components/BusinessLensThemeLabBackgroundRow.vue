<script setup lang="ts">
const {
  lightBackgrounds,
  darkBackgrounds,
  activeLight,
  activeDark,
  selectLight,
  selectDark
} = useBusinessLensBackgroundVariant()

const colorMode = useColorMode()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const isDark = computed(() => mounted.value && colorMode.value === 'dark')
const activeGroup = computed(() => (mounted.value ? (isDark.value ? 'dark' : 'light') : null))

function setMode(dark: boolean) {
  colorMode.preference = dark ? 'dark' : 'light'
}

function pick(group: 'light' | 'dark', id: string) {
  if (group === 'light') {
    selectLight(id)
    if (isDark.value) setMode(false)
  } else {
    selectDark(id)
    if (!isDark.value) setMode(true)
  }
}

const groups = computed(() => [
  { key: 'light' as const, label: 'Light', items: lightBackgrounds, activeId: activeLight.value.id },
  { key: 'dark' as const, label: 'Dark', items: darkBackgrounds, activeId: activeDark.value.id }
])

defineShortcuts(Object.fromEntries(
  Array.from({ length: 5 }, (_, index) => [
    String(index + 1),
    () => {
      const group = isDark.value ? 'dark' : 'light'
      const list = isDark.value ? darkBackgrounds : lightBackgrounds
      const item = list[index]
      if (item) pick(group, item.id)
    }
  ])
))
</script>

<template>
  <div
    data-background-row
    class="flex h-(--businesslens-theme-lab-row-height) items-center gap-3 overflow-x-auto px-3 sm:px-4"
  >
    <span class="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-toned sm:inline-flex">
      <UIcon name="i-lucide-swatch-book" class="size-3.5" />
      Background
    </span>

    <div
      v-for="group in groups"
      :key="group.key"
      role="group"
      :aria-label="`${group.label} background variants`"
      class="flex shrink-0 items-center gap-1"
    >
      <span
        class="inline-flex items-center gap-1 ps-1 pe-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
        :class="activeGroup === group.key ? 'text-primary' : 'text-toned'"
      >
        <span
          v-if="activeGroup === group.key"
          class="size-1 rounded-full bg-primary"
          aria-hidden="true"
        />
        {{ group.label }}
      </span>
      <button
        v-for="(item, index) in group.items"
        :key="item.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs whitespace-nowrap transition"
        :class="item.id === group.activeId
          ? 'border-primary bg-primary/10 text-highlighted'
          : 'border-transparent text-toned hover:border-default hover:bg-default/60'"
        :aria-pressed="item.id === group.activeId"
        :title="`${group.label} background: ${item.tagline}${activeGroup === group.key ? ` (press ${index + 1})` : ''}`"
        @click="pick(group.key, item.id)"
      >
        <span
          class="size-3.5 shrink-0 rounded-full border border-black/25 dark:border-white/30"
          :style="{ background: item.preview }"
          aria-hidden="true"
        />
        <span class="font-medium">{{ item.name }}</span>
      </button>
    </div>

    <div class="ms-auto flex shrink-0 items-center gap-2 ps-2">
      <ClientOnly>
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="setMode(!isDark)"
        />
        <template #fallback>
          <div class="size-6" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
