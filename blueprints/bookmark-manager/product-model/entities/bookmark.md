---
domain: library
relations:
  - entity: tag
    verb: carries
    cardinality: many-to-many
---

# Bookmark

One link the Owner kept, with what they want to remember about it.

## Information kept

- **Title** — what the bookmark is called; the page's own title unless the Owner changed it
- **Address** — the web address it opens
- **Note** — what the Owner wrote about it, if anything
- **Tags** — the tags it carries, if any
- **Collection** — the one collection it is filed in; none while it is Unsorted
- **Saved at** — when it entered the library
- **Imported from folder** — the browser folder it came from, when it arrived by import
