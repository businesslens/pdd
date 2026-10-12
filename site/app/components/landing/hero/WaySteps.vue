<script setup lang="ts">
import BlueprintPullStep from '~/components/landing/hero/BlueprintPullStep.vue'
import CommandBlock from '~/components/landing/CommandBlock.vue'

/**
 * The numbered path for one way in.
 *
 * Steps only — no heading and no link out. The overlay that shows this owns
 * both: the plate and label sit in its header so they line up with the close
 * button, and the link sits in its footer so it reads as the one thing to do
 * after reading, rather than a fourth step.
 *
 * A step's command is an offer — the reader is here to run it — so it gets the
 * site's command treatment, copy control and all. Copying it out of the overlay
 * by hand is the one thing this list exists to spare them.
 *
 * A step's ask is what the reader says to their coding agent. It is set as a
 * chat line in prose type, with no prompt glyph and no mono: a sentence dressed
 * as a shell line would tell them to type it at their terminal.
 *
 * A step naming a Blueprint is the pull, with a picker over the catalog so the
 * command copied is for the Blueprint the reader chose.
 */
defineProps<{ action: HeroAction }>()

/**
 * A slash command is typed into a coding agent, so it carries no shell prompt;
 * `npx` is run at one, so it does. The glyph is a claim about where a command
 * runs, and getting it wrong tells the reader to type a skill at their terminal.
 */
function promptFor(command: string) {
  return command.startsWith('/') ? null : '$'
}
</script>

<template>
  <ol class="grid list-none gap-4 p-0 text-left">
    <li
      v-for="(step, index) in action.steps"
      :key="step.text"
      class="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
    >
      <span
        class="mt-0.5 flex size-5 items-center justify-center rounded-full border border-primary/40 font-mono text-[10px] text-primary"
        aria-hidden="true"
      >{{ index + 1 }}</span>
      <!-- A block element, not a `span`: `CommandBlock` is a `div`, and a `div`
        inside a `span` is invalid markup the parser reshapes, which breaks
        hydration rather than merely offending a validator. -->
      <div class="min-w-0">
        <CommandBlock
          v-if="step.command"
          :command="step.command"
          :prompt="promptFor(step.command)"
          size="sm"
        />
        <BlueprintPullStep
          v-else-if="step.blueprint"
          :fallback="step.blueprint"
        />
        <p
          v-else-if="step.ask"
          class="flex items-start gap-2 rounded-lg rounded-bl-sm border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-sm"
        >
          <UIcon name="i-lucide-message-square" class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span><span class="sr-only">Ask your agent: </span>“{{ step.ask }}”</span>
        </p>
        <span
          class="block text-sm leading-relaxed text-dimmed"
          :class="step.command || step.ask || step.blueprint ? 'mt-1.5' : ''"
        >{{ step.text }}</span>
      </div>
    </li>
  </ol>
</template>
