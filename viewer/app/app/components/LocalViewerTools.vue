<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()

/*
 * The star button beside the GitHub link. The CLI stars through the reader's
 * own `gh` sign-in; without one the state is `unavailable` and only the link
 * shows. The click is the consent: nothing stars on load, and a second click
 * unstars.
 *
 * Asking `gh` takes a moment, so the report never waits for it: the question
 * goes out once the browser is idle, and the star fades in when it is answered.
 * Its slot is reserved, beside the link or below it when collapsed, so nothing
 * in the sidebar moves when it arrives.
 */
type StarState = 'starred' | 'not-starred' | 'unavailable'
const STAR_PATH = '/_businesslens/github-star'
const star = ref<StarState>('unavailable')
const toast = useToast()

async function readStar() {
  try {
    star.value = (await $fetch<{ state: StarState }>(STAR_PATH)).state
  } catch {
    star.value = 'unavailable'
  }
}

onMounted(() => {
  if ('requestIdleCallback' in window) requestIdleCallback(() => void readStar(), { timeout: 2000 })
  else setTimeout(() => void readStar(), 0)
})

// One change at a time, so a quick second click cannot race the first.
let changing = false

async function toggleStar() {
  if (star.value === 'unavailable' || changing) return
  const previous = star.value
  const starring = previous === 'not-starred'
  star.value = starring ? 'starred' : 'not-starred'
  changing = true
  try {
    await $fetch(STAR_PATH, { method: starring ? 'POST' : 'DELETE' })
  } catch {
    star.value = previous
    toast.add({
      title: starring ? 'BusinessLens was not starred' : 'BusinessLens is still starred',
      description: starring
        ? 'GitHub did not accept the star. You can star it on GitHub instead.'
        : 'GitHub did not remove the star. You can unstar it on GitHub instead.',
      color: 'error',
      icon: 'i-lucide-triangle-alert'
    })
  } finally {
    changing = false
  }
}
</script>

<template>
  <div class="grid gap-1" data-local-viewer-tools>
    <UTooltip text="Documentation" :disabled="!collapsed" :content="{ side: 'right' }">
      <UButton
        :label="collapsed ? undefined : 'Documentation'"
        :square="collapsed"
        aria-label="Documentation"
        to="https://businesslens.io/docs"
        external
        target="_blank"
        rel="noopener noreferrer"
        icon="i-lucide-book-open"
        color="neutral"
        variant="ghost"
        size="sm"
        class="min-h-9 w-full gap-2.5 text-sm font-normal text-muted hover:text-highlighted"
        :class="collapsed ? 'justify-center' : 'justify-start'"
        :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
      />
    </UTooltip>
    <div :class="collapsed ? 'grid gap-1' : 'flex items-center gap-0.5'">
      <UTooltip text="GitHub" :disabled="!collapsed" :content="{ side: 'right' }">
        <UButton
          :label="collapsed ? undefined : 'GitHub'"
          :square="collapsed"
          to="https://github.com/businesslens/pdd"
          external
          target="_blank"
          rel="noopener noreferrer"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          size="sm"
          class="min-h-9 w-full min-w-0 flex-1 gap-2.5 text-sm font-normal text-muted hover:text-highlighted"
          :class="collapsed ? 'justify-center' : 'justify-start'"
          :ui="{ leadingIcon: collapsed ? 'size-[17px]' : 'size-4' }"
          aria-label="BusinessLens on GitHub"
        />
      </UTooltip>
      <div class="h-9 shrink-0" :class="collapsed ? 'w-full' : 'w-9'" data-local-viewer-star-slot>
        <Transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-300">
          <div v-if="star !== 'unavailable'">
            <UTooltip
              :text="(star === 'starred' ? 'Unstar' : 'Star') + (collapsed ? ' on GitHub' : '')"
              :content="{ side: collapsed ? 'right' : 'top' }"
            >
              <UButton
                square
                color="neutral"
                variant="ghost"
                size="sm"
                class="h-9 w-full justify-center"
                :class="star === 'starred' ? 'text-primary' : 'text-muted hover:text-highlighted'"
                aria-label="Star BusinessLens on GitHub"
                :aria-pressed="star === 'starred'"
                data-local-viewer-star
                :data-state="star"
                @click="toggleStar"
              >
                <svg
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                  :fill="star === 'starred' ? 'currentColor' : 'none'"
                  :class="collapsed ? 'size-[17px]' : 'size-4'"
                  aria-hidden="true"
                ><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
              </UButton>
            </UTooltip>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
