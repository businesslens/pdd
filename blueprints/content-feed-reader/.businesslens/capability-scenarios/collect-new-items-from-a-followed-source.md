---
kind: primary
capability: feed-synchronization
actors: [feed-provider]
availability:
  - interface: syndicated-feed-integration
---

# Collect new items from a followed source

## Trigger

A followed feed makes items available when the Product synchronizes the source.

## Steps

1. The Product reads the supported feed
2. Items not already known to the Reader's library are collected
3. Newly collected items enter the Reader's unread backlog

## Outcome

New feed items are available in the owning Reader's private library without duplicates.
