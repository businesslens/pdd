import {
  PDD_KIT_DARK_BACKGROUNDS,
  PDD_KIT_DEFAULT_DARK_BACKGROUND,
  PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
  PDD_KIT_LIGHT_BACKGROUNDS,
  findPddKitBackground
} from '../utils/pddKitThemeLabVariants'

const asId = (stored: unknown) => typeof stored === 'string' ? stored : undefined

export function usePddKitBackgroundVariant() {
  const lightChoice = usePddKitStoredPreference<string>('pdd-kit:bg-light', () => PDD_KIT_DEFAULT_LIGHT_BACKGROUND, asId)
  const darkChoice = usePddKitStoredPreference<string>('pdd-kit:bg-dark', () => PDD_KIT_DEFAULT_DARK_BACKGROUND, asId)

  const activeLight = computed(() => findPddKitBackground(
    PDD_KIT_LIGHT_BACKGROUNDS,
    lightChoice.value,
    PDD_KIT_DEFAULT_LIGHT_BACKGROUND
  ))
  const activeDark = computed(() => findPddKitBackground(
    PDD_KIT_DARK_BACKGROUNDS,
    darkChoice.value,
    PDD_KIT_DEFAULT_DARK_BACKGROUND
  ))

  useHead({
    htmlAttrs: {
      'data-bg-light': computed(() => activeLight.value.id),
      'data-bg-dark': computed(() => activeDark.value.id)
    }
  })

  function selectLight(id: string) {
    lightChoice.value = findPddKitBackground(
      PDD_KIT_LIGHT_BACKGROUNDS,
      id,
      PDD_KIT_DEFAULT_LIGHT_BACKGROUND
    ).id
  }

  function selectDark(id: string) {
    darkChoice.value = findPddKitBackground(
      PDD_KIT_DARK_BACKGROUNDS,
      id,
      PDD_KIT_DEFAULT_DARK_BACKGROUND
    ).id
  }

  return {
    lightBackgrounds: PDD_KIT_LIGHT_BACKGROUNDS,
    darkBackgrounds: PDD_KIT_DARK_BACKGROUNDS,
    activeLight,
    activeDark,
    selectLight,
    selectDark
  }
}
