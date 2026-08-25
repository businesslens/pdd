export function useBusinessLensThemeLabHead() {
  const colorMode = useColorMode()
  const { activeLight, activeDark } = useBusinessLensBackgroundVariant()

  const color = computed(() => (
    colorMode.value === 'dark' ? activeDark.value.themeColor : activeLight.value.themeColor
  ))

  useHead({
    meta: [
      { key: 'theme-color', name: 'theme-color', content: color }
    ]
  })

  return { color }
}
