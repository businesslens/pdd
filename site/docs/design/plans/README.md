# Implementation Plans

read_when: recording or consulting a proposed or accepted cross-cutting plan.

A plan records a proposed or accepted body of work that spans surfaces,
together with the durable rules that outlive its implementation. Add one when a
decision changes more than one surface or a contract other repositories depend
on, and link it from the current-state documents it affects.

A plan is not an ADR. An [ADR](../../adr/) records one decision a future reader
would otherwise "fix"; a plan records a body of work and how it was sequenced.
When a plan's reasoning is the thing worth keeping, extract it into an ADR — that
is where readers look.

## Accepted

- [Resource navigation](./resource-navigation.md) — six main collections across the shared report, docs and homepage; approved 2026-09-09.

The move to a static site in the pdd-kit repository was a single decision rather
than a plan; it is recorded in
[ADR-0022](../../adr/0022-a-static-site-in-the-pdd-kit-repository.md).

## Superseded

The two catalog-migration plans in `platform/docs/design/plans/` were written
from the wrong vantage point — they describe surgical removal *from* the
`platform` application, when the decision was that `platform` is not in the first
release at all. None of their removal work was executed, and it is moot. They
were not ported; `platform` keeps them with the rest of its archive.

## Related

- [`docs/adr/`](../../adr/) — the decisions themselves
- [Delivery phases](../phases/README.md) — what has actually landed
- [Product requirements](../product/product-requirements.md) — what is in and out
