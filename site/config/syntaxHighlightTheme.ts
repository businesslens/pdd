import type { SyntaxThemePalette } from '../app/utils/syntaxTheme'
import { BRAND_WARM_SYNTAX_PALETTE } from '../app/utils/syntaxTheme'

interface ThemeRule {
  scope?: string | string[]
  settings: {
    foreground?: string
    background?: string
    fontStyle?: string
  }
}

interface SyntaxHighlightTheme {
  name: string
  type: 'light'
  colors: Record<string, string>
  tokenColors: ThemeRule[]
}

/**
 * The site's fixed light Shiki theme. Dark mode remains Palenight in the Nuxt
 * configuration; this theme owns only the warm light surface selected here.
 */
export function pddKitSyntaxHighlightTheme(
  palette: SyntaxThemePalette = BRAND_WARM_SYNTAX_PALETTE
): SyntaxHighlightTheme {
  return {
    name: 'pdd-kit-brand-warm',
    type: 'light',
    colors: {
      'editor.background': '#faf8f4',
      'editor.foreground': palette.plain
    },
    tokenColors: [
      { settings: { foreground: palette.plain } },
      {
        scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
        settings: { foreground: palette.comment, fontStyle: 'italic' }
      },
      {
        scope: ['entity.name.function.call.shell', 'entity.name.command.shell'],
        settings: { foreground: palette.command }
      },
      {
        scope: 'string.unquoted.argument.shell',
        settings: { foreground: palette.argument }
      },
      {
        scope: [
          'constant',
          'entity.name.constant',
          'variable.other.constant',
          'variable.other.enummember',
          'variable.language',
          'support',
          'support.constant',
          'support.variable',
          'meta.property-name',
          'meta.module-reference',
          'entity.name.tag.yaml'
        ],
        settings: { foreground: palette.key }
      },
      {
        scope: [
          'entity.name',
          'entity.name.function',
          'meta.export.default',
          'meta.definition.variable',
          'variable'
        ],
        settings: { foreground: palette.command }
      },
      {
        scope: ['entity.name.tag', 'support.class.component'],
        settings: { foreground: palette.string }
      },
      {
        scope: ['keyword', 'storage', 'storage.type'],
        settings: { foreground: palette.key }
      },
      {
        scope: [
          'string',
          'source.regexp',
          'string.regexp',
          'constant.other.reference.link',
          'string.other.link'
        ],
        settings: { foreground: palette.string }
      },
      {
        scope: ['punctuation', 'constant.other.symbol'],
        settings: { foreground: palette.punctuation }
      },
      {
        scope: 'variable.other',
        settings: { foreground: palette.plain }
      },
      {
        scope: ['markup.heading', 'markup.heading entity.name'],
        settings: { foreground: palette.key, fontStyle: 'bold' }
      },
      {
        scope: 'markup.quote',
        settings: { foreground: palette.string }
      },
      {
        scope: 'markup.italic',
        settings: { foreground: palette.plain, fontStyle: 'italic' }
      },
      {
        scope: 'markup.bold',
        settings: { foreground: palette.plain, fontStyle: 'bold' }
      },
      {
        scope: ['markup.underline'],
        settings: { fontStyle: 'underline' }
      },
      {
        scope: ['markup.strikethrough'],
        settings: { fontStyle: 'strikethrough' }
      },
      {
        scope: ['invalid', 'message.error', 'brackethighlighter.unmatched'],
        settings: { foreground: palette.command, fontStyle: 'italic' }
      }
    ]
  }
}
