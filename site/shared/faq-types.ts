export interface AnswerPart {
  text: string
  to?: string
  external?: boolean
  bold?: boolean
  code?: boolean
}

export interface AnswerComparison {
  lead: string
  caption: string
  columns: [string, string]
  rows: Array<{
    label: string
    values: [string, string]
  }>
}

/**
 * Two short lists side by side: what one thing holds beside what it leaves out.
 *
 * Only "Does the Product Model replace my UI/UX design?" carries one. Its lists
 * are the same five pairs the PDD README and docs Introduction print, so the
 * three cannot say different things — see the repository's `docs/index.md`.
 */
export interface AnswerBoundary {
  lead: string
  kept: { label: string, items: string[] }
  left: { label: string, items: string[] }
}

export interface AnswerStackLayer {
  label: string
  description: string
  highlight?: boolean
}

export interface AnswerStack {
  lead: string
  caption: string
  layers: AnswerStackLayer[]
}

export interface Question {
  label: string
  answer: AnswerPart[][]
  comparison?: AnswerComparison
  boundary?: AnswerBoundary
  stack?: AnswerStack
}

export interface QuestionGroup {
  id: string
  title: string
  description: string
  questions: Question[]
}

export interface FaqContent {
  hero: { title: string }
  groups: QuestionGroup[]
  cta: {
    title: string
    description: string
    primary: { label: string, to: string }
    secondary: { label: string, to: string }
  }
}
