---
id: notes-app
summary: Capture quick notes into an inbox, file them into notebooks, tag and link them, find them again, and let your own AI agent suggest where they belong.
category: personal-productivity
tags: [single-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Notes belong to one person. There is no sharing, publishing, or collaboration.
  - There is no trash or version history; a deleted note is gone for good.
  - Tags are never renamed; a tag ends when no note carries it.
  - The Owner signs in with an existing account; signing up and managing accounts are not part of this product.
  - Bring your own AI agent; the Product does not include one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/notes-app/references/assumptions.md
    title: Notes assumptions
---

# Notes App

A private notes workspace for one person. The owner captures a thought in
seconds, and it waits in an inbox until they file it into a notebook, tag it,
or link it to related notes. Search finds any note again by its words or tags.
An AI agent the owner connects can read the inbox and suggest where each note
belongs.

## Intent

A thought is lost when writing it down means first deciding where it goes, and
a collection nobody sorts stops being findable. Make capturing free and keeping
tidy cheap: nothing stops the owner writing a note down, and the inbox shows
exactly what is still unsorted, so it can be emptied. Help from an AI agent
never costs control: it proposes, and nothing changes until the owner accepts.
