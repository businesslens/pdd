---
domain: quizzes
relations:
  - entity: question
    verb: contains
    cardinality: one-to-many
  - entity: attempt
    verb: receives
    cardinality: one-to-many
---

# Quiz

A set of questions a creator shares with learners, who take it once for a
score.

## Information kept

- **Title** — what the quiz is called
- **Question order** — the questions learners are asked, in the order they are asked
- **Answer reveal** — whether learners see each question's correct answer and explanation after submitting, or only which answers scored
- **Source material** — the text the creator gave the Quiz assistant to draft questions from, if any
- **Share link** — the address learners open to take the quiz, once it has been shared

## States

### Draft

Being written. Only its creator sees it, and no learner can take it.

### Open

Shared by link, with classes, or both. A signed-in learner who reaches it can
make their one attempt.

### Closed

No longer accepting attempts. Submitted attempts, results and practice remain,
and the creator can open it again.
