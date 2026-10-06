---
entities:
  - { entity: product-model, shows: [Product, Coverage, Method] }
  - { entity: product, shows: [Identity, Catalog identity, Limitations] }
entryPoints:
  - local-report-web: /
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrOverview.vue
---

# Product overview

Where the report opens, and the Product's own page. It answers "what is this
product, and how much of it is modeled" before the reader goes looking for
anything in particular. It is headed with the name of the rail row that opens
it, qualified by the resource type it presents, and its further readings of the
Product are parts of this one Screen. It lists no collection of its own: Journeys, like every
other collection, have a rail row, a page, and a count. From here the Developer
opens any of the seven collections, the page of a thing that acts on the Product,
the documentation for the Product resource type, or a search of the whole model
by name.

## Readings

### About

The Product itself, at full width: its mark, name and summary, its full
Description, Intent, Limitations and additional authored sections under their
own headings, then its ID, category, tags, licence and authors as labelled
details, and the Actors derived from the model. When the report was generated,
or that it is live, sits with it.

### Coverage

Which of the repository's code the model accounts for, read by location: the
Scope and, when recorded, the Method note, then four cards counting Covered,
Exclusions, Unmapped and Limitations, with no status or derived completeness
badge. Selecting a card filters the tree. Each recorded path appears once in a
tree marked with the categories recorded at exactly that path; a folder never
inherits meaning from beneath it. Search matches paths, never prose, and a
path's statements read in place. A model tied to no code yet shows one
statement saying so instead.

### Product references

Every Reference in the model, including the Product's own, read by where it
points: one card per reference type counts and filters citations, repository
paths appear once each in a repository tree, and external pages once each under
their site. Each location discloses the resources that cite it, with their
roles and cited symbols or lines, and a citing resource opens its own
References reading while this one stays underneath. Search finds paths and
links by name. Folders start open and citations closed, and expansion is
remembered across readings, Back and refresh.
