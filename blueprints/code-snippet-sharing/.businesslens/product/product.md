---
id: code-snippet-sharing
summary: Keep code snippets with their language, description and tags, share them by unlisted link or in public, fork others' public snippets, and revise code with kept history.
category: dev-tools
tags: [multi-user, public, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A snippet holds one piece of code in one language.
  - Only a snippet's owner changes it. Others read it and may fork a public one; there are no comments, stars or shared editing.
  - An earlier revision is never restored in place; its code is carried forward by editing the snippet.
  - When the Developer asks, a language model drafts a title, a description and tags into the editor, and may be wrong. The Developer decides what is saved, and everything else works while the model is unavailable.
  - Highlighting follows the language the Developer chooses. The Product never runs, checks or formats code.
  - An unlisted snippet's address cannot be guessed, but anyone who holds it can read the snippet.
  - Developers sign in with an existing account to write snippets, while anyone reads public and unlisted ones without one; signing up and managing accounts are not part of this product.
  - There are no profile pages listing a Developer's snippets.
  - Public snippets are not reported or moderated within the product.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/code-snippet-sharing/references/assumptions.md
    title: Snippet sharing assumptions
---

# Code Snippet Sharing

A place where developers keep the pieces of code they reach for again and
again. Each snippet carries its language, so it is highlighted as code, and a
title, description and tags, so it can be found later. A snippet stays private
until its owner shares it by an unlisted link or makes it public, where anyone
can read it and other developers can fork their own copy. Every change to the
code keeps a revision, so a snippet can improve without losing what it was.

## Intent

Useful code gets lost in old projects and chat threads, and handing it to
someone means pasting it where nobody finds it again. Make a useful piece of
code easy to keep, find and pass on. The owner always decides who can read a
snippet and is the only one who changes it; reuse by anyone else happens
through a fork that becomes theirs.
