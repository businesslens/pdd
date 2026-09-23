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
- The declared Scope and, when recorded, the short Method note, together with the four category counts
- Every Covered, Exclusions, Unmapped and Limitations description, each under every path it names and marked by its category's icon
- Statements with no known repository location, readable below the tree
- Every Reference in the model, including the Product's own, grouped by type with the resource that carries it
- Which schema version produced the report, and when

## Available actions

- Open Entities, Interfaces, Domains, Capabilities, Journeys, or Business Rules
- Read About, Coverage, or References
- Filter statements through the four category cards; select an active card again to show every category
- Find a recorded path by name
- Read the statements recorded at a path in place, and restore that reading after refresh or Back navigation
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

Coverage starts with one summary panel: Scope, then Method when recorded,
then four cards counting Covered, Exclusions, Unmapped and Limitations,
including statements without paths. It has no status or derived completeness
badge. Selecting a card filters the tree and unlocated statements; selecting it
again restores every category. Totals remain independent of filtering and search.

Below the panel, the tree offers path search and expand/collapse controls. Each
recorded location appears once, marked with the icon of every category recorded
at exactly that path; a closed folder says how many statements are inside it,
never file completeness or inherited meaning. Search matches paths by name,
never statement prose, and opens the folders above what it found. No live
inventory is added. Statements without paths remain readable below the tree;
empty categories show zero in the cards.

Selecting a path reads its statements in place; a statement recorded at several
paths lists its other locations. Refresh and browser history retain the read
path; expansion is remembered for the report. Narrow screens scroll the tree
within its frame.

### References open

All attached material is read by where it points: one card per reference type
counts and filters citations, repository paths appear once each in a repository
tree and external pages once each under their site and, on a code host, their
repository, side by side where there is room, and each location discloses
the resources that cite it with their roles and cited symbols or lines. A
citing resource's link opens its own References reading while preserving this
Product reading underneath. Search finds paths and links by name. Folders start
open and citations closed, and expansion is remembered across reading changes,
Back and refresh independently of resource References trees.

## Capability boundary

Product identity and model breadth. It does not present any single resource's
detail, it lists no resource collection or inventory of counts of its own, and
it carries no named view of the whole model. The rail names every collection
with its count, and a resource's connections belong to its page. Coverage states
model breadth and known gaps, and makes no claim about whether the implementation matches.
