---
id: url-shortener
summary: Turn long addresses into short links with a generated or custom slug, disable them or let them expire, see how often and from where they are followed, and create them from your own tools through an API.
category: developer-tools
tags: [api, public, single-user, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Every link lives under the Product's one short domain; an Owner cannot bring a domain of their own.
  - Links and API keys belong to one Owner's account. There are no teams, shared links or roles.
  - The API creates links and nothing else; editing, disabling, analytics and API keys are web commitments.
  - Analytics count follows and describe where they came from; they never tell Visitors apart, so there are no unique-visitor counts.
  - A link can be disabled but never deleted, so its slug is never given to another link.
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
somewhere else, disable it or give it an expiry, and sees how often and from
where it is followed. Their own tools create links through an API with a key
the Owner issues.

## Intent

Give a long address a short, dependable name its Owner controls. A short
address, once handed out, keeps meaning the same link: its Owner can change
where it leads, pause it or let it expire, but nobody deletes it or gives its
slug to another link. Owners learn how their links travel without the Product
learning who followed them.
