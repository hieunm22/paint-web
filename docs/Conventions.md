# Paint Web - repo-specific conventions

The general conventions are global and live outside this repo:

| File                                  | Covers                                          |
| ------------------------------------- | ----------------------------------------------- |
| `~/.claude/conventions/Code.md`       | comments, file roles, re-exports, done-criteria |
| `~/.claude/conventions/TypeScript.md` | compiler, root imports, import order, Prettier  |
| `~/.claude/conventions/Frontend.md`   | component folders, SCSS/BEM, store, icons, i18n |

Read those first. This file records only what is specific to paint-web, and it
refines the global rules rather than contradicting them.

**All paths below are relative to `frontend/`.** The repo root holds documentation
only; the app, its `package.json`, `tsconfig.json` and `vite.config.ts` all live in
`frontend/`. Run every command from there.

New markdown documents go in `docs/`, named in PascalCase. `README.md` and `DESIGN.md`
stay at the root because that is where a reader looks for them; nothing else joins them.

---

## 1. The six root imports

```
components/  hooks/  engine/  store/  common/  assets/
```

Declared in **both** `tsconfig.json` and `vite.config.ts`. `vite.config.ts` derives
them from one `ROOT_DIRS` array; adding a seventh root means editing both files.
`src/types/` does not exist yet - its import-order group is reserved.

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

## 4. Icons

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

The 23 shapes in the Shapes gallery are **hand-written SVG geometry** in
`src/components/ShapeIcon/constant.tsx`. They are the outlines the user actually draws
and must be exact; FA carries no right triangle, rounded rectangle, curve, four- or
six-point star, or the three callout shapes.

**Never extract or reuse artwork from Microsoft binaries.**

---

## 5. Locales

`en` and `vi` in `src/locales/`, CSV to JSON, per the global i18n layout. The generate
script emits JSON only - no xlsx branch.

---

## 6. Commands

```sh
cd frontend
yarn dev           # http://localhost:3004
yarn format        # prettier over src, import order included
yarn typecheck     # must print nothing
yarn build         # typecheck then build, no warnings
```
