# Paint Web

A web clone of Microsoft Paint (Windows 10, Ribbon UI), built with React and
TypeScript. Everything runs client-side - no backend, and images never leave the
browser.

Status: feature complete and ready to publish. Drawing, files, shapes, selection,
image operations, text, brushes, the view tools, printing, camera capture, pen
pressure, the accessibility pass and the installable PWA all work; so do the public
intro page, the security headers, the windowed renderer for very large pictures, the
encode worker and all six test layers. One thing is left and it is not in this repo:
pointing a domain at the server and terminating TLS at the edge proxy.

Two documents, two jobs:

| Document              | Answers                                          |
| --------------------- | ------------------------------------------------ |
| `README.md`           | how the repo is built and where each piece lives |
| `docs/Conventions.md` | the rules to follow when changing code           |

---

## Layout

```
paint-web/
├─ README.md
├─ docs/
│  └─ Conventions.md      # repo-specific code conventions
├─ tools/                 # language.csv and the json generator
└─ frontend/              # the web app
```

The repo root holds documentation plus the translation pipeline. Anything runnable
lives in `frontend/`, which leaves room for a sibling service later without moving the
app again.

## Running it

```sh
cd frontend
yarn install
yarn dev                  # http://localhost:3004
```

Font Awesome Pro is a dependency, so `yarn install` needs the registry token in
`~/.npmrc`. The visual tests need a browser of their own:
`npx playwright install chromium`.

| Script                   | Does                                            |
| ------------------------ | ----------------------------------------------- |
| `yarn dev`               | dev server with HMR                             |
| `yarn build`             | typecheck, then production build into `dist`    |
| `yarn preview`           | serve the built output                          |
| `yarn test`              | vitest, one pass                                |
| `yarn test:watch`        | vitest, watching                                |
| `yarn test:visual`       | playwright screenshots of the ribbon, en and vi |
| `yarn test:visual:update`| re-bless those baselines                        |
| `yarn test:e2e`          | playwright, the editing flow and the windowing  |
| `yarn test:perf`         | playwright, the frame budget under a long stroke|
| `yarn test:browser`      | every playwright spec, the frame budget last    |
| `yarn typecheck`         | `tsc --noEmit`, must print nothing              |
| `yarn format`            | Prettier over `src`, then the member wrapper    |
| `yarn check:format`      | the same check without writing                  |
| `yarn check:i18n`        | no hard-coded user-visible strings              |
| `yarn i18n`              | `tools/language.csv` to `src/locales/*.json`    |

## Inside `frontend/src`

| Folder        | Holds                                                        |
| ------------- | ------------------------------------------------------------ |
| `engine/`     | canvas, bitmaps, pixel work. Never imports React.            |
| `store/`      | Redux Toolkit slices. Serializable scalars only, no bitmaps. |
| `components/` | one folder per component, rendering only                     |
| `hooks/`      | hooks shared by more than one component                      |
| `common/`     | platform quirks, file, print and camera helpers, every constant outside a component |
| `locales/`    | i18next setup and the generated `en.json` / `vi.json`        |
| `types/`      | the types of every non-component root, one file each         |
| `assets/`     | static files imported by code                                |
| `styles/`     | reset, design tokens, mixins                                 |

Those eight names are root import specifiers, so a component imports `components/Icon`
rather than climbing with `../../`. `styles` is not among them and is imported
relatively, because only `main.tsx` and `.scss` files reach it.

---

## How the pieces fit

### The canvas is three stacked layers

`engine/Surface.ts` drives them: `base` holds the committed bitmap at true image
resolution, `preview` the stroke in progress, and `overlay` the screen-space chrome -
marching ants, selection handles, the guidance a tool draws under the pointer. A
stroke lands on `preview` and is baked into `base` when the gesture ends, which is
what lets a low-opacity brush build up without darkening itself twice. The
constraints on touching these three are in `docs/Conventions.md`.

Past 4000 pixels on a side, or from 400% zoom, the surface switches to a **window**:
`base` and `preview` move to detached canvases at full document size, and the two
canvases in the DOM are sized to the visible part and blitted from them. A 8000-square
picture at 800% would otherwise ask the compositor for a layer no browser will back.
`engine/virtual.ts` holds the decision and the geometry; `Surface` is the only caller,
and the rest of the app never learns which mode it is in.

