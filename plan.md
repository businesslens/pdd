# BusinessLens workflow redesign

Status: implemented on 2026-08-02.

## Outcome

BusinessLens has three public skills with distinct jobs:

- `businesslens-map` creates or expands a Product Model from an existing repository.
- `businesslens-ideate` decides what the product should become and writes only approved meaning.
- `businesslens-verify` checks the requested scope and owns the resolution loop until it is aligned or explicitly blocked.

The CLI command for structural model checks is `businesslens lint`. It does not
claim that the implementation and model agree. `businesslens validate` is
refused with a message naming `lint`; it is not retained as an alias.

`businesslens-init`, `businesslens-sync`, `businesslens-doctor`,
`businesslens-deep-dive`, and `businesslens-contribute` are retired. Catalog
contribution remains available through `businesslens blueprint contribute`.

## Authority and flow

Approved product intent is written into the Product Model before implementation.
An external build flow, supplied by the user's harness rather than BusinessLens,
then implements it. Verification follows:

```text
ideate -> injected build -> verify (including final lint) -> merge
```

`verify` is the single user invocation for reconciliation. It narrows its work
with Git when useful, but Git never decides which side is authoritative. It
inspects the model and code, groups gaps by the decision they need, and routes
automatically:

- Model is right: send an explicit acceptance packet to the injected builder,
  then verify again.
- Code is right: run an internal, narrow ideation-resolution phase, ask for
  approval of the exact model delta, write it, then verify again.
- Neither is right: resolve intended behavior first, update the model with
  approval, send the resulting contract to the builder, then verify again.
- Existing behavior is outside an absent or deliberately untrusted model area:
  run an internal scoped-mapping phase, ask for approval, write it, then verify
  again.
- The gap cannot be verified safely: stop with an explicit blocker and the
  inspected evidence.

Verification is semantically read-only: it never changes product meaning or
implementation itself. Its internal resolution phases may update approved model
meaning; the injected builder may update implementation under its own normal,
user-approved permissions. After every mutation, verification re-derives its
findings. If the same gap returns unchanged after a build attempt, it stops
instead of looping.

`/businesslens-verify report only` disables all writes and delegation.

## Map versus verify

`map` is not daily maintenance. Use it when adopting BusinessLens in an existing
repository, when a named area is absent or deliberately untrusted, or when
expanding known model coverage. Use `verify` after product changes, refactors,
suspected drift, before release, or for a named/full current-state audit.

`verify this branch` uses the branch diff only to choose a worklist.
`verify current`, `verify full`, or a named scope checks the present repository
without requiring a diff.

## Product Model contract

- `codeRefs` are optional navigational bookmarks, not proof or lifecycle state.
- Missing `codeRefs` never makes a model invalid.
- Present `codeRefs` must retain valid grammar and point at tracked paths.
- `coverage.status` describes model breadth only:
  - `draft`: the model itself is still being authored or reviewed.
  - `partial`: useful model with known unmapped areas.
  - `complete`: the intended product scope is modeled.
- A complete model may have zero `codeRefs`.
- `coverage.mapped` remains wire-compatible and counts bookmark-bearing
  entities; it is not semantic proof.
- Blueprint redaction removes source bookmarks without downgrading model
  completeness.
- No folder-schema bump is required because the serialized shapes remain
  compatible and the rule is relaxed.

Every model creation path writes the canonical `.businesslens/README.md`.
BusinessLens never writes target-root `AGENTS.md`, `CLAUDE.md`, or README files.
This repository's own `AGENTS.md` is updated because it is maintainer guidance,
not a runtime target write.

## Implementation phases

1. Update `spec/format.md` and ADRs before parser/linter behavior.
2. Rename CLI and internals from validate to lint; remove branch-state output and
   refuse the old command.
3. Replace the bundled and installed skills with map, ideate, and verify. Keep
   each self-contained and use isolated, version-pinned CLI runners.
4. Define the injected build handoff: expected behavior, affected entities and
   rules, observed gap, acceptance criteria, inspected file leads, prohibition
   on editing `.businesslens/`, and a return to verification.
5. Migrate installer cleanup, plugin metadata, help text, model orientation, and
   package surfaces.
6. Rewrite the repository docs around the three starting doors and one ongoing
   loop. Remove retired skill pages and rename the CLI page to lint.
7. Update the landing-page messaging in its supplied worktree without disturbing
   unrelated in-progress design work.
8. Add tests for lint semantics, migration safety, the three-skill installation,
   isolated runners, orientation writes, and the verification scenario matrix.
9. Run `npm run verify`, validate all three skills with `quick_validate.py`, run
   strict Claude plugin validation when available, inspect `npm pack --dry-run`,
   and review both worktree diffs. Do not publish, tag, or push.

## Verification scenarios

The implementation and documentation must cover:

1. Planned behavior is aligned.
2. The model is right and the builder must fix code.
3. The code is right and an approved model delta is needed.
4. Neither side is right.
5. Established behavior is not mapped.
6. A refactor changes bookmarks but not behavior.
7. A full current-state audit has no Git diff.
8. Report-only mode.
9. An unverifiable gap.
10. The same gap returns unchanged after a build attempt.
11. No injected builder is available.
12. Target `AGENTS.md`, `CLAUDE.md`, and root README remain byte-identical.

## Explicitly out of scope

- Persisted verification receipts or ledgers.
- Hosted semantic verification.
- A BusinessLens-owned implementation skill.
- Target-root instruction-file writes.
- A semantic CI gate.
- Publishing, tagging, pushing, or releasing.
