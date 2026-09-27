# Fixture Shop

A tiny fake webshop used as the BusinessLens golden fixture.

## Variation examples

Run `npm run view:fixture` from the repository root and open **Variations** in
the rail. Each set is one file in `.businesslens/variations/`; its alternatives
are ordinary resources that carry no Variation keys.

| Variation | Type | Alternatives | What it demonstrates |
| --- | --- | --- | --- |
| `product-page-layout` | Experiment of Screens | Five product presentations under Customer web application → Shopping | A Shopper assignment unit, an assignment field, an assignment method and 20% allocation per arm. |
| `refund-review` | Configuration of Business Rules | Standard and Strict refund review | One Store settings field that chooses between the policies; the approval threshold only tunes Standard, so it is not a setting. |
| `payment-webhook-contract` | Version of Interfaces | Payment webhook (v1) and Payment webhook v2 | Two simultaneously supported contracts, each with its own endpoint and label, discriminated by Payment gateway's Settlement contract. |

In the report, a set is one row wherever its alternatives meet — in its
member type's collection, or on the Refund Entity's Business Rules tab — and
never expands in a list; the Interfaces tree still opens the Screen experiment to
its five Screens. Every alternative carries a pill on its title naming its set,
and pressing any pill opens a switcher that lists the alternatives with the
condition selecting each. A set's own reading says once how one is chosen —
what chooses, **Takes effect** and **Stability** — and each alternative adds its
own **Selected when**.

These are authored examples for the toy model and report, not implemented A/B
testing or configuration engines in the placeholder `src/` code. The three
subtypes can vary Interfaces, Experiences, Screens, Entities, Capabilities,
Journeys and Business Rules; these examples spread them across three resource
types without repeating all 21 combinations.
