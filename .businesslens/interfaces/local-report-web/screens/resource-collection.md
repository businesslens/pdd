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

The six main resource collections let the reader find the resource they came
for, and each one also holds the named visualizations of its own subject. A tab
changes which set is on screen; there is no second control changing how that set
is drawn, because a relationship graph and a list were never the same rows drawn
differently. Scenarios are read from the Capability or Journey that owns them
rather than listed here, because a kind with a mandatory single parent is
reached through that parent. The things that act lead the Entity collection in a
group of their own, because a reader arrives asking who this is for.

## Information presented

- The collection's name, its type mark, its definition, and how many resources it holds
- Every resource of the collection, as one row shape whatever the kind
- What an Interface contains, on its row, alongside the Actors who enter it
- The identifying facts that distinguish resources of that kind from each other
- The authored Domain grouping, wherever the type carries one
- The filters that narrow this collection, one control per axis, over every relation its own rows print
- How many values each filter holds, and the chosen values themselves, each removable on its own
- The open view's question and the note explaining how it derives its answer, beneath the reading
- Every resource a named view includes, labelled and shaped by kind, with the things that act marked as Actors
- A named view's groups, ordered occurrences, attachments, effects, containment, or Entity relationships
- Interface map's Product root, connected containment branches, and distinct Interface, Experience, and Screen nodes
- For the view that asks what changes what, each Capability's creates, changes, and removes effects with supporting Scenarios
- Collapsed group counts and the resources available when expanded
- Which kinds a named view currently hides or filters

## Available actions

- Open a resource's page
- Open a named view of this collection as a tab beside its List
- Read Domain-classified Capabilities and Entities, including unassigned resources
- Reach any Experience, Screen or Scenario through the collection that owns it
- Compare delivery across Interfaces, and compose every Journey's Scenarios side by side
- Narrow the collection or a named view by one axis at a time, and clear one value or all of them
- Choose which resource types a named view draws, and focus one resource in it
- Hide a kind, or focus one resource and read only its neighbourhood
- Expand or collapse a group
- Move through relationship targets while retaining readable titles
- Read the documentation for this resource type
- Search the whole model by name

## View states

### Populated collection

Resources are listed under their authored grouping and, where the collection is
large enough to need them, filter controls.

### Named view open

The tab's reading at a readable size, with its question stated once above it and
every included resource reachable.

### Collapsed groups

Larger groups show their counts and an explicit expansion action. The Developer's
expansion choices remain in place when they return to the reading.

### Focused neighbourhood

One resource and the relations reaching it, so a dense view stays readable.

### Empty collection

The collection holds nothing, and no control is offered for narrowing a list
that has nothing in it.

## Capability boundary

Finding resources through Entities, Interfaces, Domains, Capabilities, Journeys,
and Business Rules, and reading the correlations the model already declares
through the views each collection names. Experiences and Screens are reached
through Interfaces; Scenarios through their Capability or Journey. It offers no
view builder, opens onto no empty configuration screen, invents no relation the
model does not author, and never edits the model.
