---
appliesTo:
  - type: entity
    id: order
    effect: changes
    facts: [Delivery details]
permits:
  - related: [{ verb: owns, entity: shopper }]
    when: [{ state: Pending }]
---

# Delivery details are editable while unpaid

A shopper edits an order's delivery details only while the order is still
unpaid.

## Rationale

Once payment has settled the order is queued for fulfilment, and a changed
address would race the warehouse.
