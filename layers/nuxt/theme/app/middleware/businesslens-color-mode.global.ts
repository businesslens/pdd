// While dark mode is off, every route forces light: a stored dark preference
// is ignored and no `dark` class reaches the document.
export default defineNuxtRouteMiddleware((to) => {
  if (!useAppConfig().businessLens.darkMode) to.meta.colorMode = 'light'
})
