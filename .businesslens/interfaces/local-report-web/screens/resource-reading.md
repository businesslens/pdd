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
- Read this resource’s complete incoming and outgoing relationships in Connections
- Read the resource's attached material in References, including each attachment's role and available image preview
- Open a Code Reference inside the slideover while preserving the resource reading
- Open a Markdown Reference as a formatted document while keeping the resource reading open
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

The resource's authored meaning, facts, and supporting material.
Contextual links stay beside the facts they explain, including the Domain and
Rules governing individual facts.

### Connections open

The resource's complete relationship list, grouped by direction and relationship.
Relationships remain available here when their targets also appear in Overview.
Connections follows Lifecycle or Scenarios when that reading exists, otherwise
Overview. It is offered only when relationships are present. Its address and
reading position survive refresh and following a related resource then returning
with Back. Selecting Connections while reading a Scenario opens its parent's
Connections.

### References open

The inspected resource's attached documents, designs, code references and images,
grouped by reference type in an expandable tree with counts. Groups start open;
each attachment keeps its role, and local images expand into an inline preview.
Local References lead with their file path, with any distinct authored title
alongside it as context. External References keep their descriptive title and URL.
Local References replace the slideover reading while preserving the resource's
selected tab, expansion and scroll. Back restores that reading or the previously
opened document; Close returns to the working view. Refresh and browser
Back/Forward retain the opened file. External links show an external-link icon
and open in a new tab.
Code References open the local source file inside the slideover with line
numbers and syntax colors that follow the report theme. A line locator highlights that range; a symbol locator highlights its
first text match, with a visible explanation when no match is found. Only code
targets attached to the current model can be opened this way.
Markdown References open inside the slideover with formatted headings,
tables, lists and syntax-colored code blocks. Document metadata is collapsed separately from
the body, and View source shows the original file. Relative document links and
images resolve within the repository, and linked Markdown keeps the same preview.
Expansion is remembered for this resource when changing readings, returning with
Back or refreshing. References is the last reading and names its count;
it is offered only when attachments exist. A Scenario's References belongs to
that Scenario, while its behavioral reading stays inside its parent. The selected
reading survives Back and refresh. Documentation explaining the resource type
remains available from the heading.

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
Overview contains the resource's explanation and Interface delivery; Connections
contains its relationships, References contains its attached material, and an
Entity reads its state machine in Lifecycle.
Every comparison across resources — how Journeys compose,
how Interfaces deliver — belongs to the owning collection, because a page
showing one resource cannot answer a question about how several compare.
The working view stays selected while any resource is inspected.
