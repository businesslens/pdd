---
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
capabilities: [source-following, feed-synchronization]
capabilityScenarios:
  - follow-a-source-by-feed-address
  - follow-an-address-with-no-feed
  - unfollow-a-source
  - collect-new-items-from-a-followed-source
  - preserve-library-when-a-feed-is-unavailable
journeyScenarios: [receive-items-from-a-new-source]
entryPoints:
  - reader-web: /sources
  - reader-mobile: content-reader://library/sources
---

# Source list

Shows which feeds contribute to the Reader's library, provides the place to
follow another one, and lets the Reader read them again on demand.

## Intent

Give the Reader one place to decide which sources may contribute items and to
ask for their new items now.

## Information presented

- Followed source names and feed addresses
- Validation feedback for a proposed feed address
- Whether a source could not be read at the last refresh

## Available actions

- Follow a source by feed address
- Refresh the followed sources
- Unfollow an existing source

## Product states

### Sources followed

The Reader can review the feeds currently contributing items.

### Address rejected

The submitted address remains available to correct and no partial source is
added.

### Source unreachable

The Reader sees which source could not be read and that its earlier items are
still in the library.

## Capability boundary

Controls which feeds are followed and when they are read. Collecting new items
adds to the unread backlog; it never changes the reading state of items already
in the library, saved items, or collections.
