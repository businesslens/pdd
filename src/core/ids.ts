export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Separator for a qualified Interface, Experience, or Screen id.
 *
 * `::` rather than `/`: report routes address elements by id, and a slash would
 * force URL encoding at every boundary. It also matches the `parent::child`
 * node-key convention the viewer already uses.
 */
export const ID_SEPARATOR = '::'

const QUALIFIED_PATTERN = new RegExp(
  `^[a-z0-9]+(?:-[a-z0-9]+)*(?:${ID_SEPARATOR}[a-z0-9]+(?:-[a-z0-9]+)*)*$`
)

export function isId(value: string): boolean {
  return ID_PATTERN.test(value)
}

/**
 * A qualified Interface, Experience, or Screen id: one or more path segments
 * joined by `::`.
 *
 * Interfaces, Experiences and Screens repeat names across Interfaces on
 * purpose — `personal-library` on web and on mobile are different elements that
 * pursue the same goal — so their ids carry the path that distinguishes them.
 */
export function isQualifiedId(value: string): boolean {
  return QUALIFIED_PATTERN.test(value)
}

export function qualify(...segments: string[]): string {
  return segments.filter(Boolean).join(ID_SEPARATOR)
}

export function segments(id: string): string[] {
  return id.split(ID_SEPARATOR)
}

/** The Interface segment of any qualified place id. */
export function interfaceOf(id: string): string {
  return segments(id)[0] ?? ''
}

/** Whether `candidate` is `ancestor` or one of its descendants in the place hierarchy. */
export function containsPlace(ancestor: string, candidate: string): boolean {
  const parent = segments(ancestor)
  const child = segments(candidate)
  return parent.length <= child.length && parent.every((segment, index) => child[index] === segment)
}

/** The structural parent id of a qualified place, when it has one. */
export function parentPlace(id: string): string | undefined {
  const parts = segments(id)
  return parts.length > 1 ? parts.slice(0, -1).join(ID_SEPARATOR) : undefined
}

/**
 * The path below the Interface — what makes two elements counterparts.
 *
 * `reader-web::personal-library::unread-library` and
 * `reader-mobile::personal-library::unread-library` share the suffix
 * `personal-library::unread-library`, so they are the same thing on two
 * Interfaces. Matching on the suffix rather than the last segment is what keeps
 * `personal-library::foo` and `checkout::foo` correctly distinct inside one
 * Interface.
 */
export function counterpartKey(id: string): string {
  return segments(id).slice(1).join(ID_SEPARATOR)
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Filename stem: "actors/shopper.md" -> "shopper". */
export function stem(fileName: string): string {
  const base = fileName.split('/').at(-1) || fileName
  return base.replace(/\.md$/, '')
}
