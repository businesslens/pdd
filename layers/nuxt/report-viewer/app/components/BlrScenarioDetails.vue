<script setup lang="ts">
import type { ScenarioView } from '../utils/reportWorkspace'
import { scenarioTerm } from '../utils/vocabulary'
const props = defineProps<{ scenario: ScenarioView }>()
const scenarioWord = (word: 'decision-point' | 'edge-case') => scenarioTerm(props.scenario.scenarioType, word)
</script>
<template>
  <div class="space-y-4">
            <section v-if="scenario.decisionPoints.length" class="space-y-2">
              <h4 class="text-[0.8125rem] font-semibold text-highlighted"><BlrTerm :slug="scenarioWord('decision-point')" text="Decision points" /></h4>
              <div class="grid gap-3 @min-[640px]:grid-cols-2">
                <div v-for="point in scenario.decisionPoints" :key="point.title" class="rounded-xl border border-dashed border-accented p-4">
                  <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
                    <UIcon name="i-lucide-git-branch" class="size-4 text-muted" />{{ point.title }}
                  </p>
                  <BlrProse :text="point.question" class="mt-2" />
                  <ul class="mt-3 space-y-2">
                    <li v-for="branch in point.branches" :key="branch.condition" class="flex items-start gap-2 text-sm">
                      <code class="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-highlighted">{{ branch.condition }}</code>
                      <UIcon name="i-lucide-arrow-right" class="mt-1 size-3 shrink-0 text-dimmed" />
                      <span class="text-default">{{ branch.outcome }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
            <section v-if="scenario.edgeCases.length" class="space-y-1">
              <h4 class="text-[0.8125rem] font-semibold text-highlighted"><BlrTerm :slug="scenarioWord('edge-case')" text="Edge cases" /></h4>
              <ul class="max-w-3xl space-y-1.5 text-sm text-default">
                <li v-for="edgeCase in scenario.edgeCases" :key="edgeCase" class="flex gap-2">
                  <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--ui-border-accented)" />{{ edgeCase }}
                </li>
              </ul>
            </section>
  </div>
</template>
