---
entities:
  - { entity: product-model, facts: [Product] }
  - { entity: product, facts: [Identity] }
  - { entity: interface, facts: [Type, Actors] }
  - { entity: experience, facts: [Container, Audience] }
  - { entity: screen, facts: [Exposure, Nesting] }
  - { entity: domain, facts: [Region] }
  - { entity: entity, facts: [Kept information, Acts, Kind, States] }
  - { entity: capability, facts: [Purpose, Availability, Domain] }
  - { entity: capability-scenario, facts: [Classification] }
  - { entity: journey, facts: [Goal, Actors] }
  - { entity: journey-scenario, facts: [Result, Classification] }
  - { entity: business-rule, facts: [Assertion, Reach] }
capabilities: [view-product-model, explore-product-topology]
entryPoints:
  - local-report-web: /?s=capability
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrReportShell.vue
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrProductTopology.vue
---

# Resource collection

One of the six main resource collections, named with its type mark, its
definition and how many resources it holds. Every resource of the collection is
one row, grouped by its authored Domain wherever the type carries one, with the
things that act leading the Entity collection because a reader arrives asking
who this is for. Interfaces list their Experiences and Screens as an expandable
tree in which a shared Screen occurs once under its owning Interface. Rows,
Graph and, for Entities, Capabilities and Business Rules, Matrix draw the same
set: the filters, one per axis over what the rows already print, and the count
stay the same whichever drawing is chosen, and each Graph states the one
question it answers. The Developer opens any resource's reading, narrows the
collection one axis at a time and clears one value or all of them, hides a kind
or focuses one resource and its neighbourhood, expands or collapses a group,
reads the documentation for the resource type, and searches the whole model by
name. Scenarios are read from the Capability or Journey that owns them rather
than listed here. An empty collection offers no control for narrowing it.
