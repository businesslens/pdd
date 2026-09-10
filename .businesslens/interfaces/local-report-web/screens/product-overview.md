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
anything in particular, and it reads like every other surface: it is headed with
the name of the rail row that opens it, qualified by the resource type it
presents, and each further reading of the Product is a peer tab. It lists no
collection of its own — Journeys, like every other collection, have a rail row, a
page, and a count.

## Information presented

- The name of the open reading and the resource type it presents, above it
- The Product's mark, name and summary, and the things that act on it
- Its description, Intent, supporting sections, category, tags, licence, authors, and known limitations
- How many resources of each kind the model authors, and the depth derived from them
- Coverage status, rationale, method, source areas, unmapped areas, and limitations
- The Product's own References, and every reference in the model with the resource that carries it
- Which generator and schema version produced the report, and when

## Available actions

- Open Entities, Interfaces, Domains, Capabilities, Journeys, or Business Rules
- Read About, Coverage or References, the Product's three readings
- Open the page of any resource that carries a reference
- Open the page of a thing that acts on the Product
- Read the documentation for the Product resource type
- Search the whole model by name

## View states

### About open

The Product itself, at full width: its mark, name and summary, who it is made
for, what it says about itself, and how many resources the model authors.

### A further reading open

Coverage or References. Nothing is hidden behind a disclosure the reader must
open to learn whether it holds anything.

## Capability boundary

Product identity and model breadth. It does not present any single resource's
detail, it lists no resource collection of its own, it carries no named view of
the whole model — the rail names every collection with its count, and a
resource's connections belong to its page — and it makes no claim about whether
the implementation matches.
