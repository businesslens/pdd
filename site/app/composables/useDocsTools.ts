// The site tools can coexist with a Blueprint's embedded report. Their panel
// must not open the report's own Vocabulary dialog at the same time.
const DOCS_VOCABULARY_STATE = 'landing-docs-vocabulary'

export function useDocsTools() {
  const route = useRoute()
  const isDocsPath = computed(() => route.path === '/docs' || route.path.startsWith('/docs/'))
  const isReportPath = computed(() => /^\/blueprints\/[^/]+\/?$/.test(route.path))
  // An embedded report keeps its established model-search shortcut.
  const searchKeys = computed(() => isReportPath.value
    ? ['meta', 'shift', 'k']
    : ['meta', 'k'])
  const searchShortcut = computed(() => searchKeys.value.join('_'))
  const vocabulary = useVocabularyPanel(DOCS_VOCABULARY_STATE)

  return { isDocsPath, isReportPath, searchKeys, searchShortcut, vocabulary, vocabularyStateKey: DOCS_VOCABULARY_STATE }
}
