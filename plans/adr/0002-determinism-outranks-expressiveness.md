# 0002 — Determinism outranks expressiveness

Status: **Accepted** — 2026-08-26

## Context

The Product Model is authored by an agent, consumed by `verify` as a contract,
and published to a catalog as a comparable Blueprint. All three depend on one
product yielding one model.

Two candidate failure modes pull in opposite directions. A format that
**refuses** to model something is honest and visible. A format that models one
thing **two valid ways** is broken and invisible — both encodings lint clean,
and nothing downstream can tell they describe the same product.

## Decision

Quality axes, in order:

1. **Determinism** — one product, one model.
2. **Reviewability** — a human who never read the spec can tell it is wrong.
3. **Economy** — every entity kind earns its existence.
4. **Falsifiability** — a claim can be checked against implementation.
5. **Expressiveness** — the format can hold the product without a workaround.
6. **Legibility** — the model can be read.
7. **Buildability** — a builder can start without a question the model should
   have answered but structurally cannot.

Where determinism and expressiveness conflict, **prefer removing author freedom
over adding it**. A narrower format that forces one encoding beats a wider one
that permits several.

## Consequences

- A proposed rule that adds a legal alternative encoding is rejected by default.
- "An author might reasonably want to do it either way" is an argument
  *against* a rule, not for it.
- Refusing to model something is an acceptable outcome; it must be stated in
  the docs rather than left to be discovered.
