<script setup lang="ts">
import type { ContentTocLink } from '@nuxt/ui'
import { Motion } from 'motion-v'
import Answer from '~/components/landing/faq/Answer.vue'
import type { FaqContent } from '~~/shared/faq-types'

/**
 * The FAQ: open groups of collapsed questions, laid out like a docs page.
 *
 * Answers start collapsed — the one thing the five-arrangement comparison the
 * preview bar's Layout row used to run actually settled. The page is a list of
 * situations to scan for your own, not a document to read through.
 *
 * Groups are open sections divided by a rule, not boxed cards. On a phone a
 * card's border and padding cost a fifth of the reading width and nested every
 * answer table three frames deep.
 *
 * Collapsed, the questions still run several screens, so the groups get the
 * docs' own on-this-page index: the same `UContentToc` in `UPage`'s right slot.
 * Below `lg` it is the docs' sticky, collapsible bar; from `lg` it is the right
 * rail. An empty left slot keeps the docs' 2/6/2 split so the questions stay
 * centered under the title. Every question also has its own address: opening
 * one writes it to the URL, so the answer to a question someone asked is a link
 * you can send them.
 */
const { enterMotion, scrollMotion } = useLandingMotion()
const props = defineProps<{ content: FaqContent }>()
const hero = computed(() => props.content.hero)
const cta = computed(() => props.content.cta)

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Accordion values double as question addresses, so they must be unique across
// the page, not merely within a group.
const accordions = computed(() => {
  const taken = new Set<string>()
  return props.content.groups.map(group => ({
    ...group,
    items: group.questions.map((question) => {
      let value = slugify(question.label)
      if (taken.has(value)) value = `${group.id}-${value}`
      taken.add(value)
      return {
        label: question.label,
        value,
        answer: question.answer,
        comparison: question.comparison,
        boundary: question.boundary,
        stack: question.stack
      }
    })
  }))
})

// The group anchor sits on the heading, which is what `UContentToc` observes.
const sections = computed<ContentTocLink[]>(() => props.content.groups.map(group => ({
  id: group.id,
  depth: 2,
  text: group.title
})))

// Clears the site header, plus the index bar below `lg` where it sticks under it.
const anchorOffset = 'scroll-mt-[calc(var(--ui-header-height)+5rem)] lg:scroll-mt-[calc(var(--ui-header-height)+2rem)]'

const open = ref<Record<string, string[]>>({})
// Below `lg` the index is a disclosure over the page; picking a group closes it
// so the list does not cover the heading it just scrolled to.
const indexOpen = ref(false)

// Any number of questions can be open at once, and opening or closing one
// never moves the page: the reader scrolls. The most recently opened question
// is written to the URL so it can be sent as a link.
function select(groupId: string, value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value : value ? [value] : []
  const opened = next.find(question => !open.value[groupId]?.includes(question))
  const closed = open.value[groupId]?.find(question => !next.includes(question))
  open.value[groupId] = next
  const current = decodeURIComponent(location.hash.slice(1))
  const hash = opened ?? (closed === current ? '' : location.hash.slice(1))
  history.replaceState(history.state, '', `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`)
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  const group = accordions.value.find(candidate => candidate.items.some(item => item.value === id))
  if (!group) return
  open.value[group.id] = [...new Set([...(open.value[group.id] ?? []), id])]
  nextTick(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
}

// A generated page is hydrated at its bare path and the router puts the hash
// back afterwards, so a link to a question arrives after mount, as a route
// change rather than a `hashchange`.
const route = useRoute()
watch(() => route.hash, openFromHash)

onMounted(() => {
  openFromHash()
  window.addEventListener('hashchange', openFromHash)
})
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', openFromHash)
})
</script>

<template>
  <div class="landing-page overflow-x-clip bg-elevated/30">
    <section class="px-4 pt-8 pb-8 sm:px-6 sm:pt-10 lg:pb-0">
      <Motion v-bind="enterMotion(0.1)" class="mx-auto max-w-3xl text-center">
        <h1 class="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl">
          {{ hero.title }}
        </h1>
      </Motion>
    </section>

    <UContainer>
      <UPage>
        <template #left>
          <div aria-hidden="true" />
        </template>

        <div class="pt-8 pb-16">
          <div class="divide-y divide-default">
            <Motion
              v-for="group in accordions"
              :key="group.id"
              v-bind="scrollMotion()"
              as="section"
              class="py-10 first:pt-0"
            >
              <h2
                :id="group.id"
                class="text-xl font-semibold tracking-tight text-highlighted sm:text-2xl"
                :class="anchorOffset"
              >
                {{ group.title }}
              </h2>
              <p class="mt-2 text-base leading-7 text-default">
                {{ group.description }}
              </p>

              <UAccordion
                :items="group.items"
                type="multiple"
                :model-value="open[group.id] ?? []"
                class="mt-4"
                :ui="{
                  item: 'border-b border-default last:border-b-0',
                  trigger: 'py-4 text-left',
                  label: 'text-base font-medium tracking-tight text-highlighted'
                }"
                @update:model-value="select(group.id, $event)"
              >
                <template #default="{ item }">
                  <span :id="item.value" class="block" :class="anchorOffset">{{ item.label }}</span>
                </template>
                <template #content="{ item }">
                  <div class="space-y-3 pb-5">
                    <Answer
                      :paragraphs="item.answer"
                      :comparison="item.comparison"
                      :boundary="item.boundary"
                      :stack="item.stack"
                    />
                  </div>
                </template>
              </UAccordion>
            </Motion>
          </div>

          <Motion
            v-bind="scrollMotion()"
            as="section"
            class="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center sm:p-12"
          >
            <h2 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
              {{ cta.title }}
            </h2>
            <p class="mx-auto mt-4 max-w-xl text-base leading-7 text-default">
              {{ cta.description }}
            </p>
            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <UButton
                :label="cta.primary.label"
                :to="cta.primary.to"
                size="lg"
                trailing-icon="i-lucide-arrow-right"
              />
              <UButton
                :label="cta.secondary.label"
                :to="cta.secondary.to"
                size="lg"
                color="neutral"
                variant="soft"
              />
            </div>
          </Motion>
        </div>

        <template #right>
          <!-- `UContentToc`'s root is a `<nav>` beside the site's own, so it carries
            an accessible name as well as its visible title. -->
          <UContentToc
            v-model:open="indexOpen"
            :links="sections"
            highlight
            title="On this page"
            aria-label="FAQ sections"
            @move="indexOpen = false"
          />
        </template>
      </UPage>
    </UContainer>
  </div>
</template>
