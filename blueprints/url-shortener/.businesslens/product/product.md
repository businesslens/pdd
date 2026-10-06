---
id: url-shortener
summary: Turn long addresses into short links on the web or through an API, disable them or let them expire, and see how often and where they are followed.
category: developer-tools
tags: [single-user, public, api]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Every link lives under the Product's one short domain; an Owner cannot bring a domain of their own.
  - Links and API keys belong to one Owner's account. There are no teams, shared links or roles.
  - The API only creates links. Editing, disabling, enabling, analytics and API keys are on the web alone.
  - Analytics count follows and describe where they came from; they never tell Visitors apart, so there are no unique-visitor counts.
  - Links are never deleted; disabling one stops its redirect, and its slug is never given to another link.
  - An API key keeps the name it was created with; it is revoked, never edited.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/url-shortener/references/assumptions.md
    title: Shortener assumptions
---

# URL Shortener

A link shortener for people who hand out web addresses: in posts, slides,
printed material and their own software. An Owner turns a long address into a
short link, with a slug the Product generates or one they choose, can point it
somewhere else, disable and enable it or give it an expiry, and sees how often
and from where it is followed. Their own tools create links through an API with a key
the Owner issues.

## Intent

An address handed out in print, on slides or in someone else's post cannot be
taken back, so the person who handed it out needs a short name for it that
they control and that never changes meaning. Its Owner can change where it
leads, disable it or let it expire, but nobody deletes it or gives its slug to
another link. Owners learn how their links travel without the Product learning
who followed them.
