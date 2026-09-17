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
for. Each collection has one filtered set, drawn as Rows or Graph with the same
heading count, filters and selected values. Compare delivery, What changes what,
and Rule attachments are separate readings reached from the rail. Scenarios are
reached through their Capability or Journey; Experiences and Screens through
Interfaces. The things that act lead the Entity collection in a group of their
own.

## Information presented

- The collection's name, its type mark, its definition, and how many resources it holds
- Every resource of the filtered collection, drawn as Rows or Graph
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
- Which kinds a cross-collection comparison currently includes

## Available actions

- Open a resource's reading
- Switch a collection between Rows and Graph without changing the selected set
- Open Compare delivery, What changes what, or Rule attachments from the rail
- Choose how many columns the Rows drawing uses, remembered separately for each collection
- Read Domain-classified Capabilities and Entities, including unassigned resources
- Reach any Experience, Screen or Scenario through the collection that owns it
- Read which Interfaces deliver each Capability and the effects or attachments a named comparison derives
- Narrow the collection or a named view by one axis at a time, and clear one value or all of them
- Narrow a cross-collection comparison to resource types and focus one resource's neighbourhood where the reading supports it
- Expand or collapse a group
- Move through relationship targets while retaining readable titles
- Read the documentation for this resource type
- Search the whole model by name

## View states

### Populated collection

Resources are drawn under their authored grouping. A filter control appears for
each relevant axis that has values, with the same controls in Rows and Graph.

### Named view open

The selected Graph or rail reading explains its derivation and keeps every included
resource reachable.

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
and Business Rules, and reading modeled correlations through collection Graphs
and the three named cross-collection comparisons. Experiences and Screens are reached
through Interfaces; Scenarios through their Capability or Journey. It offers no
view builder, opens onto no empty configuration screen, invents no relation the
model does not author, and never edits the model.
