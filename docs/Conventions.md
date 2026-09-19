# Paint Web - repo-specific conventions

The general conventions are global and live outside this repo:

| File                                  | Covers                                          |
| ------------------------------------- | ----------------------------------------------- |
| `~/.claude/conventions/Code.md`       | comments, file roles, re-exports, done-criteria |
| `~/.claude/conventions/TypeScript.md` | compiler, root imports, import order, Prettier  |
| `~/.claude/conventions/Frontend.md`   | component folders, SCSS/BEM, store, icons, i18n |

Read those first. This file records only what is specific to paint-web, and it
refines the global rules rather than contradicting them.

**All paths below are relative to `frontend/`.** The app, its `package.json`,
`tsconfig.json` and `vite.config.ts` all live in `frontend/`; run every command from
there. The repo root holds documentation plus `tools/`, the translation pipeline,
which is the one exception and is spelled out with a full path where it appears.

New markdown documents go in `docs/`, named in PascalCase. `README.md` and `DESIGN.md`
stay at the root because that is where a reader looks for them; nothing else joins them.

---

## 1. The seven root imports

```
components/  hooks/  engine/  locales/  store/  common/  assets/
```

Declared in **both** `tsconfig.json` and `vite.config.ts`. `vite.config.ts` derives
them from one `ROOT_DIRS` array. Adding an eighth root means editing both files **and**
adding an `importOrder` entry to `.prettierrc`: an unlisted root is a bare specifier
like any other, and Prettier sorts it in among the npm packages. `src/types/` does not
exist yet - its import-order group is reserved.

The two-entry `paths` trap is documented globally and as a comment inside
`tsconfig.json`. Do not "tidy up" those pairs.

`common/` holds what several folders need and no single one owns - platform
quirks such as "is this a Mac", "was that the right mouse button". It stays
free of React, of the store and of the engine.

---

## 2. Layers

```
src/engine/     no React import, ever. owns every bitmap.
src/store/      serializable scalars only.
src/components/ rendering.
```

`src/engine/Surface.ts` owns the three stacked canvases (DESIGN.md §4.2 says what each
one holds). Three constraints on touching them, all easy to get wrong:

- **`base` is never scaled by `devicePixelRatio`.** A 100x100 image would otherwise
  save as 200x200 on a retina screen.
- **No `willReadFrequently` on `base` or `preview`.** It pins the surface to the CPU
  and costs well over a hundred megabytes on a large document. Pixel reads get a small
  scratch canvas.
- **The engine owns the canvas bitmap size**, React only sets the css size. Resizing
  while preserving pixels needs a snapshot taken before `.width` is assigned, which an
  effect runs too late to do.

Zoom scales through css width on the canvas plus `image-rendering: pixelated`, never
by redrawing `base`.

---

## 3. Engine and store wiring

Rules for writing a file under `src/engine/`. What the pieces do at runtime is
DESIGN.md §4 and §11; this section only covers where code goes and what it may reach.

- **One engine instance.** `engine/PaintEngine.ts` exports `paint`. Nothing else
  constructs a `Surface` or a `History`, and a component that needs pixels goes
  through `paint` rather than keeping its own.
- **The engine may import `store`, never `react-redux`.** That is the whole reason the
  typed hooks sit in `store/hooks.ts` instead of `store/index.ts`. The split is
  load-bearing; collapsing it pulls React into the engine's module graph.
- **A tool reads its state from `ToolContext`.** No module-level `store` import inside
  `engine/tools/`: colours, size and zoom arrive on the context, and a tool dispatches
  through `ctx.dispatch`.
- **A tool calls `ctx.markDirty(rect)` before writing those pixels**, never after. That
  call is what copies the old pixels onto the undo stack.
- **Live pointer values go through `engine/cursor.ts`**, the external store the status
  bar subscribes to - not through a slice.
- **Engine types live in `engine/types.ts`**, tool interfaces included. DESIGN.md's tree
  sketches a `tools/Tool.ts`; one types file per non-component folder wins, and
  `engine/tools/` holds implementations only.

