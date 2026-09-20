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
- The first related Domain by name on the header line, with a “+N more” button for any remaining Domains
- The identifying facts of that kind
- Its authored description, Intent, and any supporting sections
- Its Contexts, where the resource type carries them
- Its relations to other resources, each openable
- Its References, with the role explaining why each is attached
- For a Capability or a Journey, its Scenarios with their Steps, routes, Context places, and what each Step does to the Product's things
- For an Entity, its named facts with the Rules that govern them, and, on its Lifecycle tab, its lifecycle composed from every Step that creates, moves, or removes it, with the Capability on each arc and the Rules that restrict or forbid it
- For a Screen, its purpose and Information presented in Overview, with presented Entities above the information and Capability boundary last; its Available actions and expandable View states in Behavior; and its counterpart Screens in Connections
- For Interfaces and Experiences, their Structure in a tree with labelled group counts and shared Screen ownership
- For a Business Rule, who may perform each operation it governs, as sentences

## Available actions

- Open any related resource’s reading
- Reveal additional header Domains from the “more” button, then open any of their readings
- Read a Scenario, and compare its named routes side by side
- Read this resource’s complete incoming and outgoing relationships in Connections
- Read the resource's attached material in References, including each attachment's role and available image preview
- Open a Code Reference inside the slideover while preserving the resource reading
- Open a Markdown Reference as a formatted document while keeping the resource reading open
- Open a named view of another subject, focused on this resource, from the heading row
- Read an Interface or Experience’s contained resources and shared Screen references in Structure, expanding branches or opening resource names
- Follow actual ownership through Interfaces, an Interface, an optional Experience, and a Screen
- Read a Screen's actions and view states in Behavior, expanding state descriptions individually or all together
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
Connections follows Structure, Lifecycle, Scenarios or Behavior when that reading exists, otherwise
Overview. It is offered only when relationships are present. Its address and
reading position survive refresh and following a related resource then returning
with Back. Selecting Connections while reading a Scenario opens its parent's
Connections.

### Behavior open

A Screen reading with Available actions as a list, followed by expandable View
state rows. Behavior is offered when either list has content, with no empty
sections. Counts sit beside the lists rather than in Overview. State descriptions
start closed, and Expand all and Collapse all sit beside the View states heading.
Expansion is remembered per Screen across tab changes, related-resource lookups,
refresh and valid recompilation. Actions and states remain independent lists;
the reading does not infer transitions or assign actions to states.

### Structure open

An Interface's contained Experiences and Screens, or an Experience's own Screens
and shared Screen references, using the same expandable tree as the Interfaces
collection. The tree starts with the inspected resource's children. Group labels
name the counted sets: Experiences, Screens and Shared Screens. Empty groups are
omitted. Chevrons expand and collapse; resource names open complete readings.
There are no synthetic Overview children. Expand all and Collapse all use the
same controls as the collection, with expansion retained across tab changes,
related-resource lookups, refresh and valid recompilation.

A shared Screen occurs once under its owning Interface in the full hierarchy.
An Experience's Structure identifies each shared reference with “From” and a link
to that Interface. Audience remains in Overview; capability exposure and other
relationships remain in Connections. Screens have no Structure reading.

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
reading survives Back and refresh.

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
Overview contains the resource's explanation. Interfaces and Experiences read
their contained resources and available shared Screen references in Structure. Connections
contains its relationships, References contains its attached material, and an
Entity reads its state machine in Lifecycle. A Screen reads its actions and
view states in Behavior, keeping its explanation and presented information in
Overview and its counterpart Screens in Connections.
Every comparison across resources — how Journeys compose,
how Interfaces deliver — belongs to the owning collection, because a page
showing one resource cannot answer a question about how several compare.
The working view stays selected while any resource is inspected.
