---
domain: my-snippets
relations:
  - entity: revision
    verb: holds
    cardinality: one-to-many
---

# Snippet

One piece of code a Developer keeps, with what it is called, what it is for
and the language it is written in, at an address of its own.

## Information kept

- **Title** — what the snippet is called
- **Description** — what the code does and when to reach for it, in the owner's words
- **Language** — the programming language the code is written in, which decides how it is highlighted
- **Tags** — the words the owner files it under so it can be found again
- **Code** — the code itself, as its latest revision holds it
- **Address** — the link the snippet is read at, which cannot be guessed
- **Forked from** — the snippet it was copied from, when it is a fork

## States

### Private

Readable only by its owner. Its address shows nothing to anyone else.

### Unlisted

Readable by anyone who holds its address, and listed nowhere: Discover and
search never show it.

### Public

Readable by anyone, listed in Discover, and open for other Developers to fork.