---

## 4. Tests

Vitest, pinned to **2.x**: 3.x and later need Vite 6, and this repo is on Vite 5.
Bumping one means bumping the other.

- Config lives in `vite.config.ts`, not a second file, so tests resolve the seven root
  imports through the same alias list the app uses.
- `environment: "node"`. jsdom carries no canvas, so a DOM environment would widen the
  surface without covering a single pixel. Anything needing a real canvas is an
  end-to-end test, not a unit one.
- A test sits beside what it tests, as `<name>.test.ts`. Component folders keep their
  fixed file list, so a test for one goes in a `components/<Name>/` sibling only once
  that folder actually has a test to hold.
- `describe` and `it` are imported from `vitest`; globals stay off, which keeps
  `tsconfig.json` free of a `types` entry.
- Prefer a hand-written stand-in over a mocking framework. `History.test.ts` drives the
  real class through a flat pixel array, because `Surface` is only asked for a size and
  for boxes of pixels.

---

## 5. Icons

UI icons are **Font Awesome Pro** (license held, token in `~/.npmrc`), registered in
`src/components/Icon/constant.ts`.

They use the **webfont**, not the SVG components. Consequences to respect:

- `main.tsx` imports `fontawesome.css` plus only the style files in use (`solid`,
  `regular`). `all.css` would pull every Pro family.
- Adding an icon in a third style means a third CSS import and another ~300 kB font
  file. Check whether a `solid` glyph will do first.
- `Icon` sets `font-size` and nothing else. A fixed `width` does not scale a glyph
  the way it scaled the SVG; it just lets wide glyphs spill over the label.
- Class names are generated from the packages, never hand-typed. `faVectorSquare`
  resolves to `fa-draw-square`, and aliases like that are why.
- A button takes a webfont class from `ICONS`; anything drawn onto a canvas takes path
  data from `@fortawesome/pro-solid-svg-icons`. Only the solid style of that package is
  installed, so a cursor in another style means adding a package first.

The 23 shapes in the Shapes gallery are **hand-written SVG geometry** in
`src/components/ShapeIcon/constant.tsx`. They are the outlines the user actually draws
and must be exact; FA carries no right triangle, rounded rectangle, curve, four- or
six-point star, or the three callout shapes.

**Never extract or reuse artwork from Microsoft binaries.**

---

## 6. Locales

`en` and `vi`, CSV to JSON, per the global i18n layout with one difference: the
pipeline sits at the repo root rather than inside `src/`, because the CSV and its
generator are tooling and the app only ever consumes the JSON.

```
tools/                        # repo root, outside the app
├─ language.csv               # SOURCE OF TRUTH - edit only this
├─ convert-to-json.py         # python3 stdlib only, no venv
└─ generate-language.sh       # run: ./tools/generate-language.sh, or yarn i18n

frontend/src/locales/
├─ en.json  vi.json           # GENERATED - never edit by hand
├─ i18n.ts                    # init, fallback locale, localStorage key "language"
├─ translate.ts               # non-hook helper for code outside React
├─ common.ts  constant.ts  types.ts
```

The generate script emits JSON only - no xlsx branch. Commit the CSV and the JSON
together: `i18n.ts` imports the JSON, so Vite needs it at build time.

Placeholders are written `{0}`, `{1}`, which is why `i18n.ts` overrides i18next's
`{{ }}` interpolation delimiters.

**No user-visible string is written in a `.ts` or `.tsx` file.** Not in English, not in
Vietnamese, and `constant.ts` is not an exception - a label table is interface, whatever
it looks like. Button and group labels, `title`, `aria-label`, menu items and the
shortcut shown beside them, dialog titles and buttons, status bar units, the default
document name and a tool's history label all come from a key.

Ids and enum values (`'pencil'`), css class names, hex colours, font names, format names
such as `PNG`, and developer-only log text stay as they are.

Keys read `<area>.<group>.<element>` - **exactly three levels, never two or four** -
and follow the interface rather than the folder tree. A group's own caption is
`<area>.<group>.label`, which is why there is no `ribbon.group.*` namespace and no
`ribbon.home.*` tab level: the tab a group sits on is not part of its identity.

