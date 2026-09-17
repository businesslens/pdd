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
- One tree of added, modified and deleted files, including authored `.businesslens/` files and files with no model connection
- The total number of changed files
- Before and after file contents, or an explicit reason contents are unavailable
- Model References associated with a file at each selected state
- An explanation within Model references when a selected state's model cannot be read

## Available actions

- Select and swap Git states without changing the checkout
- Search, filter and expand the repository tree
- Open a file's contents at either state
- Open a resource's complete reading at either state
- Return to the previous reading with navigation and selection preserved

## View states

### Comparison available

One tree shows all changed files between the selected states. Model files appear
once at their repository paths; selecting one opens its Markdown or JSON diff.
A file's connection to a resource does not establish that their behavior agrees.

### Model unavailable

The selected revision has no supported, structurally valid model. Its tree and
file contents remain available, including the model files themselves. The
selected location's Model references explain unavailable resource links.

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
