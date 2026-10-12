import { describe, expect, it, vi } from 'vitest'
import { fetchGithubStars, formatStarCount } from '../../app/utils/github'

describe('GitHub repository utilities', () => {
  it('formats star counts compactly', () => {
    expect(formatStarCount(0)).toBe('0')
    expect(formatStarCount(42)).toBe('42')
    expect(formatStarCount(1234)).toBe('1.2k')
    expect(formatStarCount(48213)).toBe('48.2k')
    expect(formatStarCount(1_200_000)).toBe('1.2m')
  })

  it('rejects invalid star counts', () => {
    expect(formatStarCount(-1)).toBeNull()
    expect(formatStarCount(Number.NaN)).toBeNull()
  })

  it('reads the star count from GitHub and gives up quietly', async () => {
    const answer = (body: unknown, status = 200) => vi.fn(async () => Response.json(body, { status })) as unknown as typeof fetch
    expect(await fetchGithubStars(answer({ stargazers_count: 13 }))).toBe(13)
    expect(await fetchGithubStars(answer({ message: 'rate limited' }, 403))).toBeNull()
    expect(await fetchGithubStars(answer({ stargazers_count: -1 }))).toBeNull()
    expect(await fetchGithubStars(vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch)).toBeNull()
  })
})
