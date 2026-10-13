/**
 * Keeps the reader's display preferences across `pdd-kit view` runs.
 *
 * The report keeps them in local storage, which the browser keys by port, and
 * each run listens on a new one. The CLI keeps them in a file instead: they are
 * copied into this origin's storage before the report reads them, and every
 * change is sent back. Without the file, the report still works and simply
 * remembers them for this port.
 */
const PREFERENCES_PATH = '/_pdd-kit/preferences'

export default defineNuxtPlugin({
  name: 'pdd-kit-preferences',
  async setup() {
    try {
      const stored = await $fetch<Record<string, unknown>>(PREFERENCES_PATH)
      for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // No file, or no storage: the report falls back to its defaults.
    }
    onPddKitPreferenceChange((key, value) => {
      $fetch(PREFERENCES_PATH, { method: 'PUT', body: { [key]: value } }).catch(() => {
        // Not saved for the next run; this one still has it.
      })
    })
  }
})
