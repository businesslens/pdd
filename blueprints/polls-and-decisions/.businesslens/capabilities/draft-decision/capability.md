---
domain: decisions
availability: [{ place: polls-web }]
---

# Decision drafting

Starts the decision for a closed poll as a draft only its owner sees. When the
owner asks for a generated draft, the Product sends the question, the final
results and the comments to a language model and keeps the proposed outcome and
rationale it returns; otherwise the draft starts blank for the owner to write.

## Intent

Give the owner a head start on the record without letting anything become the
team's decision before the owner has read it. A generated draft is only ever a
proposal the owner edits and records, or leaves.
