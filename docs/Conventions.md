# Paint Web - repo-specific conventions

The general rules are global and live outside this repo:

| File                                  | Covers                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| `~/.claude/conventions/Code.md`       | comments, file roles, calls take names, re-exports, done   |
| `~/.claude/conventions/TypeScript.md` | compiler, root imports, import order, Prettier              |
| `~/.claude/conventions/Frontend.md`   | component folders, SCSS/BEM, store, icons, i18n             |

Read those first. **This file holds only rules, and only the ones specific to
paint-web** - each one either refines a global rule or exists nowhere else. How the
repo is put together and where each piece lives is `README.md`.

All paths below are relative to the repo root, which is where the app lives. New
markdown documents go in `docs/`, named in PascalCase; `README.md` stays at the root
because that is where a reader looks for it.

---

## 1. Roots, constants and types

- **Eight root specifiers**: `assets`, `common`, `components`, `engine`, `hooks`,
  `locales`, `store`, `types`. A ninth is three edits, not one - `tsconfig.json`,
  `ROOT_DIRS` in `vite.config.ts`, and its `importOrder` entries in `.prettierrc`. A
  root missing from the last one is a bare specifier, and Prettier files it among the
  npm packages.
- **Do not collapse the two-entry `paths` pairs** in `tsconfig.json`. The comment there
  says why; it has been "tidied up" twice.
- **Every constant outside a component lives in `common/constant.ts`** - one file, not
  one per root. `engine/`, `hooks/` and `store/` have no constants file, and a function
  file next door exports functions and nothing else.
- `common/constant.ts` may import a **type** from any root and never a value: that is
  what keeps the layering intact. A browser probe in it is written
  `typeof window !== "undefined" && ...`, or the node tests fail with
  `window is not defined`.
- **A registry of live instances is not a constant.** `TOOLS` stays in
  `engine/tools/registry.ts`; moving it into `common/constant.ts` closes an import
  cycle on a class still being defined and `new FillTool()` throws.
- **Non-component types live in `types/<root>.types.ts`**, one file per root, imported
  back by root specifier (`types/engine.types`) - never `./types` or `../types`. A
  component keeps its own `types.ts` beside its code.
- `common/` stays free of React, of the store and of the engine.

---

## 2. Layers

```
src/engine/     no React import, ever. owns every bitmap.
src/store/      serializable scalars only.
src/components/ rendering.
```

- **`base` is never scaled by `devicePixelRatio`.** A 100x100 image would otherwise
  save as 200x200 on a retina screen.
- **No `willReadFrequently` on `base` or `preview`.** It pins the surface to the CPU
  and costs well over a hundred megabytes on a large document. Pixel reads get a small
  scratch canvas.
- **The engine owns the canvas bitmap size**, React only sets the css size. Resizing
  while keeping pixels needs a snapshot taken before `.width` is assigned, which an
  effect runs too late to do.
- **Zoom scales through css width plus `image-rendering: pixelated`**, never by
  redrawing `base`.
- **Nothing non-serializable reaches the store** - not bitmaps, not a
  `FileSystemFileHandle`, not a `File`. Those live in module state
  (`common/fileSession.ts`); the store holds what the UI renders from.

---

## 3. Engine and store wiring

- **One engine instance.** `engine/PaintEngine.ts` exports `paint`. Nothing else
  constructs a `Surface` or a `History`, and a component that needs pixels goes through
  `paint` rather than keeping its own.
- **The engine may import `store`, never `react-redux`.** That is why the typed hooks
  sit in `store/hooks.ts` instead of `store/index.ts`. Collapsing that split pulls React
  into the engine's module graph.
- **A tool reads its state from `ToolContext`.** No module-level `store` import inside
  `engine/tools/`; a tool dispatches through `ctx.dispatch`.
- **A tool calls `ctx.markDirty(rect)` before writing those pixels**, never after. That
  call is what copies the old pixels onto the undo stack.
- **Live pointer values go through `engine/cursor.ts`**, the external store the status
  bar subscribes to - not through a slice.

---

## 4. Strings

- **No user-visible string is written in a `.ts` or `.tsx` file.** Not in English, not
  in Vietnamese, and `constant.ts` is not an exception - a label table is interface,
  whatever it looks like. `src/locales/language.csv` is the only source; the JSON is
  generated and committed with it.
- Ids and enum values (`'pencil'`), css class names, hex colors, font names, format
  names such as `PNG` and developer-only log text stay as they are.
- **Prose follows the spelling the interface uses: `color`, not `colour`.** Identifiers
  and user-facing strings already do; a comment that spells it differently makes the
  same word ungreppable.
- **Rows sharing a prefix stay contiguous in the CSV**, label first, so a group reads
  as one block.
- **A constant table holds the key, not the text**: `labelKey`, `titleKey`,
  `shortcutKey`. State does too - `ui.toast` holds a key, which is what lets a notice
  already on screen follow a language change.
- **React reaches keys through `useTranslation()`; the engine goes through
  `translate()`.** A tool's history label is therefore a getter, not a field - a field
  freezes the text at module load.
- **A value containing a `;` is wrapped in double quotes** in the CSV, or the row
  splits into extra columns. That silently put English text in `vi.json` once.
