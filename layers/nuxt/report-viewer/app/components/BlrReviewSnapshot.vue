<script setup lang="ts">
import type { ComparisonSide } from '../utils/resourceComparison'
import { resourceReviewKey } from '../utils/resourceReview'
import { referenceStateKey } from '../utils/referenceNavigation'
import { resourceNavigationKey } from '../utils/resourceNavigation'
const props = defineProps<{ side?: ComparisonSide | null }>()
const review = inject(resourceReviewKey, computed(() => null))
provide(resourceReviewKey, computed(() => props.side ? null : review.value))
const state = inject(referenceStateKey, computed(() => 'working'))
provide(referenceStateKey, computed(() => props.side?.state ?? state.value))
const navigation = inject(resourceNavigationKey, null)
if (navigation) provide(resourceNavigationKey, { ...navigation, href: (key, tab) => navigation.href(key, tab, props.side?.state ?? state.value) })
</script>
<template><slot /></template>
