# Architecture decision records

One decision per file, numbered, append-only. A superseded ADR keeps its file
and gains a `Superseded by` line rather than being edited into agreement with a
later decision.

These record decisions about **how the Product Model itself is judged and
changed** — they constrain future format work. They are not docs-site pages and
do not carry docs frontmatter.

| # | Decision | Status |
| --- | --- | --- |
| [0001](./0001-shipped-agent-is-the-standard-of-judgment.md) | The shipped agent, not the spec, is the standard a format rule must meet | Accepted |
| [0002](./0002-determinism-outranks-expressiveness.md) | Determinism outranks expressiveness | Accepted |
| [0003](./0003-descriptive-and-generative-are-equal.md) | Descriptive and generative use are judged equally | Accepted |
| [0004](./0004-the-pull-request-diff-is-the-binding-human-surface.md) | The pull-request diff is the binding human surface | Accepted |
| [0005](./0005-reviewability-is-a-first-class-axis.md) | Reviewability is a first-class quality axis | Accepted |
| [0006](./0006-determinism-is-verified-by-independent-double-authoring.md) | Determinism is verified by independent double-authoring | Accepted |
| [0007](./0007-blueprints-are-provenance-neutral.md) | Blueprints are provenance-neutral by design | Accepted |
| [0008](./0008-an-ai-agent-harness-is-an-actor.md) | An AI agent harness is an Actor, named `ai-agent` | Accepted |
| [0009](./0009-what-the-product-keeps-is-in-scope.md) | What the Product keeps is in scope | Accepted |
| [0010](./0010-a-thing-the-product-keeps.md) | A thing the Product keeps is its own entity | Accepted |
| [0011](./0011-a-things-states-belong-to-the-thing.md) | A thing's states belong to the thing, not the views that show it | Accepted |
| [0012](./0012-entity-and-element.md) | The kind is an Entity; a kind is an Element | Accepted |
| [0013](./0013-relationships-are-product-meaning.md) | Relationships between Entities are product meaning | Accepted |
| [0014](./0014-relations-and-transitions-live-in-frontmatter.md) | Relational structure lives in frontmatter | Accepted |
