/** Register the approved BusinessLens browser and install icon family. */
export function useBusinessLensThemeHead() {
  const icons = '/brand/icons'

  useHead({
    link: [
      { rel: 'icon', type: 'image/svg+xml', href: `${icons}/favicon.svg` },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${icons}/favicon-32.png` },
      { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: `${icons}/apple-touch-icon.png` },
      { rel: 'manifest', href: '/site.webmanifest' }
    ]
  })

  return { icons }
}
