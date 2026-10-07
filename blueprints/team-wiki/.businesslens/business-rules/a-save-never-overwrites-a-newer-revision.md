---
appliesTo:
  - type: capability
    id: edit-page
  - type: capability
    id: restore-revision
  - type: capability
    id: accept-suggestion
---

# A save never overwrites a newer revision unseen

When a page gained a revision after the Editor began their change — another
Editor's save while they edited the page or read the revision they restore, or
an edit made after an AI agent left a suggestion — the Product shows the newer
revision and lets the Editor reconcile, or confirm again, before anything is
saved.

## Rationale

Without live co-editing, the second save is where work gets lost; showing the
newer revision first keeps both people's work.
