---
status: accepted
---

# Verification findings are re-derived, not persisted

## Context

A tracked verification ledger was considered as a way to distinguish verified,
stale, and contradicted claims. It would introduce another lifecycle artifact,
create merge conflicts, and imply durable certainty after the surrounding code,
runtime assumptions, or inspection method changed.

The first version needs a trustworthy resolution loop more than it needs a
historical receipt system.

## Decision

BusinessLens does not persist verification receipts, claim states, or a ledger.
Each `businesslens-verify` run derives findings from the requested Product Model
and current repository state. Git diffs may narrow the worklist but never supply
authority or durable state.

After an approved model change or an injected build step, verify discards its
previous findings and inspects again. It may keep an in-memory signature during
one invocation solely to stop when the same gap returns unchanged after a build
attempt. That signature is never written to the repository.

## Consequences

- `.businesslens/` contains product meaning, coverage context, orientation, and
  optional navigation—not workflow receipts.
- Report-only verification is naturally read-only.
- A hosted verification service, persistent audit trail, and semantic CI gate
  remain future decisions rather than accidental first-version contracts.
