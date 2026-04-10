#!/usr/bin/env bash
# Hook: post-edit-check.sh
# Uruchamiany asynchronicznie po każdej edycji pliku.
# Sprawdza YAML workflows jeśli plik .yml był edytowany.
# NIE blokuje pracy — async: true.

set -euo pipefail

CHANGED_FILE="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"

if [[ "$CHANGED_FILE" == *".github/workflows/"* && "$CHANGED_FILE" == *".yml" ]]; then
  if python3 -c "
import yaml, sys
try:
    with open('$CHANGED_FILE') as f:
        yaml.safe_load(f.read())
    print('YAML OK: $CHANGED_FILE')
except Exception as e:
    print(f'YAML ERROR w $CHANGED_FILE: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1; then
    :
  else
    echo "OSTRZEZENIE: Wykryto blad YAML w $CHANGED_FILE" >&2
  fi
fi

exit 0