- **A mark the interface needs is an icon, never a character** - in a string, in the
  CSV or in JSX.
- `yarn check:i18n` runs alongside `yarn typecheck` before work is called done.

---

## 5. Icons

- **Every glyph is registered once** in `src/components/Icon/constant.ts` and used
  through `<Icon name="..." />`.
- **Class names are generated from the packages, never hand-typed.** `faVectorSquare`
  resolves to `fa-draw-square`, and aliases like that are why.
- **`main.tsx` imports only the styles in use** (`solid`, `regular`). `all.css` pulls
  every family, and each extra style is another ~300 kB font file - check whether a
  `solid` glyph will do first.
- **`Icon` sets `font-size` and nothing else.** A fixed `width` does not scale a
  webfont glyph; it just lets wide glyphs spill over the label.
- **Every glyph must exist in Font Awesome Free.** The Pro packages were dropped, and a
  Pro-only name renders as a blank box - check the free metadata before registering one.
- **A canvas cursor takes path data** from `@fortawesome/free-solid-svg-icons`, and only
  the solid style of that package is installed.
- **Hand-written SVG is for outlines that must be exact** - the 23 gallery shapes, the
  app icons. Everything else comes from the registry.
- **Never extract or reuse artwork from Microsoft binaries.**

---

## 6. Untyped browser APIs and overlays

- **An API `lib.dom` does not declare is an ordinary interface in
  `types/common.types.ts`**, reached with one cast at the call site - not an ambient
  `.d.ts` that widens `Window`. That keeps a missing feature a runtime check rather
  than a silent `undefined` call. The single ambient declaration is `engine/gifenc.d.ts`,
  because `gifenc` ships no types at all.
- **Every overlay takes its `z-index` from a token** in `styles/tokens.scss`. A
  hard-coded `z-index` is how the Save as flyout ended up hidden behind the backstage.

---

## 7. A control with no behavior is disabled

The ribbon and the backstage are built from the full Paint design long before the
features behind them exist. Every control that does nothing yet carries `disabled`, so
the app never invites a click into a void.

**Derive it, do not list it.** Anything tool-shaped reads `engine/tools/registry`,
which is the real answer to "does this draw yet":

```tsx
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
disabled={!IMPLEMENTED[tool.id]}
```

Only a feature with nothing to derive from gets a literal `disabled` or a `pending`
flag in its constant table.

**Disabled has to look disabled, and that is easy to get wrong.** `reset.scss` sets
`button:disabled { color: #a0a0a0 }`, which only reaches what inherits color. Two
habits break it:

- an icon with a hard-coded color. `ShapeIcon` uses `stroke="currentColor"`, and an
  icon wrapper takes `color: var(--rb-ink)` rather than a literal gray.
- a `&:hover` without `:not(:disabled)`, which keeps lighting a dead button up.

A block redefines `--rb-ink` on its own `&:disabled` and the glyph inherits it, which
is how the rule stays flat instead of needing a descendant selector. `.ribbon-split__top`
and `.ribbon-split__bottom` are not `.ribbon-btn` and carry their own copy.

**Do not paint a selected state on a disabled control.** A grayed-out gallery with one
cell still highlighted reads as a live choice.

---

## 8. Tests

- **Vitest is pinned to 2.x**: 3.x needs Vite 6 and this repo is on Vite 5. Bumping one
  means bumping the other.
- **Config lives in `vite.config.ts`**, not a second file, so tests resolve the root
  imports through the same alias list the app uses.
- **`environment: "node"`.** jsdom carries no canvas, so a DOM environment widens the
  surface without covering a single pixel. Anything needing a real canvas is an
  end-to-end test, not a unit one.
- **A unit test sits beside what it tests**, as `<name>.test.ts`. `describe` and `it`
  are imported from `vitest`; globals stay off.
- **Prefer a hand-written stand-in over a mocking framework.**
- **Visual specs live in `tests/`, outside `src/`**, so a spec never reaches
  `yarn typecheck`, the build, or vitest's `src/**/*.test.ts`.
- **Every screen is captured in both languages.** Vietnamese runs longer than English,
  and a clipped label is exactly what a screenshot catches and a unit test cannot.
- **The allowance is 40 pixels, not a percentage.** A tenth of a percent of a
  1280x688 panel is some 900 pixels of license: renaming a menu row from "About Paint"
  to "About Paint Web" moved 53 and passed. The ratio stays as a second bound for a
  bigger capture; the absolute count is what holds.
- **Baselines are committed, and re-blessed only after looking at the diff.**
  `yarn test:visual:update` is never a reflex.

---

## 9. Formatting runs in two passes

`yarn format` is `prettier --write` followed by `scripts/wrap-members.mjs`, and the
order is load-bearing - `TypeScript.md` explains why the member-count rule cannot be a
Prettier option. Two consequences are local to this repo:

- **Do not run bare `prettier --write`**, and do not point an editor's format-on-save at
  Prettier alone. Both re-join four-member lists. `yarn format` is the entry point.
- **Do not add `prettier --check` to CI.** It would fail on exactly the lines the second
  pass exists to produce. `yarn check:format` is the check that belongs there.
