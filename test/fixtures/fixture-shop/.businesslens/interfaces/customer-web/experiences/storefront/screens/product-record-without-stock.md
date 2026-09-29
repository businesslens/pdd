---
entities:
  - entity: catalog-product
    shows:
      - Name and description
      - Price
  - { entity: cart, shows: [Quantity chosen] }
  - { entity: shopper, shows: [Delivery address] }
---

# Product record without stock

Shows a product's description and price without saying how many units remain.
