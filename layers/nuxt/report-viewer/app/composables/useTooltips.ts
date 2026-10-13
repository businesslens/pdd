/**
 * Whether the report draws the tooltips that explain its words.
 *
 * They teach, and teaching has an end: a reader who has learned the vocabulary
 * asks for the page back, and the question marks are the only thing standing in
 * it. The vocabulary itself never leaves — the header button and its panel are
 * how the preference is undone, and how a word is looked up once the tooltips
 * are gone — so nothing here can strand a reader in a report they cannot read.
 *
 * The choice is kept in this browser's local storage. No host renders the
 * report per request: the local viewer reads it before its first paint, and a
 * prerendered page applies it as soon as hydration finishes.
 */
export function useTooltips() {
  const preference = usePddKitStoredPreference<'on' | 'off'>(
    'pdd-kit:tooltips',
    () => 'on',
    stored => stored === 'on' || stored === 'off' ? stored : undefined
  )

  /* Writable: the panel's switch and the tooltip's own exit are one state. */
  const shown = computed({
    get: () => preference.value !== 'off',
    set: (value: boolean) => { preference.value = value ? 'on' : 'off' }
  })

  return {
    shown,
    hide: () => { shown.value = false },
    restore: () => { shown.value = true }
  }
}
