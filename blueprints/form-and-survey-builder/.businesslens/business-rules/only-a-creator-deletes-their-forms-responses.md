---
appliesTo:
  - type: entity
    id: response
    effect: removes
permits:
  - related: [{ verb: receives, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator deletes their form's responses

Only the Creator who owns a form deletes a response it received. A Respondent
cannot take back a response once it is submitted.

## Rationale

The responses are the Creator's record of what was said; deciding which ones
count is theirs.
