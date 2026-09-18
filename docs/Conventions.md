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

---

## 2. Layers

```
src/engine/     no React import, ever. owns every bitmap.
src/store/      serializable scalars only.
src/components/ rendering.
```

`src/engine/Surface.ts` drives the three stacked canvases: `base` holds the committed
bitmap at true image resolution, `preview` the stroke in progress at the same size,
`overlay` the screen-space chrome in device pixels.

Three constraints that are easy to get wrong:

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

## 3. Icons

UI icons are **Font Awesome Pro** (license held, token in `~/.npmrc`), registered in
`src/components/Icon/constant.ts`.

The 23 shapes in the Shapes gallery are **hand-written SVG geometry** in
`src/components/ShapeIcon/constant.tsx`. They are the outlines the user actually draws
and must be exact; FA carries no right triangle, rounded rectangle, curve, four- or
six-point star, or the three callout shapes.

**Never extract or reuse artwork from Microsoft binaries.**

---

## 4. Locales

`en` and `vi` in `src/locales/`, CSV to JSON, per the global i18n layout. The generate
script emits JSON only - no xlsx branch.

---

## 5. Commands

```sh
cd frontend
yarn dev           # http://localhost:5173
yarn format        # prettier over src, import order included
yarn typecheck     # must print nothing
yarn build         # typecheck then build, no warnings
```
