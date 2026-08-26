---
title: Objects
description: An Object names a thing the Product keeps whose state an Actor can observe and act on, and records the states and transitions that make up its lifecycle.
section: open-source
group: Product Model
order: 14
---

# Objects

An Object is a thing the Product keeps whose state an Actor can observe and act
on — an order, a listing, a subscription. Capabilities name what the Product
*does*; Objects name what it *keeps*.

An Object records a lifecycle, not a data model. It has no fields, no types, and
no storage. What it carries is the set of states a thing can be in and the
transitions between them, because those are the parts an Actor can see and a
Capability can change.

## When you create one

Create an Object when a thing has **two or more named states referenced by two
or more Capabilities**. That test is computable, and `lint` applies it — so this
is not a judgment call you have to make and defend.

The two halves both matter. A thing with one state has no lifecycle worth
recording. A thing whose state only one Capability touches is that Capability's
own business, and belongs in its Scenarios.

Do not create an Object for every noun in the product. A cart that is only ever
empty or non-empty is not an Object; an order that moves from pending to
confirmed to refunded, touched by checkout and by order management, is.

## The file

An Object with no assets lives at `objects/<id>.md`, and gains a folder only
when it owns one.

```markdown
---
domain: ordering
---

# Order

A shopper's confirmed intent to buy, from submission through fulfilment or
refund.

## States

### Pending

Submitted and awaiting payment settlement. No stock has been committed yet.

### Confirmed

Paid and accepted. Stock is committed and the order is queued for fulfilment.

### Refunded

Reversed after confirmation. The shopper has been repaid and no fulfilment
follows.

## Transitions

- Pending → Confirmed
- Confirmed → Refunded
```

`## States` is required and needs at least two H3 state names, each with prose.
`## Transitions` is required and lists `from → to` pairs — the Unicode arrow or
`->` both work — and every name on either side must be one of that Object's own
states. A terminal state is valid and needs no outgoing transition; a state no
transition ever reaches is a warning, because nothing can put the thing there.

`domain` is optional and single. The H1 is the name and the lead paragraph is
the description.

## What an Object never declares

An Object declares no Capabilities, Screens, availability, or Actors. The
Capabilities that act on it name it in their own prose, and every other Object
relation is derived. One authority, not two that can disagree.

## Objects and Screen states

A Screen's `## Product states` and an Object's `## States` answer different
questions, and keeping them apart is the point of having Objects at all.

An Object's states belong to **the thing**: an order is pending, confirmed, or
refunded no matter which view you are looking at. A Screen's Product states
belong to **that view**: the orders list is populated or empty, the record is
loading or unauthorized.

Before Objects existed, a thing's lifecycle had nowhere to go but the Screen
that happened to show it — so a listing visible on six Screens either repeated
its lifecycle six times or recorded it arbitrarily on one. Put a lifecycle on
the Object and let each Screen describe only what that view does.

## Findings `lint` reports

- An Object without `## States`, or with fewer than two H3 states, is an error.
- An Object without `## Transitions`, or with none listed, is an error.
- A transition naming a state the Object does not define is an error.
- A transition that does not read `from → to` is an error.
- A state that no transition reaches, other than the first, is a warning.
- An Object naming a Domain that does not exist is an error.
