---
title: Product
description: The one product a Product Model describes (its name, its promise, the languages it is delivered in, its known boundaries, and what it needs to be published as a Blueprint).
section: open-source
group: Product Model
order: 7
terms:
  - term: Product
    definition: "The one coherent value promise this model describes, and the boundary drawn around it."
---

# The Product

**The Product is the one thing a Product Model describes: what it promises, and
where its boundary lies.** Every model has exactly one, in `product.md`. The
rest of the model (who uses it, where, what it can do and under which rules)
explains that promise.

## In practice

The fixture shop's Product:

```md [product/product.md]
---
id: fixture-shop
summary: Browse a product catalog, buy products, and manage the resulting orders.
category: commerce
tags: [commerce, fixture]
authors:
  - name: BusinessLens
license: MIT
languages: [en, de]
limitations: []
---

# Fixture Shop

A tiny webshop where shoppers browse a catalog and buy products, and store admins manage the resulting orders.

## Intent

Exercise the complete BusinessLens report contract with a small deterministic product.
```

## One Product or several?

A website, a mobile app, a CLI and a public API are usually
[Interfaces](./interfaces.md) of one Product, not separate Products. Keep
separate Products for genuinely separate promises.

Repository layout doesn't decide it: several packages may build one Product.
Today a repository holds one Product Model in one `.businesslens/`; support for
several Products in one repository is planned
([#46](https://github.com/businesslens/pdd/issues/46)).

## The file

`product.md`, or `product/product.md` once it has a logo. The H1 is the
Product's name and the paragraph under it the description. An optional
`## Intent` says the outcome the Product protects.

| Field | Says |
| --- | --- |
| `id` | The Product's id, in kebab-case; it may differ from the repository name. Required |
| `summary` | One line, for listings |
| `category`, `tags` | What kind of product it is, for the Blueprint catalog |
| `authors` | Who made it: each a `name` and an optional `url` |
| `license` | One SPDX identifier, such as `MIT` |
| `languages` | The languages the Interfaces are delivered in; an [Interface](./interfaces.md#the-file) may narrow it |
| `limitations` | What the Product deliberately does not do |
| `references` | Outside material, as [References](./references.md) |

Content kept in several languages is a fact of an Entity, and how someone's
language is chosen is a kept fact such as *Preferred language*. Neither belongs
in `languages`.

### Limitations vs Coverage

`limitations` are deliberate boundaries of the Product itself, including what
it leaves to other systems: "In-store purchasing is outside this Product",
"People sign in with their existing account". [Coverage](./product-model.md#coverage)
never describes the Product; it records which code the model accounts for.

## Logo and publishing

A logo expands the Product into a folder:

```text
.businesslens/product/
├── product.md
└── logo.svg
```

A model without a logo stays compact, as `product.md`. To publish the model as
a [Blueprint](./from-a-blueprint.md#what-a-blueprint-is), it needs a `category`,
at least one tag, at least one author, a `license`, and `logo.svg`.

## How it connects

- [Interfaces](./interfaces.md) are where the Product meets people and systems;
  each may narrow its `languages`.
- [Coverage](./product-model.md#coverage) says which of the repository's code
  the model accounts for.
- [References](./references.md) attach outside material, such as a product
  brief with `role: intent`.

## What lint checks

Errors:

- Exactly one manifest: `product.md` or `product/product.md`, never both.
- `product/` holds only `product.md` and `logo.svg`, and a `product/` folder
  needs its logo. Without one, use `product.md`.
- No unknown frontmatter keys, and `## Intent` at most once.
- `id` is present, lowercase kebab-case and at most 64 characters; the H1 and
  description are present.
- `summary` is one line of at most 400 characters; `category` is kebab-case of
  at most 60; `license` is one SPDX identifier.
- Each author has a `name` of 1–120 characters, an optional HTTP(S) `url`, and
  nothing else.
- Every language is a well-formed tag, like `en` or `pt-BR`, listed once.
- `logo.svg` is a plain file of at most 256 KiB with a `viewBox`: shapes only,
  with no scripts, animation, text, external links or embedded content.

Warnings:

- A limitation that talks about the model ("not modeled", "outside the
  model") instead of stating a product constraint.
