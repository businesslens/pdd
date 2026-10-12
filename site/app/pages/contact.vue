<script setup lang="ts">
import { Motion } from 'motion-v'

const { enterMotion, staggerMotion } = useLandingMotion()

useSiteSeo({
  title: 'Contact · pdd-kit',
  description: 'Talk with the pdd-kit team about mapping a repository, contributing to PDD, or bringing shared product intelligence into your organization.'
})

const channels = [
  {
    icon: 'i-lucide-mail',
    title: 'Email us',
    description: 'Questions about the emerging standard, the open framework, the Blueprint catalog, or anything else — we read every message.',
    to: 'mailto:itai.gendler@gmail.com',
    linkLabel: 'itai.gendler@gmail.com'
  },
  {
    icon: 'i-simple-icons-github',
    title: 'Report an issue',
    description: 'Found a bug, a missing product concept, or an unclear workflow? Open it on the public repository.',
    to: 'https://github.com/itai-gendler/pdd-kit/issues',
    target: '_blank',
    linkLabel: 'github.com/itai-gendler/pdd-kit'
  },
  {
    icon: 'i-lucide-library-big',
    title: 'Start from a Blueprint',
    description: 'Pull a curated Product Model with one command and hand it to your coding agent. No account needed.',
    to: '/blueprints',
    linkLabel: 'Browse Blueprints'
  }
]
</script>

<template>
  <div class="landing-page overflow-hidden">
    <UPageHero
      class="landing-hero relative"
      :ui="{
        container: 'relative z-10 py-8 sm:py-10 lg:py-10',
        wrapper: 'flex flex-col items-center',
        title: 'max-w-3xl text-balance text-4xl sm:text-5xl tracking-[-0.045em] leading-[1.05] text-primary',
        description: 'mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-default'
      }"
    >
      <template #title>
        <Motion
          as="span"
          v-bind="enterMotion(0.2)"
          class="inline-block"
        >
          Contact
        </Motion>
      </template>

      <template #description>
        <Motion
          as="span"
          v-bind="enterMotion(0.35)"
          class="inline-block"
        >
          Whether you maintain an open-source project, build your own product, or work inside a larger engineering organization, we want to understand how product knowledge moves through your work.
        </Motion>
      </template>
    </UPageHero>

    <UPageSection :ui="{ container: 'max-w-5xl pt-4 pb-8 sm:pt-5 sm:pb-10 lg:pt-6 lg:pb-12' }">
      <UPageGrid class="lg:grid-cols-3">
        <Motion
          v-for="(channel, index) in channels"
          :key="channel.title"
          v-bind="staggerMotion(index)"
        >
          <UPageCard
            :icon="channel.icon"
            :title="channel.title"
            :description="channel.description"
            :to="channel.to"
            :target="channel.target"
            variant="subtle"
            class="h-full"
            :ui="{
              title: 'text-base tracking-tight',
              description: 'text-sm leading-relaxed text-dimmed'
            }"
          >
            <template #footer>
              <span class="text-sm font-medium text-primary">{{ channel.linkLabel }}</span>
            </template>
          </UPageCard>
        </Motion>
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      variant="naked"
      title="Prefer to start with a repository?"
      description="The getting-started docs turn one codebase into a reviewable Product Model. No account or hosted service is required."
      :links="[
        { label: 'Read the docs', to: '/docs', trailingIcon: 'i-lucide-arrow-right', size: 'lg' },
        { label: 'Browse Blueprints', to: '/blueprints', color: 'neutral', variant: 'soft', size: 'lg' }
      ]"
      :ui="{
        root: 'relative',
        container: 'max-w-3xl text-center py-16 sm:py-20 lg:py-20',
        title: 'tracking-tight',
        description: 'mx-auto max-w-xl leading-relaxed text-dimmed'
      }"
    />
  </div>
</template>
