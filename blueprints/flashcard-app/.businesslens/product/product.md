---
id: flashcard-app
summary: Build decks of flashcards, study them with spaced repetition on the web or a phone, follow each deck's progress, draft cards from pasted notes with a language model, and share a deck read-only for others to copy.
category: learning-and-education
tags: [ai-assisted, multi-user, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - The mobile application studies decks and shows their progress; building decks, drafting cards from notes and sharing happen on the web.
  - Cards are plain front-and-back text. There are no images, audio, or other kinds of card.
  - A shared deck opens only for signed-in Learners, who may copy it but never edit it. There is no anonymous preview, public catalog of decks, or commenting.
  - Card proposals are drafted by a language model from text the Learner pastes, and only when the Learner asks. Drafting does not read files, web pages, or the Learner's other decks, what it proposes can be wrong, and nothing is drafted while the model cannot be reached.
  - Accounts, signing in, and study reminders are not modeled.
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

Make remembering cheap. A study session asks only for the cards that are due,
so effort goes where forgetting is closest. The Learner decides what is worth
studying: drafting saves typing, but nothing drafted reaches a deck
until the Learner keeps it. Sharing hands out a deck's cards and never the
owner's progress or control.
