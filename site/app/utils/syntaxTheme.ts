export interface SyntaxThemePalette {
  command: string
  argument: string
  key: string
  string: string
  punctuation: string
  comment: string
  plain: string
}

/** The selected light syntax palette for docs and landing commands. */
export const BRAND_WARM_SYNTAX_PALETTE: SyntaxThemePalette = {
  command: '#972600',
  argument: '#1d5700',
  key: '#00585f',
  string: '#6e3500',
  punctuation: '#362b1d',
  comment: '#4c3e2b',
  plain: '#362b1d'
}

/** Lowest palette contrast measured on the docs code surface, `#f8f2e5`. */
export const BRAND_WARM_MINIMUM_CONTRAST = 7.26

export const BRAND_WARM_COMMAND_TOKEN_COLORS = {
  executable: BRAND_WARM_SYNTAX_PALETTE.command,
  arguments: BRAND_WARM_SYNTAX_PALETTE.argument
} as const
