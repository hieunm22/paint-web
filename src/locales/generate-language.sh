#!/usr/bin/env bash
# language.csv -> {en,vi}.json, all in this folder. run: yarn i18n
set -euo pipefail

python3 "$(dirname "$0")/convert-to-json.py"
