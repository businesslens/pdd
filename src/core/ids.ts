export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isId(value: string): boolean {
  return ID_PATTERN.test(value)
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Filename stem: "actors/shopper.md" -> "shopper". */
export function stem(fileName: string): string {
  const base = fileName.split('/').at(-1) || fileName
  return base.replace(/\.md$/, '')
}
