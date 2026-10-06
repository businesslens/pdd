---
id: flashcard-app
summary: Build flashcard decks, study what is due with spaced repetition on the web or a phone, draft cards from pasted notes, and share decks for others to copy.
category: learning-and-education
tags: [multi-user, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Cards are plain front-and-back text. There are no images, audio, or other kinds of card.
  - A shared deck opens only for signed-in Learners, who may copy it but never edit it. There is no anonymous preview, public catalog of decks, or commenting.
  - A language model drafts card proposals, only when the Learner asks and only from the notes they paste. What it drafts can be wrong, and only the Learner decides what reaches a deck; while the model is unavailable nothing is drafted, and cards are still added by hand.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/flashcard-app/references/assumptions.md
    title: Learner assumptions
---

# Flashcard App

A study product for people who want to remember what they learn. A Learner
builds decks of question-and-answer cards, studies them on a spaced-repetition
schedule — each card comes back sooner or later depending on how well it was
recalled — and sees each deck's progress. The Product can draft cards from
notes the Learner pastes, and a deck can be shared read-only for other
Learners to copy.

## Intent

People forget most of what they study unless they go over it again just before
it slips, and writing every card by hand is slow. The Flashcard App makes
remembering cheap: a study session asks only for the cards that are due, so
effort goes where forgetting is closest, and drafting from notes saves the
typing. Sharing hands out a deck's cards and never the owner's progress or
control.
