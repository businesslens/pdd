---
entities:
  - product-model
  - product
  - coverage-review
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
- The declared Coverage Status, Scope and Rationale
- Every Exclusions, Unmapped, Limitations, Method, and Source areas entry, with counts and an explicit empty state when no entries are recorded
- The repository file inventory alongside Source areas, Unmapped paths, and model References, with each annotation keeping its own meaning
- The saved review’s captured inventory policy, accounting totals, known uncertainty, model changes and pending work
- Files added, modified, deleted, unreadable or outside the inventory policy since a completed review, with unknown history explicit
- Conclusions for selected files, including their model resources, approved exclusions and known gaps
- Counts of distinct annotations beneath a directory and the full descriptions and resource links for a selected location
- Unmapped entries with no known repository location, readable in their own section
- Explicit inventory loading, unavailable, failure, and empty states; recorded information remains readable in every state
- The Coverage source path alongside its rendered content
- Every Reference in the model, including the Product's own, grouped by type with the resource that carries it
- Which generator and schema version produced the report, and when

## Available actions

- Open Entities, Interfaces, Domains, Capabilities, Journeys, or Business Rules
- Read About, Coverage, or References
- Within Coverage, select the repository root, a folder or a file to read its context, and restore that selection after refresh or Back navigation
- Open model-wide scope, review information and annotations without paths from the repository root
- Filter repository files by their comparison state
- Browse or search repository paths, select a location, and return to the file tree
- Expand or collapse repository folders, refresh the file inventory, and include ignored files
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

Coverage opens into one repository tree. Its root, named for the Product,
remains available when no paths are recorded or match the active filters.
The root identifies model Status, the saved review date, model changes, pending
progress and annotations without paths, with unknown live comparison explicit.
Selecting it opens the complete Model scope: Status, Scope, Rationale,
Exclusions, Unmapped, Limitations, Method and Source areas. Repository review
in the same reading presents shared completed accounting, changes, pending
work, uncertainty and inventory policy with unavailable and failure states.
Root indicators lead directly to their related information.
Empty lists say that no entries are recorded and make no claim of completeness.
The repository inventory is current host context. Recorded Source areas and
Unmapped paths remain represented even when absent from that inventory. Their
tree starts shallow, and search or selecting a recorded path reveals its
ancestors. Every file-change and annotation indicator remains visible, with
review states and authored annotations distinguishable by label and mark.
Unmarked files carry no completeness claim.
Selecting a location narrows the annotation details to that location and its
descendants. Path details open on selection in a dismissible slideover that
leaves the file tree available in its original layout. Closing it clears the
selected path; refresh and browser history restore the open details.
Known gaps and exclusions without paths remain visible at the root and fully
readable in its slideover. A report without a local inventory retains its root,
recorded paths, saved conclusions and all authored Coverage information.

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
model breadth and repository accounting, and makes no claim about whether the implementation matches.
