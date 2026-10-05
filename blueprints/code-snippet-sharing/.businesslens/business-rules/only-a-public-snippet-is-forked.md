---
appliesTo:
  - type: capability
    id: fork-snippet
  - type: journey
    id: fork-and-adapt-a-snippet
---

# Only a public snippet is forked

A Developer forks a snippet only while it is public and owned by someone else.
An unlisted snippet can be read by whoever holds its address, but not forked;
once its owner makes a public snippet unlisted or private, it can no longer be
forked, and forks made before stay with their owners.

## Rationale

Making a snippet public is the owner's statement that it is open for reuse.
Sharing by link is not, so a link alone never lets someone take a copy away.
