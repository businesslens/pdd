---
entities:
  - { entity: source, facts: [Feed address] }
capabilities:
  - follow-source
---

# Feed address

Collects the address of the feed the Reader wants to follow, and tells the
Reader when no supported feed is found there so the address can be corrected.
