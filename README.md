# paint-web

A web clone of Microsoft Paint (Windows 10, Ribbon UI), built with React and
TypeScript. Everything runs client-side - no backend, and images never leave the
browser.

Status: the UI shell is complete and phase P0 of the roadmap is done. Drawing is not
wired up yet; most ribbon buttons still change state without changing pixels.

## Layout

```
paint-web/
├─ README.md
├─ DESIGN.md              # product spec and roadmap
├─ docs/
│  └─ Conventions.md      # repo-specific code conventions
└─ frontend/              # the web app
```

The repo root holds documentation only. Anything runnable lives in `frontend/`, which
leaves room for a sibling service later without moving the app again.

## Running it

```sh
cd frontend
yarn install
yarn dev                  # http://localhost:5173
```

Font Awesome Pro is a dependency, so `yarn install` needs the registry token in
`~/.npmrc`.

| Script           | Does                                         |
| ---------------- | -------------------------------------------- |
| `yarn dev`       | dev server with HMR                          |
| `yarn build`     | typecheck, then production build into `dist` |
| `yarn preview`   | serve the built output                       |
| `yarn typecheck` | `tsc --noEmit`, must print nothing           |
| `yarn format`    | Prettier over `src`, including import order  |

## Inside `frontend/src`

| Folder        | Holds                                                        |
| ------------- | ------------------------------------------------------------ |
| `engine/`     | canvas, bitmaps, pixel work. Never imports React.            |
| `store/`      | Redux Toolkit slices. Serializable scalars only, no bitmaps. |
| `components/` | one folder per component, rendering only                     |
| `hooks/`      | hooks shared by more than one component                      |
| `assets/`     | static files imported by code                                |
| `styles/`     | reset, design tokens, mixins                                 |

Six names are root import specifiers, so a component imports `components/Icon` rather
than climbing with `../../`: `components`, `hooks`, `engine`, `store`, `assets` and
`common`. The last one has no folder yet - the alias is reserved. `styles` is not among
them and is imported relatively, because only `main.tsx` and `.scss` files reach it.

The canvas is three stacked layers driven by `engine/Surface.ts`: `base` holds the
committed bitmap at true image resolution, `preview` the stroke in progress, `overlay`
the screen-space chrome.

## Before you change code

Read `docs/Conventions.md` first. It points at the machine-wide conventions in
`~/.claude/conventions/` and records what is specific to this repo.

## Not affiliated with Microsoft

The interface imitates Microsoft Paint. No Microsoft code or artwork is used; the
shape outlines are hand-drawn SVG and the remaining icons come from Font Awesome Pro
under its own license.
