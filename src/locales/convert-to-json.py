#!/usr/bin/env python3
"""Turn language.csv into one JSON file per locale column.

Source of truth is the CSV next to this script; the JSON files it writes into
the app are generated and must not be edited by hand. Standard library only -
no venv, no pip install.
"""

import csv
import json
import os
import sys
import unicodedata

DELIMITER = ";"

# csv header column -> emitted <locale>.json
LOCALES = {"English": "en", "Vietnamese": "vi"}

# the json lands beside this script, which is also where the csv lives
OUTPUT_DIR = "."

# keys read <area>.<group>.<element> - no more, no fewer
KEY_DEPTH = 3


# the one symbol that survived the typeable-characters rule
DEGREE_SIGN = "\u00b0"


def check_typeable(line, key, column, value):
    """Reject a character nobody can type straight off a keyboard.

    Letters pass whatever the language: Vietnamese diacritics are typed with a
    Vietnamese input method. Symbols do not - an interface glyph is an icon.
    """
    for char in value:
        if " " <= char <= "~" or char == DEGREE_SIGN:
            continue
        if unicodedata.category(char)[0] in ("L", "M"):
            continue
        name = unicodedata.name(char, "unnamed")
        raise SystemExit(
            f"line {line}: '{key}' {column} uses U+{ord(char):04X} {name} - "
            "only characters a keyboard types directly belong here"
        )


def nest(flat):
    """Split dotted keys into nested objects."""
    root = {}
    for key, value in flat.items():
        parts = key.split(".")
        if len(parts) != KEY_DEPTH:
            raise SystemExit(
                f"key '{key}' has {len(parts)} levels, expected {KEY_DEPTH}"
            )
        node = root
        for part in parts[:-1]:
            branch = node.setdefault(part, {})
            if not isinstance(branch, dict):
                raise SystemExit(f"key '{key}' collides with a shorter key")
            node = branch
        if parts[-1] in node:
            raise SystemExit(f"key '{key}' collides with a longer key")
        node[parts[-1]] = value
    return root


def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle, delimiter=DELIMITER)
        header = next(reader)
        missing = [name for name in LOCALES if name not in header]
        if missing:
            raise SystemExit(f"language.csv is missing columns: {missing}")
        columns = {name: header.index(name) for name in LOCALES}

        tables = {name: {} for name in LOCALES}
        seen = set()
        for line, row in enumerate(reader, start=2):
            if not row or not row[0].strip():
                continue
            if len(row) != len(header):
                raise SystemExit(
                    f"line {line}: {len(row)} columns, expected {len(header)} - "
                    "a value holding a ';' must be wrapped in double quotes"
                )
            key = row[0].strip()
            if key in seen:
                raise SystemExit(f"line {line}: duplicate key '{key}'")
            seen.add(key)
            for name, index in columns.items():
                if index >= len(row) or not row[index]:
                    raise SystemExit(f"line {line}: '{key}' has no {name} text")
                check_typeable(line, key, name, row[index])
                tables[name][key] = row[index]
        return tables


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    tables = read_rows(os.path.join(here, "language.csv"))
    out_dir = os.path.normpath(os.path.join(here, OUTPUT_DIR))
    if not os.path.isdir(out_dir):
        raise SystemExit(f"output folder not found: {out_dir}")

    for name, locale in LOCALES.items():
        target = os.path.join(out_dir, f"{locale}.json")
        with open(target, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(nest(tables[name]), handle, ensure_ascii=False, indent="\t")
            handle.write("\n")
        print(f"{locale}.json  <-  {len(tables[name])} keys", file=sys.stderr)


if __name__ == "__main__":
    main()
