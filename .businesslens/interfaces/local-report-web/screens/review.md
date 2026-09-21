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

Inspect changes to the Product Model without changing files, recording inspection,
or approving work. Review opens on uncommitted changes since the last commit;
comparing selected versions is an explicit choice. Coverage remains in Overview.

## Information presented

- Added, modified and deleted authored files within the active Product Model, with a count and change legend
- Uncommitted changes since the last commit, including staged, unstaged and new files
- The selected Base and Compare to states when comparing versions
- Rendered resource comparisons with changed fields, rows and tabs, including Product and Coverage
- Previous and current values with unchanged context, and derived effects distinguished from direct edits
- File diffs with line numbers and expandable context as a secondary reading or fallback
- Resource readings at either selected version when the model can be read
- Other repository changes optionally included as paths and change badges in the same tree
- A top-bar Review badge breaking down changed Product Model files by change type, with a compact total on narrow screens
- Explicit explanations for binary, oversized, absent or unreadable contents and unavailable resource readings

## Available actions

- Choose Compare versions and select or swap Git states without changing the checkout
- Return to uncommitted changes
- Search, filter and expand the model file tree
- Include or hide other repository changes in the same tree
- Read the header's change counts and their comparison context
- Read changes in the resource's named readings, including removed sections and scenario steps
- Show or hide the diff inside the normal resource reading, and inspect previous values in place
- Open the file diff, expand unchanged context, and choose unified or side-by-side presentation
- Open a resource's complete reading at either version, including deleted resources from the earlier version
- Return to the previous reading with navigation and selection preserved

## View states

### Changes available

Changed authored files appear once within the active model. Other repository
changes can appear in the same tree as context. Selecting a model file opens its
normal resource slideover without moving the underlying tree. Show diff reveals
changes in that reading and names the comparison baseline; Hide diff restores
the normal reading.

### Model unavailable

A version has no supported, structurally valid model. Its authored files and
changes remain readable; the selected file explains unavailable resource readings.

### No uncommitted changes

The reading states that the Product Model has no uncommitted edits. Comparing
versions remains available; the baseline does not broaden automatically.

### Before the first commit

The model's authored files appear as additions against an empty state. After a
commit, uncommitted changes use that latest commit.

### File selected

A dismissible reading highlights changes within the resource's named readings.
Deleted resources and removed sections remain inspectable from the earlier
version. File diffs remain available and open directly for configuration,
formatting-only edits or unavailable models. Historical reads never substitute
current contents. Empty-file and file-mode changes remain visible.

## Capability boundary

Reading Product Model changes at selected versions, with other repository changes
as context. Coverage declarations remain in Overview. Inspection, authoring and
implementation happen outside this read-only report.
