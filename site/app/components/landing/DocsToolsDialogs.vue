<script setup lang="ts">
const route = useRoute()
const { vocabulary, vocabularyStateKey, searchShortcut, isReportPath } = useDocsTools()
const vocabularyContext = computed(() => vocabularyPageContext(route.path.replace(/^\/docs\/?/, '')))
watch(() => route.fullPath, () => { vocabulary.open.value = false })

const { navigation } = await useDocsNavigation()
const { data: searchFiles } = useLazyAsyncData('docs-search', () =>
  queryCollectionSearchSections('docs'), { server: false })
</script>

<template>
  <!-- The header's tool buttons are server-rendered; this component is client-only
    and lazy, so on a heavy page the buttons exist before the dialogs they open.
    A marker lets a test wait for the tools instead of guessing. -->
  <span hidden data-docs-tools-ready />
  <BlrVocabulary
    :context="vocabularyContext"
    docs-base="/docs"
    :state-key="vocabularyStateKey"
    :tooltips="isReportPath"
  />
  <!-- Nuxt UI binds the shortcut at setup; remount when its scope changes. -->
  <LazyUContentSearch
    :key="searchShortcut"
    :files="searchFiles ?? []"
    :navigation="navigation"
    :shortcut="searchShortcut"
  />
</template>
