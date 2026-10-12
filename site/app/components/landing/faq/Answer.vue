<script setup lang="ts">
import type { AnswerBoundary, AnswerComparison, AnswerPart, AnswerStack } from '~~/shared/faq-types'
import CommandBlock from '~/components/landing/CommandBlock.vue'

/**
 * Renders one answer from its parts.
 *
 * Shared by the FAQ layout because this is content logic rather than page
 * layout: answers are paragraphs with links sitting inside sentences, with an
 * optional structured comparison, boundary or stack before them. Building the
 * copy from data keeps links and table semantics explicit without `v-html`.
 */
const { paragraphs, boundary } = defineProps<{
  paragraphs: AnswerPart[][]
  comparison?: AnswerComparison
  boundary?: AnswerBoundary
  stack?: AnswerStack
}>()

// Commands are blocks. Keep them outside <p> so SSR and browser markup agree.
const blocks = computed(() => paragraphs.flatMap((paragraph) => {
  const result: Array<{ parts: AnswerPart[], command?: string }> = []
  let parts: AnswerPart[] = []
  for (const part of paragraph) {
    if (part.code) {
      if (parts.length) result.push({ parts })
      result.push({ parts: [], command: part.text })
      parts = []
    } else parts.push(part)
  }
  if (parts.length) result.push({ parts })
  return result
}))

const sides = computed(() => boundary
  ? [
      { ...boundary.kept, icon: 'i-lucide-check', tone: 'text-highlighted' },
      { ...boundary.left, icon: 'i-lucide-minus', tone: 'text-muted' }
    ]
  : [])
</script>

<template>
  <p v-if="comparison" class="text-base leading-7 text-pretty text-default">
    {{ comparison.lead }}
  </p>

  <!-- Three columns do not fit a phone. Below `sm` the same rows read as a
    list, each label above its two values; the table takes over from `sm`. -->
  <dl
    v-if="comparison"
    class="divide-y divide-default border-y border-default sm:hidden"
    data-comparison="stacked"
  >
    <div v-for="row in comparison.rows" :key="row.label" class="py-3">
      <dt class="text-sm font-semibold text-highlighted">
        {{ row.label }}
      </dt>
      <dd
        v-for="(value, valueIndex) in row.values"
        :key="`${row.label}-${valueIndex}`"
        class="mt-1.5 text-sm leading-6 text-default"
      >
        <span class="block font-mono text-xs tracking-[0.08em] uppercase text-muted">{{ comparison.columns[valueIndex] }}</span>
        {{ value }}
      </dd>
    </div>
  </dl>

  <div
    v-if="comparison"
    role="region"
    :aria-label="comparison.caption"
    tabindex="0"
    class="content-table-frame max-sm:hidden"
  >
    <table class="content-table">
      <caption class="sr-only">
        {{ comparison.caption }}
      </caption>
      <thead>
        <tr>
          <th scope="col" class="w-32 sm:w-40" />
          <th
            v-for="column in comparison.columns"
            :key="column"
            scope="col"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in comparison.rows" :key="row.label">
          <th scope="row">
            {{ row.label }}
          </th>
          <td
            v-for="(value, valueIndex) in row.values"
            :key="`${row.label}-${valueIndex}`"
          >
            {{ value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-if="stack" class="text-base leading-7 text-pretty text-default">
    {{ stack.lead }}
  </p>

  <div
    v-if="stack"
    role="region"
    :aria-label="stack.caption"
    tabindex="0"
    class="content-table-frame"
  >
    <table class="content-table">
      <caption class="sr-only">
        {{ stack.caption }}
      </caption>
      <thead>
        <tr>
          <th scope="col">
            Information source
          </th>
          <th scope="col">
            Goal
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="layer in stack.layers"
          :key="layer.label"
          :data-highlighted="layer.highlight || undefined"
        >
          <th
            scope="row"
            class="sm:whitespace-nowrap"
          >
            {{ layer.label }}
          </th>
          <td>
            {{ layer.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p v-if="boundary" class="text-base leading-7 text-pretty text-default">
    {{ boundary.lead }}
  </p>

  <div
    v-if="boundary"
    class="grid gap-6 rounded-xl border border-default px-4 py-4 sm:grid-cols-2 sm:px-5"
    data-boundary
  >
    <div v-for="side in sides" :key="side.label">
      <h3 class="font-mono text-xs tracking-[0.14em] uppercase text-muted">
        {{ side.label }}
      </h3>
      <ul class="mt-3 space-y-1.5">
        <li
          v-for="item in side.items"
          :key="item"
          class="flex items-center gap-2 text-sm leading-6"
          :class="side.tone"
        >
          <UIcon :name="side.icon" class="size-4 shrink-0" aria-hidden="true" />
          {{ item }}
        </li>
      </ul>
    </div>
  </div>

  <template v-for="(block, blockIndex) in blocks" :key="blockIndex">
    <CommandBlock
      v-if="block.command"
      :command="block.command"
      :prompt="block.command.startsWith('/') ? null : '$'"
      size="sm"
      nowrap
    />
    <p
      v-else
      class="text-base leading-7 text-pretty text-default"
    >
      <template v-for="(part, partIndex) in block.parts" :key="partIndex">
        <NuxtLink
          v-if="part.to"
          :to="part.to"
          :external="part.external"
          :target="part.external ? '_blank' : undefined"
          :rel="part.external ? 'noopener noreferrer' : undefined"
          class="font-medium text-primary underline decoration-1 underline-offset-2 hover:decoration-2"
        >{{ part.text }}</NuxtLink>
        <strong v-else-if="part.bold">{{ part.text }}</strong>
        <template v-else>
          {{ part.text }}
        </template>
      </template>
    </p>
  </template>
</template>
