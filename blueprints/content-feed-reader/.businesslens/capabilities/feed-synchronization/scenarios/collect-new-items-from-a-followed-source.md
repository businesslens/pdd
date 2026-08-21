---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader refreshes their followed sources.
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::source-list
      mobile: reader-mobile::personal-library::source-list
  - text: The Product reads each followed feed
    kind: product
    places:
      web: reader-web::personal-library::source-list
      mobile: reader-mobile::personal-library::source-list
  - text: Items the Reader's library does not already hold are collected
    kind: product
    places:
      web: reader-web::personal-library::source-list
      mobile: reader-mobile::personal-library::source-list
  - text: The newly collected items enter the Reader's unread backlog
    kind: product
    places:
      web: reader-web::personal-library::source-list
      mobile: reader-mobile::personal-library::source-list
---

# Collect new items from a followed source

## Trigger

The Reader refreshes their followed sources.

## Outcome

New feed items are available in the Reader's private library without duplicates.
