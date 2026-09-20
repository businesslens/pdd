---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens Review to inspect changes to the Product Model
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Product presents uncommitted Product Model edits since the last commit, with other repository changes optionally included as context in the same tree
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Developer opens a changed Product Model file and inspects highlighted edits, surrounding context and the resource at either version
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Product preserves the selected comparison and location while a resource reading is opened and closed
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
---

# Review Product Model changes

## Trigger

The Developer wants to understand changes to intended product behavior.

## Outcome

Authored Product Model edits are readable against the same states; other repository changes remain path-only context. No repository data,
inspection record, approval, checkpoint or commit has been written by the report.

## Edge cases

- Changed model files appear once in the tree even when their resources have no References.
- The tree defaults to the active model; other repository changes can be included with the same search, filters and expansion controls, without file comparison actions.
- The Review header badge counts changed Product Model files in the selected comparison independently of tree filters.
- Comparing selected Git versions is explicit and retains those versions across refresh and navigation.
- Uncommitted changes include staged, unstaged and nonignored new model files; an empty result does not switch to another baseline.
- Before the first commit, authored model files appear as additions.
- Nested models restrict the review tree and its count to the active model.
- A revision with no readable model retains its file tree and contents; only its resource readings are unavailable.
- Added, deleted, binary, oversized and unreadable files are distinguished explicitly.
- Scope, gaps, configuration and formatting changes remain inspectable in their file diffs.
- A moved branch does not change a historical reading already opened at its resolved commit.
- Comparing or refreshing never establishes semantic agreement or completes an inspection.
