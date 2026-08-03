---
domain: sources
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
---

# Source following

Adding a feed to a reader's library by its address, reviewing what is followed,
and unfollowing.

## Intent

Following is the one deliberate act that decides what enters a library, so it has
to be forgiving about what a reader pastes. People paste the address of a site
rather than of its feed, and the product should find the feed rather than refuse
the input.

Unfollowing is the only action that removes a source's unsaved items, which makes
it the one destructive action in the product and the one that must say so.
