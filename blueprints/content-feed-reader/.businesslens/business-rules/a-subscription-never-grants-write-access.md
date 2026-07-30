---
domains:
  - sharing
features:
  - collection-subscription
---

# Subscribing grants reading and nothing else

Subscribing to a collection lets a reader see it and follow its changes. It never
lets them add to it, remove from it, rename it, or change who else can see it.

## Intent

Keep the one-directional shape of sharing explicit, so that adding subscriber
convenience later never quietly turns into shared editing.

## Rationale

The obvious next features — "save this to the collection", "suggest an item" —
all read as helpful and all break the guarantee the owner relied on when
publishing. Naming the boundary as a rule makes that trade a deliberate decision
rather than an incremental slip.
