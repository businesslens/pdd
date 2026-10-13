import { effectScope, watch, type Ref } from 'vue'

/* Keys this page has already read from storage and is now writing back. */
const restored = new Set<string>()

/**
 * A reader's preference, kept in this browser's local storage and shared by
 * every caller on the page.
 *
 * No host renders a reader's page per request: the local viewer is a
 * client-only app and the site prerenders its pages, so a server could never
 * see the preference. A prerendered page therefore renders and hydrates with
 * `fallback`, and the stored value is applied once hydration has finished;
 * applying it sooner would hydrate against different markup. A page rendered
 * only in the browser reads it before its first paint.
 *
 * `parse` receives the stored JSON and returns `undefined` for anything it
 * does not recognize, which keeps the fallback. Storage that throws (a private
 * window, blocked site data) leaves the preference lasting as long as the page.
 */
export function usePddKitStoredPreference<T>(
  key: string,
  fallback: () => T,
  parse: (stored: unknown) => T | undefined
): Ref<T> {
  const state = useState<T>(key, fallback)
  if (import.meta.server || restored.has(key)) return state
  restored.add(key)

  const nuxtApp = useNuxtApp()
  const restore = () => {
    try {
      const raw = localStorage.getItem(key)
      const stored = raw === null ? undefined : parse(JSON.parse(raw))
      if (stored !== undefined) state.value = stored
    } catch {
      // Unreadable storage keeps the fallback.
    }
    // The page outlives whichever component asked first, and so does the write.
    effectScope(true).run(() => watch(state, (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Without storage the choice lasts as long as the page.
      }
    }, { deep: true }))
  }

  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    nuxtApp.hooks.hookOnce('app:suspense:resolve', restore)
  } else {
    restore()
  }
  return state
}
