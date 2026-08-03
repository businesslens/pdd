---
domain: sources
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
---

# Source refresh

Fetching each followed source on a schedule and on demand, reconciling what came
back against the library, and recording the source's health.

## Intent

This is where the product earns the reader's trust, because it is the only part
that talks to systems nobody controls. Its job is to add what is genuinely new
and to change nothing else — no removals, no reset reading state, no duplicate
backlog — regardless of what a source returns.

A refresh always completes. One source failing does not abandon the rest.
