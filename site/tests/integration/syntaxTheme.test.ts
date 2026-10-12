import { describe, expect, it } from 'vitest'
import {
  pddKitAgentCommandLines,
  syntaxCommandTokens
} from '../../app/utils/syntaxCommandTokens'
import {
  BRAND_WARM_MINIMUM_CONTRAST,
  BRAND_WARM_SYNTAX_PALETTE
} from '../../app/utils/syntaxTheme'

const CODE_SURFACE = '#f8f2e5'

function luminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)!.map(channel => Number.parseInt(channel, 16) / 255)
  const [red, green, blue] = channels.map(value =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}

describe('Brand Warm syntax theme', () => {
  it('keeps every light token at the stronger seven-to-one contrast floor', () => {
    const ratios = Object.values(BRAND_WARM_SYNTAX_PALETTE)
      .map(color => contrast(color, CODE_SURFACE))
    const minimum = Math.min(...ratios)

    expect(minimum).toBeGreaterThanOrEqual(7)
    expect(minimum).toBeCloseTo(BRAND_WARM_MINIMUM_CONTRAST, 2)
  })

  it('recognizes agent invocations without treating every text fence as a command', () => {
    expect(syntaxCommandTokens('/pdd-verify current')).toEqual([
      { role: 'executable', text: '/pdd-verify' },
      { role: 'arguments', text: ' current' }
    ])
    expect(pddKitAgentCommandLines('/pdd-map', 'text')?.[0]?.parts).toEqual([
      { role: 'executable', text: '/pdd-map' }
    ])
    expect(pddKitAgentCommandLines([
      '/pdd-verify current',
      '/pdd-verify report only'
    ].join('\n'), 'text')).toHaveLength(2)

    expect(pddKitAgentCommandLines('/pdd-map', 'bash')).toBeNull()
    expect(pddKitAgentCommandLines('ideate → implement → verify', 'text')).toBeNull()
    expect(pddKitAgentCommandLines('GET /api/v1/blueprints/:slug', 'text')).toBeNull()
  })

  it('preserves the exact command-fence source while splitting its color roles', () => {
    const source = '  /pdd-map  \r\n/pdd-verify current\n'
    const lines = pddKitAgentCommandLines(source, 'text')!
    const rendered = lines.flatMap(line => line.parts).map(part => part.text).join('')

    expect(rendered).toBe(source)
    expect(lines).toHaveLength(2)
    expect(lines[1]!.parts.filter(part => part.role)).toEqual([
      { role: 'executable', text: '/pdd-verify' },
      { role: 'arguments', text: ' current' }
    ])
  })
})
