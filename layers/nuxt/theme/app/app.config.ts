// Stable BusinessLens-wide semantic colors for every Nuxt host surface.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brass',
      secondary: 'terracotta',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red',
      neutral: 'umber'
    },
    badge: {
      // Sand is shared by neutral labels, including those in teleported
      // readings and tooltips. Colored badges retain their semantic palettes.
      compoundVariants: [{
        color: 'neutral',
        variant: ['outline', 'soft', 'subtle'],
        class: 'businesslens-neutral-badge'
      }]
    }
  }
})
