---
kind: external-failure
businessRules:
  - a-source-failure-never-empties-the-library
  - failing-sources-back-off-and-surface-status
---

# A source that stops responding is marked, not dropped

## Trigger

A scheduled refresh cannot fetch a followed source.

## Steps

1. The fetch fails and the failure is recorded against that source
2. Every item the source previously produced stays in the library, with its reading state
3. The source is shown as failing wherever it appears, with when it last succeeded
4. Subsequent refreshes retry it progressively less often
5. Every other source in the refresh is fetched normally

## Outcome

The reader can see that one source has stopped working and how long it has been
that way, while the rest of the library behaves exactly as it did before.

## Edge cases

- A source failing at the moment it is added is refused instead, because the product has never successfully read it
