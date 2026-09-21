---
entities:
  - product-model
  - product
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrOverview.vue
---

# Product overview

Where the report opens, and the Product's own page. It introduces what the
Product does, who uses it, why it exists, and the breadth of its model. About,
Coverage, and References are its three readings. Its heading names the rail row
that opens it and the resource type it presents.

## Information presented

- The name of the open reading and the resource type it presents, above it
- The Product's mark, name and summary, and the things that act on it
- The Product's full Description, Intent, Limitations, and additional authored sections under their original headings
- Product ID, Category, Tags, License, and Authors with their URLs, as labeled details
- Actors as a relation derived from the model
- The declared Model scope
- Every Covered, Exclusions, Unmapped and Limitations description, and the short Method note when recorded
- Recorded repository paths alongside exclusions, gaps and covered areas, with related context and resource links available on selection
- Covered, Exclusions and Unmapped entries with no known repository location, readable below the tree
- Every Reference in the model, including the Product's own, grouped by type with the resource that carries it
- Which generator and schema version produced the report, and when

## Available actions

- Open Entities, Interfaces, Domains, Capabilities, Journeys, or Business Rules
- Read About, Coverage, or References
- Expand or collapse How this model was authored while keeping the Coverage tree visible
- Filter sources through their summary cards; select an active card again to show all sources
- Search the Source areas tree and use its compact cards to filter Covered, Exclusions or Unmapped
- Select a recorded path to read its context, and restore that selection after refresh or Back navigation
- Open a model resource that references the selected location
- Expand Reference groups and local image previews
- Open the References reading of any resource that carries a reference
- Open the page of a thing that acts on the Product
- Read the documentation for the Product resource type
- Search the whole model by name

## View states

### About open

The Product's mark, name, Summary, Description, Intent, Limitations, and
additional authored sections are readable immediately. Product details retain
their field names and values; Actors identify a derived model relation.

### Coverage open

Coverage starts with Model scope. It has no status or derived completeness
badge. Model-wide Limitations appear near Scope. A small How this model was
authored disclosure reveals Method when recorded. Source areas contains
three compact cards counting described Covered, Exclusions and Unmapped entries,
including those without paths. Selecting a card filters the tree and unlocated
entries; selecting it again restores all sources. No duplicate category dropdown
is shown. Totals remain independent of filtering and search.

The tree offers search and expand/collapse controls. Each recorded
location appears once, with all its annotation types. Folder counts summarize
distinct entries, never file completeness or inherited meaning. Paths recorded
only by a limitation remain reachable in the unfiltered tree. No live inventory
is added. Entries without paths remain readable below the tree; empty categories
show zero in the cards. Model-wide limitations remain visible above it.

Selecting a path opens behavior descriptions, local Limitations, recorded paths
and related resources in a slideover; the Repository root includes all entries.
Closing restores focus. Method disclosure preserves the tree's search, filter
and expansion without adding browser history. Refresh and browser history retain
the selected path; expansion is remembered for the report. Narrow screens scroll
the tree within its frame.

### References open

All attached material appears once per attachment, grouped by reference type in
an expandable tree with counts, roles, links and local image previews. Each item
names its owner; a resource owner's link opens its own References reading while
preserving this Product reading underneath. Groups start open, and expansion is
remembered across reading changes, Back and refresh independently of resource
References trees.

## Capability boundary

Product identity and model breadth. It does not present any single resource's
detail, it lists no resource collection or inventory of counts of its own, and
it carries no named view of the whole model. The rail names every collection
with its count, and a resource's connections belong to its page. Coverage states
model breadth and known gaps, and makes no claim about whether the implementation matches.
