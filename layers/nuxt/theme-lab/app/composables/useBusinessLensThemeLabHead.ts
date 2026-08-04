export function useBusinessLensThemeLabHead() {
  const colorMode = useColorMode()
  const { activeLight, activeDark } = useBusinessLensBackgroundVariant()
  const { activeMark } = useBusinessLensLogoVariant()

  const color = computed(() => (
    colorMode.value === 'dark' ? activeDark.value.themeColor : activeLight.value.themeColor
  ))
  const icons = computed(() => `/brand/icons/marks/${activeMark.value.id}`)

  useHead({
    meta: [
      { key: 'theme-color', name: 'theme-color', content: color }
    ],
    link: [
      { rel: 'icon', type: 'image/svg+xml', href: () => `${icons.value}/favicon.svg` },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: () => `${icons.value}/favicon-32.png` },
      { rel: 'shortcut icon', type: 'image/x-icon', href: () => `${icons.value}/favicon.ico` },
      { rel: 'apple-touch-icon', sizes: '180x180', href: () => `${icons.value}/apple-touch-icon.png` },
      { rel: 'manifest', href: () => `${icons.value}/site.webmanifest` }
    ]
  })

  return { color, icons }
}
