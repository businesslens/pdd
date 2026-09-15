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

One resource’s complete reading, opened over the current working view. Opening
related resources preserves the underlying collection or comparison, its
filters, drawing, expansion and viewport. The resource and its selected reading
have their own address. Back restores the previous resource and its reading
position; Close returns to the working view. A fresh resource address opens over
its owning collection when it names no working view.

## Information presented

- The resource's title and type, stated once, above the reading
- Actual ownership, separate from the trail through previously inspected resources
- The identifying facts of that kind
- Its authored description, Intent, and any supporting sections
- Its Contexts, where the resource type carries them
- Its relations to other resources, each openable
- Its References, with the role explaining why each is attached
- For a Capability or a Journey, its Scenarios with their Steps, routes, Context places, and what each Step does to the Product's things
- For an Entity, its named facts with the Rules that govern them, and, on its Lifecycle tab, its lifecycle composed from every Step that creates, moves, or removes it, with the Capability on each arc and the Rules that restrict or forbid it
- For a Business Rule, who may perform each operation it governs, as sentences

## Available actions

- Open any related resource’s reading
- Read a Scenario, and compare its named routes side by side
- Read this resource’s incoming and outgoing connections in Overview
- Open a named view of another subject, focused on this resource, from the heading row
- Read the documentation for this resource type
- Read an Interface’s delivered Capabilities and contained resources in Overview
- Follow actual ownership through Interfaces, an Interface, an optional Experience, and a Screen
- Open an Experience’s own Screens and references to shared Screens
- Return to the previous resource reading, or close to the preserved working view
- Open a resource link in another browser tab
- Search the whole model by name

## View states

### Overview open

The resource's authored meaning, facts, relations, supporting material, and
References.

### Scenarios open

A Capability or Journey reading with one of its Scenarios selected; the selected
Scenario and route stay in the address bar.

### Lifecycle open

An Entity reading on its composed state machine: the states, the arcs the Steps
draw with the Capability on each and the Rules that restrict or forbid it, and
what leaves a thing in each state.

### One reading only

A resource with no second tab shows no tab strip: there is nothing to switch,
and the ways out sit on the heading row whichever reading is open.

## Capability boundary

One resource’s authored meaning, relations, and resource-specific readings.
Overview contains Connections and Interface delivery; an Entity reads its state
machine in Lifecycle. Every comparison across resources — how Journeys compose,
how Interfaces deliver — belongs to the owning collection, because a page
showing one resource cannot answer a question about how several compare.
The working view stays selected while any resource is inspected.
