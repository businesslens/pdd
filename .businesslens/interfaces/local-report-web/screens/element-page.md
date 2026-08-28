---
entities:
  - product-model
  - element
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /?s=capability&e=capability:lint-product-model
---

# Element page

One entity, at the width its content was drawn for. This is the reading: it has
its own address, a breadcrumb back to its collection, and the browser's own back
button.

## Information presented

- The entity's title, kind, and the identifying facts of that kind
- Its authored description, Intent, and any supporting sections
- Its Contexts, where the entity kind carries them
- Its relations to other entities, each openable
- Its References, with the role explaining why each is attached
- For a Capability or a Journey, its Scenarios with their Steps, routes, and Context places

## Available actions

- Open any related entity's page
- Read a Scenario, and compare its named routes side by side
- Open this entity's neighbourhood in the Product Topology
- Return to the collection through the breadcrumb
- Search the whole model by name

## View states

### Overview open

The entity's authored meaning, facts, relations, supporting material, and
References.

### Scenarios open

A Capability or Journey page with one of its Scenarios selected; the selected
Scenario and route stay in the address bar.

## Capability boundary

One entity's authored meaning and its relations. It never edits the entity, and
it does not draw the graph — a neighbourhood is an action into the Topology, not
a second reading here.
