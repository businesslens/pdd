---
domain: polls
availability: [{ place: polls-web }]
---

# Comment summary

When a poll's owner asks for it, the Product sends the poll's question, options
and comments to a language model and keeps the short summary of the arguments it
returns, for that owner alone. Nothing is sent until the owner asks.

## Intent

Help an owner weigh a long discussion without reading every comment twice, while
keeping the summary the owner's working aid, not the team's record. The language
model is a helper: when it cannot answer, the owner simply has no new summary.
