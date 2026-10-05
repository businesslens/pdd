---
entities:
  - { entity: poll, shows: [Question, Options, Choice mode, Deadline, Ballot, Results visibility, Tally, Comment summary, Closed at] }
  - { entity: vote, shows: [Chosen options, Cast at], collects: [Chosen options] }
  - { entity: comment, shows: [Text, Posted at], collects: [Text] }
  - { entity: member, shows: [Display name] }
  - { entity: decision, shows: [Outcome] }
entryPoints:
  - polls-web: /polls/:pollId
---

# Poll

One poll in full: its question, options and settings, the Member's own vote,
the results as far as the poll allows, who chose what on a named poll, and the
discussion. Its owner also sees the controls to close it, ask for a generated
summary of the comments, and start the decision once it has closed. A closed
poll with a recorded decision shows that decision's outcome.

## Intent

Keep the question, the vote, the arguments and the outcome in one place, so a
Member never has to piece together what was asked and what came of it.
