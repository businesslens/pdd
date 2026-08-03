---
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
capabilities:
  - source-following
  - source-refresh
scenarios:
  - a-failing-source-recovers
  - a-source-returns-an-empty-document
  - a-source-starts-failing
  - follow-a-source-already-followed
  - follow-a-source-by-feed-address
  - follow-a-source-by-site-address
  - follow-a-source-that-is-unreachable
  - follow-an-address-with-no-feed
  - unfollow-a-source-that-is-gone
entryPoints:
  - reader-web: /sources
  - reader-mobile: content-reader://library/sources
---

# Source management

Shows what the reader follows, lets them add or remove a source, and makes each
source's refresh health understandable.

## Intent

Give the reader control over what enters the library while containing the
unreliability of systems the product does not control.

## Information presented

- Every followed source and its address
- Last successful refresh and current health
- Failure and backoff status without hiding the source
- The effect of unfollowing on saved and unsaved items

## Available actions

- Follow a source by feed or site address
- Retry or request a source refresh
- Open the items already held for a source
- Unfollow a source after reviewing the effect

## Product states

### Healthy

The source's latest successful refresh and current library relationship are
clear.

### Discovering a feed

The product is resolving a pasted site or feed address into a source the reader
can follow.

### Failing with backoff

The failure and delayed retry are visible while the source and its existing
library items remain intact.

### Recovered

A later successful refresh clears the active failure without duplicating or
resetting existing items.

### No feed found

The submitted address remains available to correct and no partial source is
added.

## Capability boundary

The Screen controls followed sources and their refresh requests. It does not
delete saved items, reset reading state, or let one failing source stop refresh
work for the rest of the library.
