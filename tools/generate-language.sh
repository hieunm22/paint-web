#!/usr/bin/env bash
# language.csv -> frontend/src/locales/{en,vi}.json. run: ./tools/generate-language.sh
set -euo pipefail

python3 "$(dirname "$0")/convert-to-json.py"
