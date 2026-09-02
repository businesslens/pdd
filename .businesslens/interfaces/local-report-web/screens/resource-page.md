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
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /?s=capability&e=capability:lint-product-model
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrResourcePage.vue
---

# Resource page

One resource, at the width its content was drawn for. This is the reading: it has
its own address, a breadcrumb back to its collection, and the browser's own back
button.

## Information presented

- The resource's title, kind, and the identifying facts of that kind
- Its authored description, Intent, and any supporting sections
- Its Contexts, where the resource type carries them
- Its relations to other resources, each openable
- Its References, with the role explaining why each is attached
- For a Capability or a Journey, its Scenarios with their Steps, routes, Context places, and what each Step does to the Product's things
- For an Entity, its named facts with the Rules that govern them, and its lifecycle composed from every Step that creates, moves, or removes it, with the Capability on each arc and the Rules that restrict or forbid it
- For a Business Rule, who may perform each operation it governs, as sentences

## Available actions

- Open any related resource's page
- Read a Scenario, and compare its named routes side by side
- Open this resource's neighbourhood in the Product Topology
- Return to the collection through the breadcrumb
- Search the whole model by name

## View states

### Overview open

The resource's authored meaning, facts, relations, supporting material, and
References.

### Scenarios open

A Capability or Journey page with one of its Scenarios selected; the selected
Scenario and route stay in the address bar.

## Capability boundary

One resource's authored meaning and its relations. It never edits the resource, and
it does not draw the graph — a neighbourhood is an action into the Topology, not
a second reading here.
