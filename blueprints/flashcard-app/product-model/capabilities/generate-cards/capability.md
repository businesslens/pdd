---
domain: card-generation
availability: [{ place: flashcards-web }]
---

# Card drafting

When a Learner pastes notes for an owned deck and asks for cards, the Product
sends the notes to a language model, which picks the facts worth a card and
drafts a front and back for each. The Product keeps every draft as a card
proposal in the deck, with the passage it came from, waiting for the Learner's
decision; it does not keep the pasted notes.

## Intent

Save the Learner the typing while leaving every decision about what to study
with them. While the language model cannot be reached, the Learner loses only
the drafting, never their notes or their deck.
