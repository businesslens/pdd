---
id: code-snippet-sharing
summary: Save code snippets with their language, description and tags, keep them private or share them by link or in public, let others fork public ones, and revise them with a kept history.
category: developer-tools
tags: [ai-assisted, multi-user, public, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A snippet holds one piece of code in one language; snippets made of several files are not modeled.
  - Only a snippet's owner changes it. Others read it and may fork a public one, but there are no comments, stars or shared editing.
  - History is kept for reading. An earlier revision is not restored in place; its code is carried forward by editing the snippet.
  - Suggested details cover only a title, a description and tags, drafted by a language model only when the Developer asks. A suggestion never writes or changes code, language or visibility, and reaches a snippet only when its Developer saves it.
  - While the language model is unavailable, no details are suggested; writing and saving snippets work as always.
  - Highlighting follows the language the Developer chooses. The Product never runs, checks or formats code.
  - An unlisted snippet's address cannot be guessed, but anyone who holds it can read the snippet.
  - Snippets are written and shared through the web only; there is no programmatic interface or command-line client.
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

Make a useful piece of code easy to keep, find and hand to someone else. The
owner always decides who can read a snippet and is the only one who changes
it; reuse by anyone else happens through a fork that becomes theirs. The
Product may suggest how to describe a snippet, but the words that are kept are
always the Developer's choice.
