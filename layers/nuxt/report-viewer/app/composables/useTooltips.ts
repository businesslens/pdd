/**
 * Whether the report draws the tooltips that explain its words.
 *
 * They teach, and teaching has an end: a reader who has learned the vocabulary
 * asks for the page back, and the question marks are the only thing standing in
 * it. The vocabulary itself never leaves — the header button and its panel are
 * how the preference is undone, and how a word is looked up once the tooltips
 * are gone — so nothing here can strand a reader in a report they cannot read.
 *
 * A cookie rather than local storage, because a host may render the report on
 * the server. The answer has to be known before the first paint, or a reader
 * who turned the tooltips off is shown them again on every page load and
 * watches them disappear.
 */
export function useTooltips() {
  const preference = useCookie<'on' | 'off'>('blr-tooltips', {
    default: () => 'on',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })

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
