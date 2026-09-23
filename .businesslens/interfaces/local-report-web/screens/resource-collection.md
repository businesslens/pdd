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
for, and each one also holds the named visualizations of its own subject.
Rows and Graph share the collection's filters and count. Entities, Capabilities
and Business Rules offer Matrix as a third drawing, respectively showing What
changes what, Compare delivery and Rule attachments. Each Matrix keeps all
matching subjects as rows. Shared relationship filters select the subjects and
comparison columns; without a selection, disconnected subjects remain visible. The rail lists Overview and the six collections.
Scenarios are read from the Capability or Journey that owns them
rather than listed here, because a kind with a mandatory single parent is
reached through that parent. The things that act lead the Entity collection in a
group of their own, because a reader arrives asking who this is for.

## Information presented

- The collection's name, its type mark, its definition, and how many resources it holds
- Every resource of the collection, as one row shape whatever the kind
- Interface containment as Experiences and Screens in an expandable tree, matching the Experiences & Screens and Screens tabs in their readings; shared Screens occur once under their owning Interface
- The identifying facts that distinguish resources of that kind from each other
- The authored Domain grouping, wherever the type carries one
- The filters that narrow this collection, one control per axis, over every relation its own rows print
- How many values each filter holds, and the chosen values themselves, each removable on its own
- The current view in a dropdown with preview cards and short explanatory subtitles, without a separate help button or About section
- A Graph's question beneath the drawing
- Every resource a named view includes, labelled and shaped by kind, with the things that act marked as Actors
- A named view's groups, ordered occurrences, attachments, effects, containment, or Entity relationships
- Interface map's Product root, connected containment branches, and distinct Interface, Experience, and Screen nodes
- For the view that asks what changes what, each Capability's creates, changes, and removes effects with supporting Scenarios
- Collapsed group counts and the resources available when expanded
- Which kinds a cross-collection comparison currently includes

## Available actions

- Open a resource’s reading
- Choose List, the named Graph, or the named Matrix from preview cards without changing the collection scope
- Read Domain-classified Capabilities and Entities, including unassigned resources
- Reach any Experience, Screen or Scenario through the collection that owns it
- Read which Interfaces deliver each Capability and the effects or attachments a named comparison derives
- Narrow the collection or a named view by one axis at a time, and clear one value or all of them
- Narrow a collection comparison with its shared relationship filters
- Expand or collapse a group
- Move through relationship targets while retaining readable titles
- Read the documentation for this resource type
- Search the whole model by name

## View states

### Populated collection

Resources are listed under their authored grouping, with controls for every
available filter axis. Interface and Domain trees use chevrons to expand and
collapse, while resource names open readings directly. Group counts name the set
they count; resource roots have no mixed total or synthetic Overview child.
Empty groups are omitted, and a resource without children remains a direct link.

### Named view open

The selected drawing at a readable size, with its question stated once and
every included resource reachable. Matrix rows preserve the collection scope
with one toolbar shared across drawings. Changed by, Available in and Attached to
select matching resources. Available in groups Interfaces, Experiences and Screens,
including delivery through descendants. Capabilities have no separate Screen or
Scenario filter. Their Matrix compares the containing Interfaces and matching
routes. Entities offer only Entities, Domains and Changed by, with the Capabilities
icon on Changed by. Actor access through Interfaces or Experiences and Journey
participation are read in individual resources. Attached to is one searchable picker grouped by type,
combining whole types and exact authored targets with OR; other axes combine with
AND. Context restrictions on another attachment and inherited reach do not match.

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
