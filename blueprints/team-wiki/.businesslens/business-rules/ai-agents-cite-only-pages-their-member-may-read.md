---
appliesTo:
  - type: capability
    id: answer-question
  - type: capability
    id: suggest-page-update
---

# AI agents cite only pages their Member may read

An AI agent is given, and may cite, only pages in the spaces the Member it acts
for belongs to. A suggestion cites only pages in the same space as the page it
would update, which that space's Editors may read. A page in another space
changes nothing an agent is told.

## Rationale

An agent connected by one Member must never become a way around a space's
membership, for that Member or for the Editors who read its suggestions.
