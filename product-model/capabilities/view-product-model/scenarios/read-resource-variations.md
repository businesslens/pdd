---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens the Variations collection and reads each set grouped by the type it varies
    kind: actor
    actor: developer
    entities:
      - { entity: variation, effect: reads, facts: [Choice, Subtype, Member type, Alternatives, Selection] }
    contexts:
      local: { place: local-report-web::resource-collection }
  - text: The Product shows alternatives that meet in another collection as one set row that never expands
    kind: product
    entities:
      - { entity: business-rule, effect: reads, facts: [Variation] }
    contexts:
      local: { place: local-report-web::resource-collection }
  - text: The Developer opens a set and reads how one alternative is chosen
    kind: actor
    actor: developer
    entities:
      - { entity: variation, effect: reads, facts: [Choice, Subtype, Selection, Takes effect, Stability] }
    contexts:
      local: { place: local-report-web::resource-reading }
  - text: The Developer reads each alternative's own words and the condition that selects it
    kind: actor
    actor: developer
    entities:
      - { entity: variation, effect: reads, facts: [Subtype, Alternatives] }
      - { entity: business-rule, effect: reads, facts: [Assertion, Variation] }
    contexts:
      local: { place: local-report-web::resource-reading }
  - text: The Developer opens one alternative, reads its set on its title and switches to another from the pill
    kind: actor
    actor: developer
    entities:
      - { entity: business-rule, effect: reads, facts: [Assertion, Variation] }
    contexts:
      local: { place: local-report-web::resource-reading }
---

# Read resource Variations

## Trigger

The Developer wants to find a product choice with several supported answers and
read each answer in context.

## Outcome

Every Variation is listed in the Variations collection, grouped by the type it
varies, each row saying what chooses between its alternatives. Wherever two or
more alternatives of one set meet in a list, they read as one set row that never
expands; its pill opens a switcher listing every alternative with its condition.
The set's reading says once how one is chosen, and its Alternatives reading
shows each alternative in its own words. An alternative's reading names its set
on its title; the same pill switches to another alternative on the same reading.
Back restores the previous reading; closing restores the working list.

## Edge cases

- A resource that is no alternative carries no pill and no empty label.
- A lone alternative in a filtered list keeps its own row and names its set.
- Membership never becomes containment: a set node in a tree opens to its alternatives, and group counts stay counts of real resources.
- A Business Rule that is an alternative is disclosed as conditional and never drawn as an unconditional prohibition.
- No alternative is a default or inherits content from another.
