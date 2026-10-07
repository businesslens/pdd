---
entities:
  - { entity: suggestion, shows: [Reason, Explanation, Proposed content, Cited pages, Drafted at], collects: [Proposed content] }
  - { entity: page, shows: [Title, Content] }
  - { entity: revision, shows: [Saved at] }
  - { entity: space, shows: [Name] }
entryPoints:
  - wiki-web: /suggestions/:suggestionId
---

# Suggestion

One suggestion opened for review: why it was raised, the pages it
cites, and its proposed content beside the page as it stands now. An Editor
adjusts the proposed content, accepts it, or dismisses it here.
