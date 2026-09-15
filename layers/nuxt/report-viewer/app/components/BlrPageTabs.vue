<script setup lang="ts">
/** One transparent reading switch, with optional controls for the active set. */
defineProps<{
  items: { id: string, label: string, count?: number }[]
  label: string
}>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="@container flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2" data-page-tabs>
    <UTabs
      v-model="model"
      :items="items"
      value-key="id"
      :content="false"
      variant="link"
      color="neutral"
      size="md"
      as="nav"
      :aria-label="label"
      class="max-w-full shrink-0"
      :ui="{
        list: 'gap-1 border-0 p-0 m-0',
        trigger: 'shrink-0 rounded-none px-3 py-2 @max-sm:px-1 data-[state=active]:font-semibold',
        indicator: 'bottom-0 h-0.5 bg-(--ui-color-primary-500)'
      }"
    >
      <template #trailing="{ item }">
        <span v-if="item.count !== undefined" class="blr-meta">{{ item.count }}</span>
      </template>
    </UTabs>
    <div v-if="$slots.actions" class="ms-auto flex shrink-0 items-center gap-2 py-1">
      <slot name="actions" />
    </div>
  </div>
</template>
