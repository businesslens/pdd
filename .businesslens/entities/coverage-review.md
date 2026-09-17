---
domain: model-inspection
references:
  - kind: spec
    role: intent
    target: spec/coverage.md
  - kind: doc
    role: context
    target: docs/cli-coverage.md
---

# Coverage review

An account of the exact files considered while inspecting repository coverage
for a Product Model. It keeps the captured worklist, conclusions and the model
to which completion applies. The latest completed review is saved in the
Coverage document and shared through Git. Each model and worktree can also
retain one local pending review. A fresh clone can read the committed review;
Blueprints omit repository inspection history.

## Information kept

- **Identity** — which captured review subsequent recording, completion and cancellation address
- **Inventory policy** — which repository files are inspection inputs, including explicitly included ignored paths
- **Captured files** — exact repository-relative paths and content identities, with unreadable inputs retained explicitly
- **Conclusions** — the files reviewed, excluded or uncertain, their explanations, model resources, approved exclusions and known gaps
- **Model identity** — the final Product Model contents against which completion was recorded
- **Timing** — when the worklist was captured and when accounting was completed

## States

### Pending

A worktree-local captured worklist whose conclusions may still be recorded. It does not replace
a previously completed review.

### Completed

Every captured file has a conclusion and the source inputs matched at completion.
The completed review is shared with the model. It identifies that historical state; later changes do not rewrite it
or establish whether its conclusions remain correct.
