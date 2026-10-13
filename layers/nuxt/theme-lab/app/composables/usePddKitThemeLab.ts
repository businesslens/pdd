type ThemeLabVisibility = 'shown' | 'hidden'

export function usePddKitThemeLab() {
  const preference = usePddKitStoredPreference<ThemeLabVisibility>(
    'pdd-kit:preview-bar',
    () => 'hidden',
    stored => stored === 'shown' || stored === 'hidden' ? stored : undefined
  )

  const visible = computed(() => preference.value === 'shown')

  useHead({
    htmlAttrs: {
      'data-pdd-kit-theme-lab': computed(() => visible.value ? 'shown' : 'hidden')
    }
  })

  function toggle() {
    preference.value = visible.value ? 'hidden' : 'shown'
  }

  return { visible, toggle }
}
