---
id: habit-tracker
summary: Define habits on a daily, chosen-day or weekly schedule, check them off, follow streaks and history, pause a habit without losing it, and optionally receive a weekly reflection whose suggestions change nothing until accepted.
category: personal-productivity
tags: [single-user, ai-assisted, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Habits are private to their one Owner. There is no sharing, social accountability or coaching.
  - A habit is done or not done on a day. There are no quantities, timers, notes or habits to avoid.
  - The Product sends no reminders or notifications; the Owner comes to it.
  - Weekly reflections are read and answered on the web; the mobile application serves the daily loop.
  - A reflection's summary is written with a language model and can misread the week. It only ever suggests a schedule, and nothing changes until the Owner accepts.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/habit-tracker/references/assumptions.md
    title: Habit assumptions
---

# Habit Tracker

A personal tracker for the small things someone means to do regularly. The
Owner defines each habit with a schedule — every day, on chosen weekdays, or a
number of times a week — checks it off on the days they do it, and follows the
streak and history it builds. A habit can be paused for a while and resumed
with its history intact. An optional weekly reflection reads the week back and
may suggest one schedule adjustment, which the Owner accepts or declines.

## Intent

Make a regular practice visible without turning a missed day into a failure.
Streaks count only the days a habit was meant to happen, a pause keeps
everything, and nothing the Product prepares on its own changes a habit: the
Owner decides every schedule.
