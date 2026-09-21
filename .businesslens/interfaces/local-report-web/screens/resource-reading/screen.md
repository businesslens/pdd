---
entities:
  - product-model
  - product
  - interface
  - experience
  - screen
  - domain
  - entity
  - capability
  - capability-scenario
  - journey
  - journey-scenario
  - business-rule
capabilities: [view-product-model, explore-product-topology]
entryPoints:
  - local-report-web: /?s=capability&e=capability:lint-product-model
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrResourcePage.vue
---

# Resource reading

One resource's complete reading, opened over the current working view. Its
title and type are stated once above the reading, with actual ownership shown
separately from the trail through previously inspected resources, the first
related Domain on the header line and a way to reveal the rest. Opening a
related resource preserves the underlying collection or comparison, its
filters, drawing, expansion and viewport. The resource and its selected reading
have their own address, which survives refresh and valid recompilation. Back
restores the previous resource and its reading position; Close returns to the
working view. A fresh resource address opens over its owning collection when it
names no working view. A resource with a single reading shows no tab strip.
From the heading row the Developer opens a named view of another subject
focused on this resource, opens the link in another browser tab, or searches
the whole model by name. Every comparison across resources belongs to the
owning collection.
