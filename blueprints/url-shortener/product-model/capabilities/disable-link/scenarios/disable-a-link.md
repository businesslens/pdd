---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to disable an active link
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product explains that the short address will stop redirecting and say the link is unavailable
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: changes, from: Active, to: Disabled, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Disable a link

## Trigger

The Owner no longer wants a short address they handed out to lead anywhere.

## Outcome

The link is disabled: its short address shows that the link is unavailable,
and its slug, destination and clicks are kept.

## Edge cases

- The Owner declines to confirm → the link stays active and nothing changes.