One `PaintEngine` instance (`paint`) owns the surface, the history and the selection.
Components talk to it; it reads the store for colour, size and tool, and writes pixels
without going back through React.

### Files, printing and the camera

```
common/format.ts      # mime, extensions, picker accept maps - no engine, no store
common/fileSystem.ts  # pickers, handle writes, download fallback, permissions
common/fileSession.ts # the open file's handle, and a file parked behind a dialog
common/recents.ts     # IndexedDB rows for the backstage list
common/print.ts       # page layout in millimetres, and the hidden print frame
common/camera.ts      # getUserMedia, frame grab, stopping the stream
engine/codec.ts       # encode and decode against the surface's pixels
engine/bmp.ts         # 24-bit BMP, written by hand, one row buffer at a time
engine/encode.worker.ts  # bmp by hand, the rest through OffscreenCanvas, off thread
engine/gif.worker.ts  # quantise plus encode, off the main thread
hooks/useFileCommands.ts  # the one place New, Open, Save, Print and Paste are wired
```

The format table sits in `common/` rather than beside the encoders because `common/`
may not import the engine, and `common/fileSystem.ts` needs the extensions to build a
picker. `engine/codec.ts` imports down into `common/`; nothing goes the other way.

**Every save is encoded off the main thread.** A 8000-square BMP is about 99 MB and a
PNG that size takes seconds to write - either one freezes the interface where it runs.
BMP needs no canvas, so it always goes to the worker; PNG, JPEG and WebP need
`OffscreenCanvas.convertToBlob` and fall back to the main thread on a browser without
it. The decision is made before the message is sent, because the pixel buffer is
transferred rather than copied and there is nothing left to retry with.

A command that has to ask before it destroys the document parks its payload with
`deferOpen` and puts the *kind* of command in `ui.pending`. The discard dialog answers,
and `resume()` picks the payload back up. Every way a picture gets in - the picker, a
drop, a paste, the recents list, a camera frame, an "Open with" launch - funnels
through `openPicked`, which is what keeps that gate on all of them.

**Save behaves differently per browser.** `CAN_SAVE_IN_PLACE` is the switch. With the
File System Access API, Save overwrites through a handle and Save as goes through the
native picker. Without it, both end in a download and the backstage Save row grows a
tooltip saying so. The recents list only records rows that carry a handle, so on
Firefox and Safari it stays empty rather than filling with entries that cannot be
reopened.

### Overlay stacking

Every overlay reads its `z-index` from a token in `styles/tokens.scss`:

| Token           | Value | Layer                  |
| --------------- | ----- | ---------------------- |
| `--z-backstage` | 60    | File tab panel         |
| `--z-menu`      | 70    | any portalled dropdown |
| `--z-toast`     | 80    | transient notice       |
| `--z-dialog`    | 100   | modal dialogs          |

Menus sit above the backstage: the Save as flyout is opened from inside it, and a lower
menu layer hid it completely.

### Locales

`en` and `vi`, CSV to JSON. The pipeline sits at the repo root rather than inside
`src/`, because the CSV and its generator are tooling and the app only consumes the
JSON.

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

Placeholders are written `{0}`, `{1}`, which is why `i18n.ts` overrides i18next's
`{{ }}` delimiters. Commit the CSV and the JSON together: `i18n.ts` imports the JSON,
so Vite needs it at build time.

`yarn check:i18n` (`scripts/check-i18n.mjs`) parses every `.ts`/`.tsx` with the
TypeScript compiler API and fails on JSX prose, a literal passed to `label`, `title`,
`aria-label`, `shortcut`, `placeholder` or `note`, any Vietnamese character, any
character outside printable ASCII apart from `°`, and a key-shaped literal that
`en.json` does not define - which is what catches a rename that missed a call site. Its
exemption list lives in the script, each entry with a reason. `convert-to-json.py`
enforces the same character rule on the CSV, where the text actually lives.

### Icons

