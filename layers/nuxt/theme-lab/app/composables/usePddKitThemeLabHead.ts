export function usePddKitThemeLabHead() {
  const colorMode = useColorMode()
  const { activeLight, activeDark } = usePddKitBackgroundVariant()

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