Rows sharing a prefix stay contiguous in `language.csv`, label first, so a group reads
as one block. The generator refuses any key that is not three levels deep.

A constant table holds the key, not the text: `labelKey`, `titleKey`, `shortcutKey`,
and the component translates at render. The same goes for state: `ui.toast` holds a
key, never a sentence, which is what lets a notice already on screen follow a language
change.

React reaches keys through `useTranslation()`; the engine, which must not import
`react-i18next`, goes through `translate()`. A tool's history label is therefore a
getter, not a field - a field would freeze the text at module load.

`yarn check:i18n` (`scripts/check-i18n.mjs`) parses every `.ts`/`.tsx` with the
TypeScript compiler API and fails on five things: JSX prose, a literal passed to
`label`, `title`, `aria-label`, `shortcut`, `placeholder` or `note`, any Vietnamese
character, any character outside printable ASCII apart from `°`, and a key-shaped
literal that `en.json` does not define - which is what catches a typo or a rename that
missed a call site. Its exemption list lives in the script, each entry with a reason.
Run it alongside `typecheck` before calling work done.

The same character rule is enforced on the CSV itself by `convert-to-json.py`, which is
where user-visible text actually lives; `yarn i18n` refuses a row and names the
codepoint. Letters pass in any language - Vietnamese diacritics are typed directly -
and only symbols are rejected. A mark the interface needs (a tick, a caret, an axis
arrow, the minus on the zoom button) goes in `components/Icon/constant.ts` and renders
through `<Icon>`, never as a literal in a string or in JSX.

A value containing a `;` **must** be wrapped in double quotes, or the CSV splits it
into extra columns. That silently put English text in `vi.json` once; the generator
now counts columns per row and stops.

---

## 7. File I/O, overlays and untyped browser APIs

### Where the pieces live

```
common/format.ts      # mime, extensions, picker accept maps - no engine, no store
common/fileSystem.ts  # pickers, handle writes, download fallback, permissions
common/fileSession.ts # the open file's handle, and a file parked behind a dialog
common/recents.ts     # IndexedDB rows for the backstage list
engine/codec.ts       # encode and decode against the surface's pixels
engine/bmp.ts         # 24-bit BMP, written by hand
engine/gif.worker.ts  # quantise plus encode, off the main thread
hooks/useFileCommands.ts  # the one place New, Open, Save and Paste are wired
```

The format table sits in `common/` rather than beside the encoders because `common/`
may not import the engine, and `common/fileSystem.ts` needs the extensions to build a
picker. `engine/codec.ts` imports down into `common/`; nothing goes the other way.

### Non-serializable file state never reaches the store

Same rule as bitmaps, for the same reason. A `FileSystemFileHandle` and a `File` are
not serializable and nothing renders from either, so they live in
`common/fileSession.ts` as module state. The store holds `fileName`, `format`,
`isDirty` and `savedAt` - what the title bar and Properties actually read. Adding a
handle to a slice would mean maintaining `serializableCheck.ignoredPaths`,
`ignoredActions` and `immutableCheck.ignoredPaths` forever; the module is cheaper.

A command that has to ask before it destroys the document parks its payload with
`deferOpen` and puts the *kind* of command in `ui.pending`. The dialog answers, and
`resume()` picks the payload back up.

### Untyped browser APIs

`showOpenFilePicker`, `showSaveFilePicker` and `FileSystemHandle.queryPermission` are
not in `lib.dom`. They are declared as ordinary interfaces in `common/types.ts` and
reached with one cast at the call site - **not** with an ambient `.d.ts` that widens
`Window` globally. That keeps the declarations in a types file where the rest of the
repo's types are, and keeps a missing feature a runtime check rather than a silent
`undefined` call.

The single ambient declaration in the repo is `engine/gifenc.d.ts`, because `gifenc`
ships no types at all and a `declare module` is the only way to type a package.

### Stacking order

