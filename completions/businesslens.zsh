#compdef businesslens
# businesslens completion for zsh. Print it with `businesslens completion zsh`.
# Candidates come from the installed CLI on every Tab: `businesslens __complete`
# reads its own command tree, offline, and runs nothing.
_businesslens() {
  local -a lines described
  local out directive line value extension
  out=$(businesslens __complete "${(@Q)words[2,CURRENT]}" 2>/dev/null) || return 1
  lines=("${(@f)out}")
  directive=${lines[-1]}
  lines=("${(@)lines[1,-2]}")
  [[ $PREFIX == --*=* ]] && compset -P '*='
  case $directive in
    :directories) _path_files -/; return ;;
    :files:*) extension=${directive#:files:}; _files -g "*${extension}(-.)"; return ;;
    :files) _files; return ;;
  esac
  for line in $lines; do
    value=${line%%$'\t'*}
    value=${value//:/\\:}
    if [[ $line == *$'\t'* ]]; then
      described+=("$value:${line#*$'\t'}")
    else
      described+=("$value")
    fi
  done
  (( ${#described} )) && _describe -t values businesslens described
}
if [[ ${zsh_eval_context[-1]} == loadautofunc ]]; then
  _businesslens "$@"
else
  compdef _businesslens businesslens
fi
