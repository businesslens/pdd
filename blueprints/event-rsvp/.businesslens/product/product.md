---
id: event-rsvp
summary: Create an event, share one invitation link, collect going, maybe and not going answers without guest accounts, keep a waitlist once it is full, and message the guests.
category: public-participation
tags: [multi-user, public, ai-assisted, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Guests answer without accounts. A guest is known only by the name and email they give, and anyone holding the invitation link can answer.
  - The host does not add, remove or change guests; the guest list holds the answers guests give.
  - Each event has one host and happens once. There are no co-hosts and no recurring series.
  - The Product does not sell tickets, take payments or check guests in at the door.
  - Messages to guests go out by email in one direction; guests do not reply inside the Product.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/event-rsvp/references/assumptions.md
    title: Event RSVP assumptions
---

# Event RSVP

A small invitation product for people holding a gathering. A host creates an
event with its time, its place or online link and how many people it can take,
and shares one public invitation link. Anyone holding the link answers going,
maybe or not going without an account, with a plus-one where the host allows
it. Once the event is full, new yes answers join a waitlist that moves on its
own as spots open. The host sees who is coming, messages the guests, and
changes or cancels the event.

## Intent

Make inviting people as light as sharing a link, and answering as light as
choosing one of three replies. Guests never need an account, the host always
knows who is coming, and the event's capacity holds without the host having to
police it. Suggested wording can help a host start a message, but every message
leaves only when the host sends it.