UI icons are Font Awesome Pro (license held, token in `~/.npmrc`) as a **webfont**,
registered in `src/components/Icon/constant.ts`. Anything drawn onto a canvas - the
tool cursors - takes path data from `@fortawesome/pro-solid-svg-icons` instead.

The 23 shapes in the Shapes gallery are hand-written SVG geometry in
`src/components/ShapeIcon/constant.tsx`: they are the outlines the user actually draws
and must be exact, and FA carries no right triangle, rounded rectangle, curve, four- or
six-point star, or the three callout shapes.

### Published as a static site

```
frontend/
├─ Dockerfile               # nginx:alpine over the dist/ built on the host
└─ deploy/
   ├─ nginx.conf            # cache rules, the /about alias, the spa fallback
   └─ security-headers.conf # CSP and friends, included by every location
```

`public/about.html` is the public introduction, served at `/about` as well: plain HTML
in both languages so it reads without the app, carrying the same disclaimer the About
dialog shows and the promise that pictures never leave the machine. `yarn check:i18n`
compares the two, so neither can drift.

The container listens on port 80 and expects TLS at an edge proxy. That matters more
than it looks: the File System Access, `getUserMedia` and Clipboard APIs only work on a
secure origin, and over plain HTTP Save quietly turns into a download instead.

### The installable app

```
frontend/public/
├─ manifest.webmanifest   # name, icons, file_handlers for the five formats
├─ sw.js                  # hand written service worker, plain js
├─ icon.svg               # tab icon and app icon
└─ icon-maskable.svg      # the same mark inside the safe area of a maskable box
```

Vite copies this folder verbatim, which is the point: `sw.js` must reach the browser
unbundled and at the site root, or its scope shrinks to `/assets/` and it controls
nothing. Hashed assets are served cache-first and everything else network-first;
`index.html` and `sw.js` carry no hash, so `deploy/nginx.conf` sends
`Cache-Control: no-cache` for both. `common/pwa.ts` registers the worker in a built app
only - in dev it would answer with yesterday's bundle.

A file opened through `file_handlers` arrives as a handle rather than through a picker:
`hooks/useLaunchFiles.ts` reads the launch queue and hands it to `openPicked`.

### Tests

Six layers, two runners.

```
frontend/
├─ src/**/<name>.test.ts     # vitest, node environment, beside what it tests
│  ├─ engine/tools/render.test.ts   # real pixels through @napi-rs/canvas
│  └─ components/Ribbon/Ribbon.test.tsx  # RTL, jsdom asked for in the docblock
├─ playwright.config.ts      # one chromium project, 1280x800, no device scaling
└─ tests/
   ├─ common.ts              # shared helpers; not a spec, never collected as one
   ├─ ribbon.spec.ts         # the ribbon and the backstage, in en and in vi
   ├─ editor.spec.ts         # open, crop, shape, text, save, open again
   ├─ virtual.spec.ts        # the windowed renderer, and where a stroke lands
   ├─ performance.spec.ts    # 500 points on a 2000x2000 picture, no frame over 32ms
   └─ snapshots/             # baselines, COMMITTED, one per platform
```

A baseline carries the platform in its name (`-chromium-darwin.png`), so a machine on
another platform writes its own set rather than failing on someone else's pixels.
Browsers are not vendored.

The browser specs delete `showOpenFilePicker` and `showSaveFilePicker` before the page
loads: the app then falls back to a file input Playwright can fill and a download it can
catch, neither of which a native dialog allows.

`performance.spec.ts` is its own Playwright project and runs on one worker after the
rest. Frame gaps measured while three other browsers are drawing say nothing about this
app, and a test that fails for that reason is worse than no test.

---

## Before you change code

Read `docs/Conventions.md`. It is rules only, and it points at the machine-wide
conventions in `~/.claude/conventions/`. The two that catch newcomers first: no
user-visible string is written in a `.ts` or `.tsx` file, and `yarn format` is the only
formatter entry point.

## Not affiliated with Microsoft

The interface imitates Microsoft Paint. No Microsoft code or artwork is used; the shape
outlines are hand-drawn SVG and the remaining icons come from Font Awesome Pro under
its own license. "Paint Web" is the name of this project, which has no connection to
Microsoft or to its products.
