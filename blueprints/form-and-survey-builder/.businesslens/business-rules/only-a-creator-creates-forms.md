---
appliesTo:
  - type: entity
    id: form
    effect: creates
permits:
  - actors: [creator]
---

# Only a Creator creates forms

A form is created only by a signed-in Creator, who owns it from the start.
Holding a public link never lets anyone start a form.

## Rationale

Every form needs one owner before any question is written, because ownership
decides who may build it and who reads its answers.
