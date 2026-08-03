---
kind: primary
---

# A source that comes back resumes immediately

## Trigger

A source that has been failing responds successfully to a retry.

## Steps

1. The fetch succeeds
2. The failure record is cleared and the source is shown as healthy again
3. The reduced retry frequency returns to normal at once
4. Items published while the source was down are added as unread, subject to whatever the feed still lists

## Outcome

The source is back to normal without the reader having done anything, and the
reader is not left on a slow retry schedule as a punishment for the source's
downtime.

## Edge cases

- Items published and rotated out of the feed during the outage are never fetched; the product does not claim to backfill them
