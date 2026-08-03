---
domains:
  - sharing
capabilities:
  - collection-sharing
  - collection-subscription
---

# Unlisting takes a collection back

When an owner unlists a collection, its public address stops serving it
immediately, and subscribers lose access to it.

## Intent

Publishing must be reversible in fact and not merely in appearance. A reader who
decides they shared too much needs one action that actually takes it back.

## Rationale

Reversibility is only credible if it is immediate and total, so the public
address and existing subscriptions both stop working at once rather than the
collection quietly persisting for people who already found it. A subscription is
a relationship with a published collection, so it cannot outlive publication.

What the product cannot revoke is what someone already read. Unlisting is not a
promise about copies, and the product should not imply otherwise.