Every overlay reads its `z-index` from a token in `styles/tokens.scss`:

| Token            | Value | Layer                           |
| ---------------- | ----- | ------------------------------- |
| `--z-backstage`  | 60    | File tab panel                  |
| `--z-menu`       | 70    | any portalled dropdown          |
| `--z-toast`      | 80    | transient notice                |
| `--z-dialog`     | 100   | modal dialogs                   |

Menus sit **above** the backstage: the Save as flyout is opened from inside it, and a
lower menu layer hid it completely. A new overlay takes a token; a hard-coded
`z-index` outside this table is a bug waiting to repeat that one.

### Save behaves differently per browser

`CAN_SAVE_IN_PLACE` is the switch. With the File System Access API, Save overwrites
through a handle and Save as goes through the native picker. Without it, both end in
a download and the backstage Save row grows a tooltip saying so. The recents list only
records rows that carry a handle, so on Firefox and Safari it stays empty rather than
filling with entries that cannot be reopened.

---

## 8. A control with no behaviour is disabled

The ribbon and the backstage are built from the full Paint design long before the
features behind them exist. Every control that does nothing yet carries `disabled`, so
the app never invites a click into a void.

**Derive it, do not list it.** Anything tool-shaped reads
`engine/tools/registry`, which is the real answer to "does this draw yet":

```tsx
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
disabled={!IMPLEMENTED[tool.id]}
```

Tools, brushes, shapes and selection all gate this way, so adding `ShapeTool` to the
registry lights the whole Shapes gallery up with no change in `components/`. Only a
feature with nothing to derive from - Print, From camera - gets a literal `disabled` or
a `pending` flag in its constant table.

**Disabled has to look disabled, and that is easy to get wrong.** `reset.scss` sets
`button:disabled { color: #a0a0a0 }`, which only reaches things that inherit colour.
Two habits break it:

- an icon with a hard-coded colour. `ShapeIcon` must use `stroke="currentColor"`, and
  an icon wrapper takes `color: var(--rb-ink)` rather than a literal grey.
- a `&:hover` without `:not(:disabled)`, which keeps lighting a dead button up.

The ink is a pair of tokens, `--rb-ink` and `--rb-ink-disabled`. A block redefines
`--rb-ink` on its own `&:disabled` and the glyph inside inherits it, which is how the
rule stays flat instead of needing a `.block:disabled .block__icon` descendant
selector. `.ribbon-split__top` and `.ribbon-split__bottom` are not `.ribbon-btn`, so
they carry their own copy of that rule - a split button was the one control that stayed
black after the first pass.

Do not paint a selected state on a disabled control either. A greyed-out gallery with
one cell still highlighted reads as a live choice.

---

## 9. Formatting runs in two passes

`yarn format` is `prettier --write` followed by `scripts/wrap-members.mjs`, and the
order is load-bearing. Prettier decides line breaks by column count; the member-count
rule for imports, exports and destructuring cannot be written as a Prettier option, and
Prettier rejoins any list it thinks fits. The second pass breaks those lists back apart
using the TypeScript compiler API, so it has to go last.

Consequences:

- **Do not run bare `prettier --write`**, and do not point an editor's format-on-save at
  Prettier alone - both re-join four-member lists. `yarn format` is the entry point.
- **Do not add `prettier --check` to CI.** It would fail on exactly the lines the second
  pass is there to produce. `yarn check:format` is the check that belongs there, and it
  reports file and line without writing.
- The pass is idempotent and skips a list that already spans lines, so running it twice
  changes nothing.

---

## 10. Commands

```sh
cd frontend
yarn dev           # http://localhost:3004
yarn format        # prettier over src, import order included, then wrap-members
yarn test          # vitest, one pass
yarn test:watch    # vitest, watching
yarn typecheck     # must print nothing
yarn check:format  # every list of more than three members is wrapped
yarn check:i18n    # no hard-coded user-visible strings
yarn i18n          # language.csv -> src/locales/{en,vi}.json
yarn build         # typecheck then build, no warnings
```
