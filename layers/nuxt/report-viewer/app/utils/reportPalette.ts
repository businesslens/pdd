/**
 * Categorical colour for the Workbench: one fixed slot order, two selected modes.
 *
 * The slots are the validated categorical order, re-stepped for nothing — they
 * are used as published. Both modes were re-validated against the BusinessLens
 * surfaces rather than the reference ones (`#f4ecdb` light, `#1b1713` dark):
 * every gate passes, with a light-mode contrast warning on the orange, aqua,
 * yellow and magenta slots. That warning obligates relief, so **colour is never
 * the only encoding in this Workbench**: every coloured mark ships beside a label, and
 * graph nodes additionally carry a per-kind silhouette and icon.
 *
 * Nine entity kinds is past the eight-slot categorical order and past what any
 * palette can separate by hue alone. The ninth kind takes a neutral slot and the
 * shape/label encoding does the identifying work.
 */

export interface PaletteSlot {
  light: string
  dark: string
}

/** Slots 1–8 of the validated categorical order, plus a neutral ninth. */
export const CATEGORICAL_SLOTS: PaletteSlot[] = [
  { light: '#2a78d6', dark: '#3987e5' }, // 1 blue
  { light: '#eb6834', dark: '#d95926' }, // 2 orange
  { light: '#1baf7a', dark: '#199e70' }, // 3 aqua
  { light: '#eda100', dark: '#c98500' }, // 4 yellow
  { light: '#e87ba4', dark: '#d55181' }, // 5 magenta
  { light: '#008300', dark: '#008300' }, // 6 green
  { light: '#4a3aa7', dark: '#9085e9' }, // 7 violet
  { light: '#e34948', dark: '#e66767' }, // 8 red
  { light: '#746651', dark: '#ab9d81' } //  9 umber — neutral, not a hue slot
]

/** Single-hue blue ramp for magnitude. Light→dark; index 0 is nearest zero. */
export const SEQUENTIAL_STEPS = [
  '#cde2fb',
  '#b7d3f6',
  '#9ec5f4',
  '#86b6ef',
  '#6da7ec',
  '#5598e7',
  '#3987e5',
  '#2a78d6',
  '#256abf',
  '#1c5cab'
]

/**
 * Ordinal steps for discrete ordered marks. The step nearest each surface still
 * clears 2:1, so the lightest light step starts at 250 rather than 100.
 */
export const ORDINAL_STEPS = {
  light: ['#86b6ef', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab'],
  dark: ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7']
}

export function slotColor(slot: number, dark: boolean): string {
  const entry = CATEGORICAL_SLOTS[((slot % CATEGORICAL_SLOTS.length) + CATEGORICAL_SLOTS.length) % CATEGORICAL_SLOTS.length]!
  return dark ? entry.dark : entry.light
}

/**
 * Magnitude → sequential step. `value` and `maximum` are counts; zero maps to
 * the lightest step so an empty cell still reads as "measured, and it is none".
 */
export function sequentialColor(value: number, maximum: number): string {
  if (maximum <= 0) return SEQUENTIAL_STEPS[0]!
  const ratio = Math.max(0, Math.min(1, value / maximum))
  const index = Math.round(ratio * (SEQUENTIAL_STEPS.length - 1))
  return SEQUENTIAL_STEPS[index]!
}

/** CSS custom properties for a chart root, so light and dark swap in one place. */
export function paletteVariables(dark: boolean): Record<string, string> {
  return Object.fromEntries(
    CATEGORICAL_SLOTS.map((slot, index) => [`--series-${index + 1}`, dark ? slot.dark : slot.light])
  )
}
