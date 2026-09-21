---
entities:
  - product-model
  - product
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrOverview.vue
---

# Product overview

Where the report opens, and the Product's own page. It answers "what is this
product, and how much of it is modeled" before the reader goes looking for
anything in particular. It is headed with the name of the rail row that opens
it, qualified by the resource type it presents, and each further reading of the
Product is a child view. It lists no collection of its own: Journeys, like every
other collection, have a rail row, a page, and a count. From here the Developer
opens any of the six collections, the page of a thing that acts on the Product,
the documentation for the Product resource type, or a search of the whole model
by name.
