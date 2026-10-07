# Fixture Shop

A tiny fake webshop used as the BusinessLens golden fixture.

## Variation examples

Run `pnpm view:fixture` from the repository root and open **Variations** in
the rail. Each set is one file in `.businesslens/variations/`; its alternatives
are ordinary resources that carry no Variation keys.

| Variation | Type | Alternatives | What it demonstrates |
| --- | --- | --- | --- |
| `mobile-storefront` | Configuration of Experiences | Shopping and Catalog preview in the Customer mobile application | Two contexts offering different Capabilities to the same Shoppers; the Variation also justifies the Interface holding Experiences. |
| `cancellation-handling` | Configuration of Capabilities | Order cancellation and Cancellation request | The Actors and places differ, not one path, so the Capabilities vary. |
| `post-purchase` | Experiment of Journeys | Browse and buy, and Browse, buy and track | One arm crosses a Capability the other does not. |
| `order-confirmation` | Configuration of Journey Scenarios | Checkout confirmed by the payment webhook or by an operator | Only the last Step differs, so two Scenarios of one Journey vary. |
| `checkout-review` | Experiment of Capability Scenarios | Complete checkout, with and without the delivery-address Step | One Step differs, so two Scenarios of Checkout vary rather than two Capabilities. |
| `tax-document` | Configuration of Entities | VAT invoice and Sales tax receipt | The thing kept differs by the store's Tax region, so the Entities vary. |
| `tax-document-issue` | Configuration of Capability Scenarios | Issue a VAT invoice and Issue a sales tax receipt | The same selection carried into the Scenarios that create each Entity alternative. |
| `stock-disclosure` | Experiment of Screens | Product record with and without remaining stock, under Customer web application → Shopping | Arms that differ in a fact shown, not in looks; a Shopper assignment unit, an assignment field, an assignment method and an even allocation. |
| `refund-review` | Configuration of Business Rules | Standard and Strict refund review | One Store settings field that chooses between the policies; the approval threshold only tunes Standard, so it is not a setting. |
| `payment-webhook-contract` | Version of Interfaces | Payment webhook (v1) and Payment webhook v2 | Two simultaneously supported contracts, each with its own endpoint and label, discriminated by Payment gateway's Settlement contract. |

In the report, a set is one row wherever its alternatives meet — in its
member type's collection, or on the Refund Entity's Business Rules tab — and
never expands in a list; the Interfaces tree still opens the Screen experiment to
its two Screens. Wherever an alternative is a title, its set is the title and a
picker beside it names the alternative being read; the picker's menu opens the
set and lists every alternative with the condition selecting it. A set's own reading says once how one is chosen —
what chooses, **Takes effect** and **Stability** — and each alternative adds its
own **Selected when**.

These are authored examples for the toy model and report, not implemented A/B
testing or configuration engines in the placeholder `src/` code. Every type
that can vary appears at least once — Interfaces, Experiences, Screens,
Entities, Capabilities, Journeys, both Scenario types and Business Rules — and
so does every subtype. `test/variations.test.ts` holds the fixture to that, and
the round-trip tests cover every type and subtype combination without adding a
fixture file for each.
