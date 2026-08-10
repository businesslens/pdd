---
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
capabilities: [source-following]
capabilityScenarios: [follow-a-source-by-feed-address, follow-an-address-with-no-feed, unfollow-a-source]
journeyScenarios: [receive-items-from-a-new-source]
entryPoints:
  - reader-web: /sources
  - reader-mobile: content-reader://library/sources
---

# Source list

Shows which feeds contribute to the Reader's library and provides the place to
follow another one.

## Information presented

- Followed source names and feed addresses
- Validation feedback for a proposed feed address

## Available actions

- Follow a source by feed address
- Unfollow an existing source

## Product states

### Sources followed

The Reader can review the feeds currently contributing items.

### Address rejected

The submitted address remains available to correct and no partial source is
added.

## Capability boundary

Controls which feeds are followed. It does not change reading state, saved
items, or collections.
