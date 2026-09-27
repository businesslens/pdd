# Fixture Shop

A tiny fake webshop used as the BusinessLens golden fixture.

## Variation examples

Run `npm run view:fixture` from the repository root. Open one of the resources
below and select its **Variations** tab. Overview shows that member's usage;
the tab lets you expand and compare every member, including the current one.

| Type | Where to look | What it demonstrates |
| --- | --- | --- |
| Experiment | Interfaces → Customer web application → Shopping → Product record | Five product presentations, a Shopper assignment unit, a linked assignment field, assignment method and 20% allocation per arm. |
| Configuration | Business Rules → Standard refund review | Standard and Strict review policies; linked Store settings fields, including multiple settings on the Standard policy. |
| Version | Interfaces → Payment webhook | Two simultaneously supported contracts, v1 and v2, each with its own endpoint and a linked Settlement contract field on Payment gateway. |

Every member explains **Selected when**, **Takes effect**, and **Stability**.
Entity chips open their referenced Entity; field badges name its Information
kept. The five-member Experiment also exercises compact tree links and long names.

These are authored examples for the toy model and report, not implemented A/B
testing or configuration engines in the placeholder `src/` code. The three
variation types can be used on Interface, Experience, Screen, Entity, Capability,
Journey and Business Rule resources; these examples spread them across three
resource types without repeating all 21 combinations.
