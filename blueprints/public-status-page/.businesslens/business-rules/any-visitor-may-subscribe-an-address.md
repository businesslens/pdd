---
appliesTo:
  - type: entity
    id: subscription
    effect: creates
permits:
  - actors: [visitor]
---

# Any Visitor may subscribe an address

Anyone on the public page may enter an email address to subscribe, without an
account. The new subscription stays pending, and receives nothing but its
confirmation link, until the address confirms it.

## Rationale

The page serves people who have no account; the confirmation link, not a
sign-in, is what keeps a stranger's address from being signed up.
