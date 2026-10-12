# Variations is the seventh main collection

read_when: changing the homepage resource cards, docs topics, or report navigation.

Supersedes the count and the two-rows-of-three layout in
[ADR-0016](./0016-six-main-resource-collections.md). Its rule — independent
collections answer independent Product questions, and mandatory children are
reached through their owner — is unchanged, and is why Variations earns a card.

## What changed upstream

`businesslens/pdd` 0.23.0 makes Variation a first-class resource type with its
own collection, docs page (`/docs/variations`) and place in the report rail.
Its product model page now reads *Seven of them are main collections*, in the
order Entities, Interfaces, Domains, Capabilities, Journeys, Business Rules,
Variations.

## Decision

The homepage teaches seven main collections, in PDD's order, with Variations
last. A Variation is one product choice with several supported answers — an
experiment, a configuration or live versions — and it varies resources of any
of the other types, so it is a peer of all six rather than a child of one.

The cards run four to a row: four, then three centred. Seven divides by no
useful column count, and three across would leave Variations alone under two
full rows, reading as an afterthought. The inventory test now forbids only a
last row of one card.

The plate is the master mason's wall: three timber arch templates of the same
span hanging from pegs on one rail — round, pointed and ogee. One opening, three
complete supported forms, from the same kingdom's masonry as the Interfaces wall.

## Consequences

- The homepage, its integration and e2e tests, and the performance budget
  expect seven illustrated cards.
- `/docs/variations` exists only once PDD's `experience-border` reaches `main`.
  This lands with, or after, that merge and the landing package bump to 0.23.0.
