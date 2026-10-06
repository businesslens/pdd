---
relations:
  - entity: vote
    verb: receives
    cardinality: one-to-many
  - entity: comment
    verb: gathers
    cardinality: one-to-many
domain: polls
---

# Poll

An open question a Member puts to the team, with the options to choose between
and the settings that decide how votes are cast and shown.

## Information kept

- **Question** — what the team is being asked to decide
- **Options** — the answers to choose between, at least two, in the owner's order
- **Choice mode** — Single choice, one option per vote, or Multiple choice, any number of options per vote
- **Deadline** — when voting ends on its own, if the owner set one
- **Ballot** — Named, where Members see who chose what, or Anonymous, where nobody does
- **Results visibility** — While open, where results show as votes arrive, or After closing, where they stay hidden until voting ends
- **Tally** — how many votes each option holds, counted from the current votes
- **Votes cast** — how many Members hold a vote on it
- **Comment summary** — the latest summary of the comments generated for the owner, marked as generated
- **Closed at** — when voting ended, by the owner or at the deadline

## States

### Open

Accepting votes and comments. Results show only if the poll's results
visibility is While open.

### Closed

Voting and discussion have ended and the final results show to every Member.
Its owner can now record a decision for it.
