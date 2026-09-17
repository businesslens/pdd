---
entities: [product-model]
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /?s=review
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrChanges.vue
  - kind: spec
    role: intent
    target: spec/report.md
---

# Review

Read changes to the Product Model and repository between two selected Git states.
The Developer can inspect either side without changing files, recording inspection,
or approving the work. Coverage remains a separate reading of the current Product
in Overview.

## Information presented

- The selected Base and Compare to states, including the working state
- Added, removed and changed model resources with their changed fields
- Repository file changes, including files with no model connection
- Before and after file contents, or an explicit reason contents are unavailable
- Model References associated with a file at each selected state
- A separate explanation when a model cannot be read while repository changes remain available

## Available actions

- Select and swap Git states without changing the checkout
- Search, filter and expand the repository tree
- Open a file's contents at either state
- Open a resource's complete reading at either state
- Return to the previous reading with navigation and selection preserved

## View states

### Comparison available

Model and repository changes refer to the same selected states. Each set can be
empty independently. A file's connection to a resource does not establish that
their behavior agrees.

### Model unavailable

The selected revision has no supported, structurally valid model. Its repository
comparison remains available and the missing model has an explicit explanation.

### No saved state

No Git baseline is available. The reading explains that a commit is needed to
compare saved and working states.

### File selected

The tree remains in place while a dismissible panel shows that file's before and
after contents and model References. Deleted files remain inspectable. Historical
reads never substitute current contents.

## Capability boundary

Reading model and repository changes at selected states. Coverage declarations
remain in Overview. Inspection, authoring and implementation happen outside this
read-only report.
