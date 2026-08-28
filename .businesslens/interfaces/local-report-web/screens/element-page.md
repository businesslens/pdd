---
entities:
  - product-model
  - product
  - actor
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
    target: layers/nuxt/report-viewer/app/components/BlrElementPage.vue
---

# Element page

One element, at the width its content was drawn for. This is the reading: it has
its own address, a breadcrumb back to its collection, and the browser's own back
button.

## Information presented

- The element's title, kind, and the identifying facts of that kind
- Its authored description, Intent, and any supporting sections
- Its Contexts, where the element kind carries them
- Its relations to other elements, each openable
- Its References, with the role explaining why each is attached
- For a Capability or a Journey, its Scenarios with their Steps, routes, and Context places

## Available actions

- Open any related element's page
- Read a Scenario, and compare its named routes side by side
- Open this element's neighbourhood in the Product Topology
- Return to the collection through the breadcrumb
- Search the whole model by name

## View states

### Overview open

The element's authored meaning, facts, relations, supporting material, and
References.

### Scenarios open

A Capability or Journey page with one of its Scenarios selected; the selected
Scenario and route stay in the address bar.

## Capability boundary

One element's authored meaning and its relations. It never edits the element, and
it does not draw the graph — a neighbourhood is an action into the Topology, not
a second reading here.
