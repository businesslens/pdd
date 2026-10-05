---
domain: card-generation
availability: [{ place: flashcards-web }]
---

# Generate cards

When a Learner pastes notes for an owned deck and asks for cards, the Product
sends the notes to a language model, which picks the facts worth a card and
drafts a front and back for each. The Product keeps every draft as a card
proposal in the deck, along with the passage it came from, and does not keep
the pasted notes. Nothing is added to the deck: proposals wait for the
Learner's decision.

## Intent

Save the Learner the typing while leaving every decision about what to study
with them. The language model only drafts, so while it cannot be reached the
Learner loses only the drafting, never their notes or their deck.
