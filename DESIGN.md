# Thiết kế ứng dụng Web Paint — React clone của Microsoft Paint (Windows 10)

> **Tài liệu thiết kế kỹ thuật (Technical Design Document)**
> Phiên bản: 1.0 · Ngày: 2026-09-18 · Trạng thái: Draft để review trước khi implement

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Yêu cầu](#2-yêu-cầu)
3. [Tech stack](#3-tech-stack)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Mô hình dữ liệu](#6-mô-hình-dữ-liệu)
7. [Đặc tả giao diện (UI spec)](#7-đặc-tả-giao-diện-ui-spec)
8. [Đặc tả công cụ vẽ](#8-đặc-tả-công-cụ-vẽ)
9. [Hệ thống Selection](#9-hệ-thống-selection)
10. [Thao tác ảnh (Image operations)](#10-thao-tác-ảnh-image-operations)
11. [Undo / Redo](#11-undo--redo)
12. [File I/O & Clipboard trên macOS/Linux](#12-file-io--clipboard-trên-macoslinux)
13. [Zoom, Ruler, Gridlines](#13-zoom-ruler-gridlines)
14. [Công cụ Text](#14-công-cụ-text)
15. [Hiệu năng](#15-hiệu-năng)
16. [Phím tắt](#16-phím-tắt)
17. [Theming & CSS](#17-theming--css)
18. [Accessibility & i18n](#18-accessibility--i18n)
19. [Kiểm thử](#19-kiểm-thử)
20. [Lộ trình triển khai](#20-lộ-trình-triển-khai)
21. [Khác biệt & hạn chế so với Paint gốc](#21-khác-biệt--hạn-chế-so-với-paint-gốc)
22. [Phụ lục](#22-phụ-lục)

---

## 1. Tổng quan

### 1.1 Bối cảnh & mục tiêu

Microsoft Paint chỉ chạy trên Windows. Người dùng macOS / Linux không có công cụ chỉnh sửa ảnh
"nhanh và đơn giản" tương đương: Preview (macOS) thiếu công cụ vẽ, GIMP quá nặng, các web app
hiện có (Photopea, Excalidraw) có mô hình tương tác khác hẳn.

**Mục tiêu:** xây dựng một ứng dụng web (React) tái tạo **chính xác về mặt thị giác và hành vi**
giao diện Ribbon của Paint trên Windows 10, chạy hoàn toàn client-side trong trình duyệt, để
người dùng quen Paint có thể chỉnh sửa ảnh trên bất kỳ HĐH nào mà không phải học lại.

**Nguyên tắc thiết kế chủ đạo:**

| # | Nguyên tắc | Hệ quả |
|---|-----------|--------|
| P1 | **Fidelity ưu tiên hơn "cải tiến"** | Không tự ý đổi layout, icon, thứ tự nút, hành vi. Nếu Paint gốc làm dở, ta vẫn làm y hệt. |
| P2 | **Client-side thuần** | Không backend, không upload ảnh. Ảnh không bao giờ rời khỏi máy người dùng. |
| P3 | **Pixel-based, không vector** | Giống Paint: mọi nét vẽ được "nung" (rasterize) vào bitmap, không có object layer. |
| P4 | **Offline-first** | PWA, cài được, mở file bằng double-click (File Handling API). |
| P5 | **Không phá hỏng file gốc** | Mở → sửa → Save As. Save đè chỉ khi người dùng chủ động. |

### 1.2 Phạm vi

**In scope (v1.0):**

- Toàn bộ tab **Home** của Paint Win10: Clipboard, Image, Tools, Brushes, Shapes, Size, Colors.
- Tab **File**: New, Open, Save, Save as (PNG/JPEG/BMP/GIF/WEBP), Print, Properties, About.
- Tab **View**: Zoom, Rulers, Gridlines, Status bar, Full screen, Thumbnail.
- Undo/redo, selection (chữ nhật + tự do), text, resize/skew, rotate/flip, crop.
- Mở ảnh bằng kéo-thả, paste từ clipboard hệ thống.

**Out of scope (v1.0):**

- Nút **"Edit with Paint 3D"** → gỡ bỏ (không có tương đương). Vị trí đó dùng cho nhóm
  `Extras` (xem §7.4.8).
- "From scanner or camera", "Send in email", "Set as desktop background" → ẩn hoặc disable
  (xem §21).
- Layers, filter nâng cao, blend mode, plugin — cố tình **không** làm vì Paint không có.

### 1.3 Người dùng mục tiêu

| Persona | Nhu cầu | Ảnh hưởng tới thiết kế |
|---|---|---|
| Nhân viên văn phòng chuyển từ Windows sang Mac | Crop ảnh, khoanh đỏ, thêm chữ, che thông tin | Tools + Shapes + Text phải hoàn hảo, phím tắt giữ nguyên |
| Dev/QA | Annotate screenshot để gắn vào ticket | Paste từ clipboard (Ctrl/Cmd+V) → vẽ → Copy lại ra clipboard |
| Học sinh / người dùng phổ thông | Vẽ chơi | Brushes, palette màu |

---

## 2. Yêu cầu

### 2.1 Yêu cầu chức năng

| ID | Mô tả | Ưu tiên |
|---|---|---|
| FR-01 | Tạo canvas mới với kích thước mặc định 1152×648 px (nền trắng) | Must |
| FR-02 | Mở file ảnh: PNG, JPEG, BMP, GIF, WEBP, SVG (rasterize khi mở) | Must |
| FR-03 | Vẽ bằng 6 tool: Pencil, Fill, Text, Eraser, Color picker, Magnifier | Must |
| FR-04 | Vẽ bằng 9 loại brush với size 1/3/5/8 px | Must |
| FR-05 | Vẽ 23 hình dạng, có Outline style và Fill style | Must |
| FR-06 | Chọn vùng (chữ nhật / tự do), di chuyển, resize, xoá, cut/copy/paste | Must |
| FR-07 | Undo/Redo tối thiểu 50 bước | Must |
| FR-08 | Resize & Skew theo pixel hoặc phần trăm, có khoá tỉ lệ | Must |
| FR-09 | Rotate 90/180/270, Flip ngang/dọc (toàn ảnh hoặc vùng chọn) | Must |
| FR-10 | Crop theo vùng chọn | Must |
| FR-11 | Zoom 12.5% → 800%, cuộn canvas, thanh trạng thái hiển thị toạ độ + kích thước | Must |
| FR-12 | Lưu ra PNG/JPEG/BMP/GIF/WEBP, chọn chất lượng cho JPEG/WEBP | Must |
| FR-13 | Paste ảnh từ clipboard hệ thống, Copy vùng chọn ra clipboard hệ thống | Must |
| FR-14 | Công cụ Text: font, size, bold/italic/underline/strikethrough, nền trong suốt/đục | Must |
| FR-15 | Transparent selection (màu Color 2 trở thành trong suốt khi di chuyển vùng chọn) | Should |
| FR-16 | Ruler, Gridlines, Thumbnail, Full screen | Should |
| FR-17 | Edit colors dialog (color picker HSL + RGB đầy đủ như Windows) | Should |
| FR-18 | Cảnh báo khi đóng tab lúc còn thay đổi chưa lưu | Should |
| FR-19 | Auto-recovery: khôi phục phiên làm việc sau khi trình duyệt crash | Could |
| FR-20 | PWA: cài đặt, mở file bằng double-click từ Finder/Nautilus | Could |

### 2.2 Yêu cầu phi chức năng

| ID | Mô tả | Chỉ tiêu đo được |
|---|---|---|
| NFR-01 | Độ trễ nét vẽ | < 16 ms từ `pointermove` đến pixel hiện trên màn hình (1 frame @60Hz) |
| NFR-02 | Kích thước ảnh hỗ trợ | Mở/sửa/lưu được ảnh 6K (6144×3456) và 8K (7680×4320); tới 8000×8000 px không crash; cảnh báo > 4000×4000. Trên browser có giới hạn diện tích canvas thấp hơn (iOS Safari) phải tự hạ cấp sang tile-surface chứ không được từ chối mở file (§15) |
| NFR-03 | Thời gian khởi động | First Contentful Paint < 1.5 s; bundle chính < 250 KB gzip |
| NFR-04 | Bộ nhớ | History 50 bước với ảnh 1920×1080 ≤ 400 MB (dùng chiến lược tile, §11) |
| NFR-05 | Trình duyệt | Chrome/Edge ≥ 111, Firefox ≥ 115, Safari ≥ 16.4 |
| NFR-06 | Độ trung thực UI | So sánh pixel với ảnh chụp Paint Win10: sai lệch layout ≤ 2 px ở scale 100% |
| NFR-07 | Bảo mật | Không network request nào chứa dữ liệu ảnh. CSP chặn `connect-src` ngoài self. |
| NFR-08 | Không mất dữ liệu | Mọi thao tác huỷ (New/Open/Close) khi dirty đều phải confirm |

---

## 3. Tech stack

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | **React 18 + TypeScript 5** | Yêu cầu của đề bài; concurrent rendering không dùng cho canvas nhưng tốt cho ribbon |
| Build | **Vite 5** | Dev server nhanh, output ES module gọn |
| State | **Redux Toolkit** (`createSlice` + react-redux) | Chốt ngày 2026-09-18: dùng RTK cho quen tay và devtools. Ràng buộc bắt buộc: state theo từng nét vẽ (pointer move, stroke đang dở) **không** vào store — giữ ở engine — nên không có dispatch nào chạy theo mousemove |
| Canvas | **Canvas 2D API thuần** | WebGL không cần thiết; 2D API có `putImageData`, `globalCompositeOperation` đủ dùng |
| Styling | **CSS Modules + CSS custom properties** | Cần kiểm soát pixel tuyệt đối → không dùng Tailwind (utility class khó tả gradient ribbon) |
| Icon | **Font Awesome Pro** (license đã có) | Icon Paint là tài sản của Microsoft → không copy (§21.2); FA Pro là bộ thay thế hợp pháp. Ngoại lệ: 23 hình trong gallery Shapes vẫn là SVG geometry tự vẽ, vì đó là hình học người dùng sẽ vẽ ra, không phải icon |
| i18n | **i18next + react-i18next**, sinh JSON từ CSV bằng script Python stdlib (§18.1) | Dùng lại quy trình dịch của repo `chat-app` (CSV là nguồn sự thật, JSON không sửa tay), nhưng gom hết vào `src/locales/` và bỏ nhánh `.xlsx` để không cần venv |
| Test | Vitest + React Testing Library + Playwright | Unit cho engine, E2E cho luồng vẽ |
| Đóng gói | PWA qua `vite-plugin-pwa` | Offline + File Handling API |

**Các thư viện cố tình KHÔNG dùng:**
- Fabric.js / Konva → chúng là vector/scene-graph, ngược với mô hình raster của Paint (P3).
- UI kit (MUI, AntD) → không thể ép về đúng hình dáng Ribbon, chỉ tốn bundle.

---

## 4. Kiến trúc hệ thống

### 4.1 Sơ đồ tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│                        React UI Layer                            │
│  ┌────────────┐ ┌─────────────────────┐ ┌────────────────────┐   │
│  │ TitleBar   │ │ Ribbon              │ │ Dialogs            │   │
│  │ + QAT      │ │ (File/Home/View)    │ │ (Resize, Colors…)  │   │
│  └────────────┘ └─────────────────────┘ └────────────────────┘   │
│  ┌──────────────────────────────────┐  ┌──────────────────────┐  │
│  │ CanvasViewport                   │  │ StatusBar            │  │
│  │ (ruler, scroll, zoom, handles)   │  │                      │  │
│  └──────────────────────────────────┘  └──────────────────────┘  │
└───────────────────┬──────────────────────────────────────────────┘
                    │ đọc state / dispatch command
┌───────────────────▼──────────────────────────────────────────────┐
│                    Store (Zustand)                               │
│   documentSlice · toolSlice · colorSlice · viewSlice ·           │
│   selectionSlice · historySlice · uiSlice                        │
└───────────────────┬──────────────────────────────────────────────┘
                    │ gọi trực tiếp (không qua React render)
┌───────────────────▼──────────────────────────────────────────────┐
│                    Paint Engine (TS thuần, không React)          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐  │
│  │ Surface  │ │ ToolHost  │ │ Selection│ │History │ │ Codec   │  │
│  │ (layers) │ │ (strategy)│ │ Manager  │ │(tiles) │ │ (I/O)   │  │
│  └──────────┘ └───────────┘ └──────────┘ └────────┘ └─────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Quy tắc phân tầng quan trọng:** Engine **không import React**. Nét vẽ đang diễn ra
(`pointermove`) **không** đi qua React state — nó gọi thẳng vào engine để tránh re-render.
React chỉ được thông báo ở các mốc rời rạc: đổi tool, đổi màu, commit stroke, thay đổi history.

### 4.2 Mô hình canvas nhiều lớp

Paint là app "một layer", nhưng để render mượt ta cần **3 canvas chồng lên nhau** trong DOM:

| Lớp | z | Nội dung | Kích thước | Xoá khi nào |
|---|---|---|---|---|
| `base` | 0 | Bitmap thật của tài liệu | `doc.width × doc.height` (pixel ảnh) | Không bao giờ (chỉ vẽ đè) |
| `preview` | 1 | Nét/hình đang vẽ, chưa commit | Bằng base | Mỗi frame khi đang thao tác |
| `overlay` | 2 | Marching ants, handle resize, lưới, con trỏ hình dạng | Bằng **viewport** (pixel màn hình) | Mỗi frame |

```
commit flow:
  pointerdown  → tool.begin()   → vẽ vào preview
  pointermove  → tool.update()  → clear preview, vẽ lại preview (rAF throttled)
  pointerup    → tool.commit()  → history.snapshotBefore()
                                → base.drawImage(preview)
                                → preview.clear()
                                → history.push()
```

Lý do tách `preview`: khi kéo một hình chữ nhật, ta phải xoá hình cũ mỗi frame. Nếu vẽ trực
tiếp lên `base` thì phải phục hồi pixel nền — tốn kém. Với tool tự do (Pencil, Brush) thì
ngược lại: nét vẽ **tích luỹ** trên preview, không clear mỗi frame.

> **Lưu ý về `base` và pixel ratio:** `base` luôn ở độ phân giải **thật của ảnh**, không nhân
> với `devicePixelRatio`. Việc phóng to là do CSS transform / `drawImage` lên viewport đảm nhận.
> Nếu nhân DPR vào base, ảnh 100×100 lưu ra sẽ thành 200×200 trên màn Retina — sai.

### 4.3 Luồng sự kiện pointer

```ts
// CanvasViewport.tsx (rút gọn)
function onPointerDown(e: React.PointerEvent) {
  e.currentTarget.setPointerCapture(e.pointerId);   // giữ chuột cả khi ra ngoài canvas
  const pt = screenToImage(e.clientX, e.clientY);   // §4.5
  engine.toolHost.begin(pt, {
    button: e.button,                                // 0 = Color 1, 2 = Color 2
    shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey,
  });
}

function onPointerMove(e: React.PointerEvent) {
  const pt = screenToImage(e.clientX, e.clientY);
  setStatusCoord(pt);                                // throttle 60ms, không mỗi frame
  if (!engine.toolHost.isActive) return;
  // Gộp các event trung gian để nét mượt trên màn 120Hz / bút stylus
  const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
  engine.toolHost.update(coalesced.map(toImagePoint));
}
```

**Nút chuột:** Paint dùng chuột trái = **Color 1**, chuột phải = **Color 2**. Phải
`preventDefault` trên `contextmenu` của canvas. Trên macOS, Ctrl+click = chuột phải — cần
map thành Color 2 nhưng **không** kích hoạt context menu.

### 4.4 Quản lý state — phân chia slice

```ts
interface AppState {
  document: DocumentState;    // width, height, filename, isDirty, format
  tool:     ToolState;        // activeTool, brushKind, shapeKind, size, outline, fill
  color:    ColorState;       // color1, color2, palette, customColors[10]
  view:     ViewState;        // zoom, scrollX/Y, showRuler, showGrid, showStatus, fullscreen
  selection:SelectionState;   // kind, bounds, floating bitmap, transparentMode
  history:  HistoryState;     // canUndo, canRedo (chỉ 2 boolean — data nằm trong engine)
  ui:       UiState;          // activeRibbonTab, openDialog, openDropdown, toast
}
```

`history` trong store chỉ chứa **2 boolean** để bật/tắt nút Undo/Redo. Toàn bộ dữ liệu ảnh
nằm trong engine, ngoài React — nếu đưa `ImageData` vào store, mỗi lần undo React sẽ so sánh
tham chiếu của mảng hàng trăm MB.

### 4.5 Chuyển đổi toạ độ

```ts
/** Màn hình (client px) → ảnh (image px). Luôn floor để ra chỉ số pixel nguyên. */
function screenToImage(clientX: number, clientY: number): Point {
  const r = viewportEl.getBoundingClientRect();
  return {
    x: Math.floor((clientX - r.left + scrollX) / zoom),
    y: Math.floor((clientY - r.top  + scrollY) / zoom),
  };
}
```

**Bẫy thường gặp:** khi zoom ≥ 200%, một pixel ảnh chiếm nhiều pixel màn hình. Phải đặt
`image-rendering: pixelated` trên canvas để pixel hiện vuông sắc nét như Paint, chứ không bị
làm mờ (mặc định trình duyệt là bilinear).

---

## 5. Cấu trúc thư mục

Repo chia hai tầng: tài liệu ở root, toàn bộ app web nằm trong `frontend/`.

```
paint-web/
├─ README.md
├─ DESIGN.md
├─ docs/Conventions.md
└─ frontend/                    <- cây bên dưới
```

```
frontend/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ public/
│  ├─ manifest.webmanifest
│  └─ icons/
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  │
│  ├─ engine/                    # KHÔNG import React
│  │  ├─ Surface.ts              # quản lý 3 canvas, resize, clear, blit
│  │  ├─ ToolHost.ts             # strategy dispatcher cho tool đang active
│  │  ├─ History.ts              # tile-based undo stack
│  │  ├─ SelectionManager.ts     # vùng chọn nổi, mask, transparent mode
│  │  ├─ transform.ts            # rotate / flip / skew / resize
│  │  ├─ codec.ts                # encode/decode PNG JPEG BMP GIF WEBP
│  │  ├─ bmp.ts                  # encoder BMP viết tay (§12.3)
│  │  ├─ color.ts                # hex ↔ rgb ↔ hsl, bảng màu Paint
│  │  ├─ cursor.ts               # external store toạ độ, throttle 60ms
│  │  ├─ types.ts                # Size, SurfaceLayers, SurfaceContexts
│  │  └─ tools/
│  │     ├─ Tool.ts              # interface chung
│  │     ├─ PencilTool.ts
│  │     ├─ BrushTool.ts         # 9 biến thể qua tham số
│  │     ├─ FillTool.ts          # scanline flood fill
│  │     ├─ TextTool.ts
│  │     ├─ EraserTool.ts
│  │     ├─ PickerTool.ts
│  │     ├─ MagnifierTool.ts
│  │     ├─ ShapeTool.ts         # 23 shape qua bảng path
│  │     └─ SelectTool.ts
│  │
│  ├─ store/
│  │  ├─ index.ts                # configureStore + typed hooks (Redux Toolkit)
│  │  ├─ types.ts
│  │  └─ slices/*.ts
│  │
│  ├─ components/                # một folder PascalCase mỗi component;
│  │  │                          # bên trong: index.tsx, hooks, types,
│  │  │                          # common, constant, <Name>.scss
│  │  ├─ TitleBar/               # + QuickAccessToolbar, WindowButtons
│  │  ├─ Ribbon/
│  │  │  └─ components/          # ClipboardGroup, ImageGroup, ToolsGroup,
│  │  │                          # BrushesGroup, ShapesGroup, SizeGroup,
│  │  │                          # ColorsGroup, ExtrasGroup, ViewGroups,
│  │  │                          # StrokeMenuButton, ColorSlot
│  │  ├─ RibbonButton/           # Large / Small / Icon / Split
│  │  ├─ RibbonGroup/            # khung nhóm + nhãn dưới đáy
│  │  ├─ FileMenu/               # backstage màu xanh của tab File
│  │  ├─ CanvasViewport/         # + Ruler, ResizeHandles, Thumbnail
│  │  ├─ StatusBar/
│  │  ├─ Menu/                   # dropdown dùng chung, portal ra body
│  │  ├─ Icon/                   # registry Font Awesome Pro
│  │  ├─ ShapeIcon/              # 23 path SVG viết tay
│  │  └─ DialogHost/
│  │     └─ components/          # Dialog, ResizeSkew, EditColors,
│  │                             # ImageProperties, SaveAs,
│  │                             # ConfirmDiscard, About
│  │
│  ├─ hooks/                     # hook dùng chung nhiều component
│  │  ├─ useDismissMenus.ts
│  │  ├─ useKeyboardShortcuts.ts
│  │  ├─ useClipboard.ts
│  │  ├─ useFileDrop.ts
│  │  └─ useBeforeUnload.ts
│  │
│  ├─ locales/                  # §18.1 — CSV, script sinh và JSON nằm cùng chỗ
│  │  ├─ language.csv            # NGUỒN SỰ THẬT
│  │  ├─ generate-language.sh    # CSV → JSON (python3 stdlib, không cần venv)
│  │  ├─ convert-to-json.py
│  │  ├─ i18n.ts
│  │  ├─ translate.ts            # helper không-hook, cho engine dùng
│  │  ├─ en.json                 # SINH RA
│  │  └─ vi.json                 # SINH RA
│  │
│  ├─ styles/
│  │  ├─ tokens.scss             # :root custom properties
│  │  ├─ reset.scss
│  │  └─ _mixins.scss            # partial, @use từ scss của component
│  │
│  └─ assets/icons/*.svg
└─ yarn.lock
```

Các file chưa tồn tại ở trên là phần còn lại của lộ trình §20.1, không phải thư mục
rỗng chờ sẵn.

---

## 6. Mô hình dữ liệu

```ts
// ───────────────────────── Document ─────────────────────────
interface DocumentState {
  width: number;                 // px
  height: number;
  fileName: string;              // "Untitled"
  format: ImageFormat;           // định dạng đã lưu gần nhất
  isDirty: boolean;
  fileHandle?: FileSystemFileHandle;  // có → Save ghi đè được
  dpi: number;                   // chỉ để hiển thị trong Properties, mặc định 96
}

type ImageFormat = 'png' | 'jpeg' | 'bmp' | 'gif' | 'webp';

// ───────────────────────── Tool ─────────────────────────
type ToolId =
  | 'pencil' | 'fill' | 'text' | 'eraser' | 'picker' | 'magnifier'
  | 'brush'  | 'shape'
  | 'select-rect' | 'select-free';

type BrushKind =
  | 'brush' | 'calligraphy1' | 'calligraphy2' | 'airbrush' | 'oil'
  | 'crayon' | 'marker' | 'natural-pencil' | 'watercolor';

type ShapeKind =
  | 'line' | 'curve' | 'oval' | 'rect' | 'rounded-rect' | 'polygon'
  | 'triangle' | 'right-triangle' | 'diamond' | 'pentagon' | 'hexagon'
  | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down'
  | 'star-4' | 'star-5' | 'star-6'
  | 'callout-rounded' | 'callout-oval' | 'callout-cloud'
  | 'heart' | 'lightning';

/** Dùng chung cho Outline và Fill của Shapes */
type StrokeStyle =
  | 'none' | 'solid' | 'crayon' | 'marker' | 'oil' | 'natural-pencil' | 'watercolor';

interface ToolState {
  active: ToolId;
  brush: BrushKind;
  shape: ShapeKind;
  size: 1 | 3 | 5 | 8;           // Paint chỉ có 4 mức
  outline: StrokeStyle;          // mặc định 'solid'
  fill: StrokeStyle;             // mặc định 'none'
  text: TextOptions;
}

interface TextOptions {
  fontFamily: string;            // mặc định 'Calibri' → fallback (§17.3)
  fontSize: number;              // pt, mặc định 11
  bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean;
  background: 'transparent' | 'opaque';
}

// ───────────────────────── Color ─────────────────────────
interface ColorState {
  color1: string;                // hex "#000000" — nét vẽ / chuột trái
  color2: string;                // hex "#ffffff" — nền / chuột phải
  editing: 'color1' | 'color2';  // ô nào đang được chọn để nhận màu mới
  palette: readonly string[];    // 20 màu chuẩn, bất biến
  custom: (string | null)[];     // 10 ô tuỳ chỉnh hàng dưới
}

// ───────────────────────── View ─────────────────────────
interface ViewState {
  zoom: number;                  // 0.125 … 8
  scrollX: number; scrollY: number;
  showRuler: boolean;            // chỉ bật được khi zoom ≥ 1
  showGrid: boolean;             // chỉ bật được khi zoom ≥ 4
  showStatusBar: boolean;
  showThumbnail: boolean;
  fullScreen: boolean;
}

// ───────────────────────── Selection ─────────────────────────
interface SelectionState {
  kind: 'none' | 'rect' | 'free';
  bounds: Rect | null;           // bbox trong toạ độ ảnh
  /** Bitmap đã "bốc" khỏi base; null nghĩa là vùng chọn chưa bị di chuyển */
  floating: ImageBitmap | null;
  /** Mask alpha cho free-form selection; null nếu là hình chữ nhật */
  mask: ImageData | null;
  transparent: boolean;          // "Transparent selection" trong menu Select
  isDragging: boolean;
}

interface Rect { x: number; y: number; w: number; h: number }
interface Point { x: number; y: number }
```

### 6.1 Interface của một Tool

```ts
interface ToolContext {
  base: CanvasRenderingContext2D;
  preview: CanvasRenderingContext2D;
  overlay: CanvasRenderingContext2D;
  color1: string; color2: string;
  size: number;
  doc: { width: number; height: number };
  requestRender(): void;
  commit(description: string): void;   // đẩy preview vào base + push history
}

interface Tool {
  readonly id: ToolId;
  /** Con trỏ CSS khi hover canvas */
  cursor(ctx: ToolContext): string;
  begin(pt: Point, mods: Modifiers, ctx: ToolContext): void;
  update(pts: Point[], mods: Modifiers, ctx: ToolContext): void;
  end(pt: Point, mods: Modifiers, ctx: ToolContext): void;
  /** Gọi khi người dùng đổi sang tool khác giữa chừng (vd Polygon đang mở) */
  cancel(ctx: ToolContext): void;
  /** Vẽ phần chỉ dẫn lên overlay (handle của shape chưa commit) */
  paintOverlay?(ctx: ToolContext): void;
}
```

Mọi tool là **strategy object không trạng thái toàn cục**; trạng thái tạm (điểm bắt đầu, mảng
điểm polygon) là field private của instance, bị reset trong `begin`.

---

## 7. Đặc tả giao diện (UI spec)

### 7.1 Layout tổng thể & kích thước

```
┌────────────────────────────────────────────────────────── 100vw ─┐
│ TitleBar                                              32px       │  ← QAT + tiêu đề + nút cửa sổ
├──────────────────────────────────────────────────────────────────┤
│ Tab strip: File │ Home │ View                         24px       │
├──────────────────────────────────────────────────────────────────┤
│ Ribbon content (các group)                            94px       │
├──────────────────────────────────────────────────────────────────┤
│ ┌─Ruler ngang 20px────────────────────────────────────────────┐  │
│ │R│                                                          │  │
│ │u│                Canvas viewport (flex: 1)                 │  │
│ │l│                nền #c5cbd8, canvas trắng ở góc trái trên  │  │
│ │e│                                                          │  │
│ └─┴──────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ StatusBar                                             24px       │
└──────────────────────────────────────────────────────────────────┘
```

Tổng chiều cao chrome phía trên = 32 + 24 + 94 = **150 px** (đúng theo ảnh tham chiếu Paint
Win10 ở 100% scale). Ribbon **không** co giãn theo chiều rộng: các group giữ nguyên kích thước,
group thừa bị cắt bằng `overflow: hidden` (Paint cũng vậy, không có adaptive ribbon).

### 7.2 Title bar & Quick Access Toolbar

Từ trái sang phải:
1. Icon app (16×16).
2. QAT: **Save** (đĩa mềm), **Undo** (mũi tên cong trái), **Redo** (mũi tên cong phải), rồi
   nút ▾ mở menu "Customize Quick Access Toolbar".
3. Tiêu đề căn giữa-trái: `{fileName} - Paint`, thêm dấu `*` ở đầu khi `isDirty`.
4. Bên phải: Minimize / Maximize / Close.

> **Quyết định thiết kế:** ba nút cửa sổ **vẫn hiển thị** để giữ đúng hình dáng, nhưng hành vi
> được ánh xạ lại cho web: Minimize → disabled (tooltip giải thích), Maximize → toggle
> Fullscreen API, Close → thử `window.close()`, nếu bị chặn thì hiện dialog "Bạn có thể đóng
> tab này". Xem §21.1.

QAT lưu vào `localStorage` để giữ tuỳ chỉnh giữa các phiên.

### 7.3 Tab File (backstage)

Panel xanh dương phủ toàn bộ vùng ribbon+canvas, chia hai cột:

| Cột trái (menu) | Hành vi |
|---|---|
| **New** (Ctrl+N) | Nếu dirty → confirm. Tạo canvas 1152×648 trắng |
| **Open** (Ctrl+O) | `showOpenFilePicker` hoặc `<input type=file>` |
| **Save** (Ctrl+S) | Có `fileHandle` → ghi đè; không → chuyển sang Save as |
| **Save as** ▸ | Submenu: PNG, JPEG, BMP, GIF, **Other formats…** (WEBP + tuỳ chọn chất lượng) |
| **Print** ▸ | Print, Page setup, Print preview (§12.5) |
| **From scanner or camera** | → thay bằng **From camera**: dùng `getUserMedia` chụp ảnh |
| **Send in email** | → thay bằng **Copy image** (đưa ảnh vào clipboard) |
| **Set as desktop background** | → **gỡ bỏ** (không khả thi trên web) |
| **Properties** (Ctrl+E) | Dialog: kích thước, độ phân giải, dung lượng ước tính, màu/đen trắng |
| **About Paint** | Dialog giới thiệu + phiên bản |
| **Exit** | Như nút Close |

Cột phải: danh sách **Recent pictures** — lưu `FileSystemFileHandle` trong IndexedDB
(handle có thể serialize được), kèm thumbnail 64×64. Khi mở lại phải gọi
`handle.queryPermission()` và xin lại quyền nếu cần.

### 7.4 Tab Home — 7 nhóm

#### 7.4.1 Clipboard
- **Paste** (nút lớn, có split ▾): Paste, Paste from… (mở file và dán vào làm vùng chọn nổi).
- **Cut** (Ctrl+X), **Copy** (Ctrl+C) — nút nhỏ xếp dọc, disabled khi không có vùng chọn.

#### 7.4.2 Image
- **Select** (nút lớn, split ▾) → menu:
  - *Selection shapes*: Rectangular selection, Free-form selection
  - *Selection options*: Select all (Ctrl+A), Invert selection (Ctrl+I), Delete (Del),
    **Transparent selection** (checkbox)
- **Crop** — disabled khi không có vùng chọn
- **Resize** (Ctrl+W) → dialog Resize and Skew
- **Rotate** ▾ → Rotate right 90°, Rotate left 90°, Rotate 180°, Flip vertical, Flip horizontal

#### 7.4.3 Tools
Lưới 3×2 các nút 24×24:

| | | |
|---|---|---|
| ✏️ Pencil | 🪣 Fill with colour | **A** Text |
| 🧽 Eraser | 💉 Colour picker | 🔍 Magnifier |

#### 7.4.4 Brushes
Nút lớn có ▾. Khi mở gallery hiện 9 brush (xem §8.2). Nút giữ nguyên icon của brush đang chọn.

#### 7.4.5 Shapes
Gallery cuộn được, 3 hàng × ~8 cột, tổng 23 shape. Bên phải có:
- Nút ▴ / ▾ cuộn từng hàng, nút ▾ có gạch mở toàn bộ gallery (popup phủ ra ngoài ribbon).
- **Outline** ▾ và **Fill** ▾: mỗi cái là menu 7 mục (No outline/fill, Solid colour, Crayon,
  Marker, Oil, Natural pencil, Watercolour) có radio check.
- Outline/Fill bị **disabled** khi shape đang chọn là Line hoặc Curve (không có vùng trong).

#### 7.4.6 Size
Nút lớn có ▾, icon là 4 đường ngang độ dày tăng dần. Menu xổ xuống 4 mục hiển thị **đường kẻ
thật** dày 1/3/5/8 px, mục đang chọn có nền xanh.

Phím tắt: `Ctrl + +` tăng size, `Ctrl + -` giảm size (như Paint).

#### 7.4.7 Colors
```
┌────────┬────────┬───────────────────────────────┬──────────┐
│ Color  │ Color  │  ■■■■■■■■■■  (10 màu hàng 1)   │  🎨      │
│   1    │   2    │  ■■■■■■■■■■  (10 màu hàng 2)   │  Edit    │
│ [swatch]│[swatch]│  □□□□□□□□□□  (10 ô custom)     │  colours │
└────────┴────────┴───────────────────────────────┴──────────┘
```
- Click "Color 1" hoặc "Color 2" → đặt `editing`; ô đang edit có viền xanh dày.
- Click một ô màu trong palette → gán vào ô đang edit.
- Click ô custom trống → mở Edit colours dialog.
- **Edit colours** → dialog (§8.5.2), màu mới được thêm vào ô custom trống đầu tiên; đầy thì
  ghi đè theo FIFO.

#### 7.4.8 Extras (thay cho "Edit with Paint 3D")
Giữ nguyên vị trí và kích thước để layout không lệch, nhưng đổi nội dung:
- **Copy to clipboard** (nút lớn) — copy toàn ảnh hoặc vùng chọn ra clipboard hệ thống.

### 7.5 Tab View

| Nhóm | Nút |
|---|---|
| Zoom | Zoom in (Ctrl+PgUp), Zoom out (Ctrl+PgDn), 100% |
| Show or hide | ☑ Rulers (Ctrl+R), ☑ Gridlines (Ctrl+G), ☑ Status bar |
| Display | Full screen (F11), Thumbnail |

### 7.6 Vùng canvas

- Nền viewport: `#c5cbd8` (xám xanh của Paint Win10).
- Canvas trắng đặt ở **góc trên-trái**, cách mép 6 px, không căn giữa (đúng như Paint).
- Viền canvas: 1px `#a0a0a0`, cộng bóng nhẹ `1px 1px 0 rgba(0,0,0,.15)`.
- **8 handle resize** (4 góc + 4 cạnh) hình vuông 5×5 px, viền đen nền trắng, đặt sát mép
  canvas. Kéo handle → thay đổi kích thước tài liệu (thêm nền trắng hoặc cắt bớt, **không**
  co giãn nội dung — giống hệt Paint).
- Con trỏ đổi theo tool: pencil, crosshair (shapes/select), eraser (ô vuông theo size),
  eyedropper, magnifier ±.

### 7.7 Status bar

Bốn ô, ngăn cách bằng đường dọc:

| Ô | Nội dung | Ghi chú |
|---|---|---|
| 1 | `✛ 216, 49px` | Toạ độ con trỏ; rỗng khi con trỏ ra ngoài canvas |
| 2 | `⬚ 120 × 80px` | Kích thước vùng chọn / hình đang kéo; rỗng khi không có |
| 3 | `🖼 240 × 160px` | Kích thước tài liệu |
| 4 | `📁 1.2MB` | Dung lượng ước tính khi lưu (tính lazy, debounce 1s) |

Bên phải: slider zoom (12.5%→800%), nút −/+, nhãn phần trăm.

---

## 8. Đặc tả công cụ vẽ

### 8.1 Nhóm Tools

#### Pencil
Vẽ đường 1 px cứng (không antialias), size 1/3/5/8. Không dùng `ctx.lineTo` vì antialias làm
nét mờ — Paint vẽ pixel cứng.

```ts
/** Bresenham line — đảm bảo nét cứng, không antialias */
function drawPencilSegment(img: ImageData, a: Point, b: Point, color: RGBA, size: number) {
  let { x: x0, y: y0 } = a; const { x: x1, y: y1 } = b;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    stampSquare(img, x0, y0, size, color);        // vẽ ô vuông size×size tại tâm
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
```

Giữ **Shift** → khoá theo phương ngang/dọc/45°.

#### Fill with colour (thùng sơn)
Flood fill 4-hướng theo **scanline** (không đệ quy — tránh stack overflow trên vùng lớn).
Tolerance = **0** (Paint so khớp màu tuyệt đối).

```ts
function floodFill(img: ImageData, sx: number, sy: number, fill: RGBA) {
  const { width: w, height: h, data } = img;
  const at = (x: number, y: number) => (y * w + x) << 2;
  const target = readPixel(data, at(sx, sy));
  if (sameColor(target, fill)) return;                 // tránh vòng lặp vô hạn

  const stack: number[] = [sx, sy];
  while (stack.length) {
    const y = stack.pop()!, x0 = stack.pop()!;
    let x = x0;
    while (x >= 0 && matches(data, at(x, y), target)) x--;   // chạy về trái
    x++;
    let spanUp = false, spanDown = false;
    while (x < w && matches(data, at(x, y), target)) {
      writePixel(data, at(x, y), fill);
      // phát hiện span mới ở hàng trên
      if (y > 0) {
        const up = matches(data, at(x, y - 1), target);
        if (up && !spanUp) { stack.push(x, y - 1); spanUp = true; }
        else if (!up) spanUp = false;
      }
      if (y < h - 1) {
        const dn = matches(data, at(x, y + 1), target);
        if (dn && !spanDown) { stack.push(x, y + 1); spanDown = true; }
        else if (!dn) spanDown = false;
      }
      x++;
    }
  }
}
```

**Độ phức tạp:** O(số pixel được tô). Với ảnh 4000×4000 toàn một màu ≈ 16 M pixel — mất
~200 ms. Nếu `w*h > 4_000_000`, chạy trong **Web Worker** với `ImageData` chuyển qua
`transferable` để không đơ UI.

#### Eraser
Vẽ ô vuông màu **Color 2** (không phải trong suốt!). Đây là hành vi thật của Paint: tẩy = tô
màu nền. Chuột phải + Eraser = "color replacer": chỉ thay pixel có màu = Color 1 thành Color 2.

#### Colour picker
Đọc 1 pixel từ `base`, gán vào Color 1 (chuột trái) hoặc Color 2 (chuột phải), rồi **tự động
quay về tool trước đó** — hành vi của Paint.

#### Magnifier
Click trái → zoom vào mức tiếp theo trong `[1, 2, 4, 8]`, click phải → lùi. Tâm zoom là điểm
click. Overlay hiện khung xem trước hình chữ nhật đi theo con trỏ.

#### Text
Xem §14.

### 8.2 Brushes — 9 loại

Tất cả dùng chung `BrushTool`, khác nhau ở bảng tham số:

| Brush | Cơ chế | Tham số |
|---|---|---|
| Brush | Đường tròn mềm, `lineCap: round`, `lineJoin: round` | width = size×2 |
| Calligraphy brush 1 | Stamp hình chữ nhật nghiêng **45°** | w = size×2, h = size/2 |
| Calligraphy brush 2 | Stamp hình chữ nhật nghiêng **135°** | như trên |
| Airbrush | Rải điểm ngẫu nhiên trong hình tròn, **lặp theo thời gian** khi giữ chuột đứng yên | radius = size×3, rate = 40 chấm/frame, alpha 0.08 |
| Oil brush | Nhiều nét song song lệch nhau + alpha thấp, có "vệt cạn" theo quãng đường | 5 nét, jitter ±size |
| Crayon | Texture nhiễu: stamp với mask noise pre-render | alpha 0.6, noise 24×24 tile |
| Marker | `globalAlpha ≈ 0.4`, `globalCompositeOperation: 'multiply'` → chồng nét đậm lên | width = size×2 |
| Natural pencil | Nét mảnh, alpha biến thiên theo tốc độ con trỏ | width = size, alpha 0.5–0.9 |
| Watercolour | Nhiều lớp alpha rất thấp, lan rộng theo thời gian dừng | 3 lớp, alpha 0.05, blur nhẹ |

> **Airbrush đặc biệt:** phải chạy bằng `setInterval`/rAF khi giữ chuột **dù không di chuyển**.
> Đây là tool duy nhất có hành vi theo thời gian.

**Kỹ thuật texture (Crayon, Oil, Watercolour):** pre-render mỗi texture thành một
`OffscreenCanvas` 64×64 lúc khởi động, rồi dùng `createPattern` + `ctx.fillStyle = pattern`.
Sinh noise mỗi frame sẽ giết hiệu năng.

### 8.3 Shapes — 23 hình

`ShapeTool` là một tool duy nhất, nhận `ShapeKind` và tra bảng định nghĩa:

```ts
interface ShapeDef {
  kind: ShapeKind;
  /** Vẽ path đã chuẩn hoá trong không gian [0,1]×[0,1], sẽ được scale vào bbox */
  path(p: Path2D): void;
  /** true nếu hình có vùng trong (bật được Fill) */
  fillable: boolean;
  /** true nếu cần nhiều lần click (curve, polygon) */
  multiStep?: boolean;
}
```

Ví dụ ngôi sao 5 cánh:

```ts
{
  kind: 'star-5', fillable: true,
  path(p) {
    const cx = .5, cy = .5, R = .5, r = R * 0.382;   // tỉ lệ vàng
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 ? r : R);
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
  }
}
```

**Hành vi chung:**
- Kéo từ điểm A đến B → bbox = hình chữ nhật AB. Giữ **Shift** → ép vuông/tròn/đường 45°.
- Sau khi thả chuột, hình **vẫn ở trạng thái editable**: có 8 handle, kéo được, đổi được
  Outline/Fill/Size/màu. Commit khi: nhấn Enter, click ra ngoài, đổi tool, hoặc Ctrl+Z (huỷ).
  → Đây là hành vi của Paint Win7+ và **bắt buộc phải có**, nó nằm trong preview layer.
- Outline dùng **Color 1**, Fill dùng **Color 2**.

**Hai shape nhiều bước:**
- **Line/Curve:** kéo tạo đường thẳng → click-kéo tối đa 2 lần nữa để uốn thành Bézier bậc 3.
- **Polygon:** click từng đỉnh, double-click hoặc click vào đỉnh đầu để đóng hình.

### 8.4 Size

Ánh xạ: `1 | 3 | 5 | 8` px. Với Shapes, con số này là độ dày đường viền. Với Brushes, mỗi
brush nhân thêm hệ số riêng (xem bảng §8.2) — vì brush trong Paint to hơn pencil rõ rệt.

### 8.5 Colors

#### 8.5.1 Bảng màu chuẩn
Xem §22.1 — 20 màu, **không được đổi**.

#### 8.5.2 Edit colours dialog
Tái tạo hộp thoại "Edit Colors" cổ điển của Windows:
- Bên trái: lưới 48 ô Basic colors (7 cột × 7 hàng — bảng cố định của Windows).
- Bên phải: trường màu HSL 2D (Hue ngang, Sat dọc) 176×176 px + thanh Luminance dọc.
- Dưới: các ô nhập `Hue / Sat / Lum` (0–240, thang của Windows!) và `Red / Green / Blue` (0–255),
  đồng bộ hai chiều.
- Ô "Color|Solid" xem trước.
- Nút "Add to Custom Colors", OK, Cancel.

> **Chú ý thang đo:** Windows dùng Hue 0–239, Sat 0–240, Lum 0–240 — **không** phải 0–360/0–100.
> Phải chuyển đổi đúng nếu muốn số khớp với Paint thật.

### 8.6 Bút cảm ứng lực nhấn (pressure & tilt)

**Web có hỗ trợ.** `PointerEvent` cung cấp sẵn, không cần thư viện:

| Thuộc tính | Miền giá trị | Ghi chú |
|---|---|---|
| `pressure` | 0–1 | **0.5** khi thiết bị không đo được lực mà đang chạm; 0 khi nhả |
| `tangentialPressure` | −1…1 | bánh xe / barrel trên bút chuyên dụng |
| `tiltX` / `tiltY` | −90…90° | độ nghiêng bút |
| `twist` | 0…359° | xoay quanh trục bút |
| `altitudeAngle` / `azimuthAngle` | radian | API mới hơn, thay thế tilt; Safari hỗ trợ trước Chromium |
| `pointerType` | `'pen'` / `'touch'` / `'mouse'` | cửa ngõ để phân biệt bút thật |

Hỗ trợ thực tế: Apple Pencil trên iPadOS Safari, S-Pen trên Android Chrome, Wacom/Huion trên
desktop Chrome/Edge/Firefox. **Ngón tay không có lực thật** — `pressure` trả 0.5 hoặc 1 tuỳ
nền tảng, nên không dùng được để vẽ.

> **Xung đột với P1:** Paint gốc **bỏ qua hoàn toàn** pressure — nét Pencil luôn cứng 1 px.
> Bật pressure mặc định sẽ làm app "cảm giác" khác Paint, tức vi phạm nguyên tắc chủ đạo.

**Cách giải quyết — gate theo `pointerType`, không thêm UI:**

`pressure` chỉ có tác dụng khi `pointerType === 'pen'`. Người dùng chuột và ngón tay nhận
hành vi **giống Paint chính xác**; người dùng bút được thêm lực nhấn. Không cần thêm nút hay
trang settings nào, nên **không ảnh hưởng hình dáng giao diện** → không phá P1 (cùng lập luận
với §21.3).

Phạm vi áp dụng — chỉ các tool mà Paint vốn đã có biến thiên:

| Tool | Pressure ánh xạ vào | Lý do |
|---|---|---|
| Natural pencil | alpha (đang là hàm của **tốc độ** ở §8.2 → đổi sang **lực** khi có bút) | đã biến thiên sẵn |
| Airbrush | mật độ hạt / `rate` | tương đương lực phun |
| Watercolour | số lớp + alpha | |
| Oil brush | độ rộng vệt | |
| Calligraphy 1 / 2 | `tiltX/tiltY` → góc stamp thay cho 45°/135° cố định | bút thật có nghiêng |
| **Pencil, Eraser, Fill, Shapes, Text** | **không ánh xạ** | Paint cho các tool này luôn cứng |

**Yêu cầu kỹ thuật bắt buộc:**
- `touch-action: none` trên canvas, nếu không browser sẽ cuộn/zoom thay vì vẽ.
- `setPointerCapture` (§4.3 đã có) + `getCoalescedEvents()` — bút bắn 120–1000 Hz.
- `pointerrawupdate` (chỉ Chromium) để giảm thêm latency; phải fallback về `pointermove`.
- **Palm rejection:** trong một gesture, khi đã thấy `pointerType === 'pen'` thì bỏ qua mọi
  pointer `'touch'` xảy ra đồng thời — nếu không, lòng bàn tay tì lên tablet sẽ vẽ thêm nét.
- **Làm mượt:** `pressure` thô rất nhiễu. Lọc EMA (α ≈ 0.3) trên chuỗi coalesced trước khi
  dùng, nếu không nét sẽ "răng cưa" về độ dày.
- Thiết bị không báo lực trả đúng 0.5 → phải coi 0.5 là "không có dữ liệu lực", không phải
  "nhấn nửa lực", nếu không chuột sẽ vẽ ra nét mảnh một nửa.

**Kiểm thử:** không tự động hoá được với bút thật. Playwright chỉ dispatch được pointer event
tổng hợp có `pressure` → test được **logic ánh xạ** (§19 tầng unit), còn cảm giác nét phải thử
tay trên iPad + Apple Pencil và một tablet Wacom.

---

## 9. Hệ thống Selection

### 9.1 Vòng đời một vùng chọn

```
  [none]
    │ kéo chuột với select-rect / select-free
    ▼
  [defined]  ── bounds đã có, pixel VẪN nằm trên base
    │ kéo vào trong vùng chọn  │ Ctrl+X / Del │ Crop │ Rotate/Resize
    ▼                          ▼              ▼      ▼
  [floating] ── pixel đã bốc lên preview, base được lấp bằng:
    │             • Color 2 nếu là Cut
    │             • giữ nguyên nếu là Copy-drag (Ctrl khi kéo)
    │ click ra ngoài / Enter / đổi tool
    ▼
  [committed] ── blit xuống base, push history, quay về [none]
```

### 9.2 Free-form selection
Người dùng vẽ một polyline bất kỳ; khi thả chuột path tự động đóng lại.
Triển khai: vẽ path đó lên một canvas mask cùng kích thước, rồi dùng làm alpha mask:

```ts
function extractFreeForm(base: CanvasRenderingContext2D, path: Path2D, bbox: Rect) {
  const mask = new OffscreenCanvas(bbox.w, bbox.h);
  const m = mask.getContext('2d')!;
  m.translate(-bbox.x, -bbox.y);
  m.fill(path);                                    // vùng trong = đục
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = 'source-in';        // giữ pixel ảnh nơi mask đục
  m.drawImage(base.canvas, -bbox.x, -bbox.y);
  return mask;
}
```

### 9.3 Transparent selection
Khi bật, mọi pixel trong vùng chọn có màu **đúng bằng Color 2** sẽ có alpha = 0 khi được vẽ
xuống. Thực hiện bằng một lượt quét `ImageData` ngay lúc extract (so khớp tuyệt đối, không
tolerance).

### 9.4 Marching ants
Vẽ trên `overlay` bằng `setLineDash([4, 4])` với `lineDashOffset` tăng dần, cập nhật qua
`requestAnimationFrame` mỗi ~120 ms (không cần 60 fps cho hiệu ứng này — tiết kiệm CPU).
Vẽ hai lớp: đường trắng liền bên dưới + đường đen nét đứt bên trên, để thấy rõ trên mọi nền.

---

## 10. Thao tác ảnh (Image operations)

### 10.1 Resize and Skew (Ctrl+W)

Dialog hai phần:

**Resize** — radio `Percentage` / `Pixels`, hai ô Horizontal/Vertical, checkbox
☑ *Maintain aspect ratio* (mặc định bật, sửa ô này tự tính ô kia).

**Skew (Degrees)** — Horizontal / Vertical, phạm vi −89…89.

Ma trận biến đổi:

```ts
const rad = (d: number) => d * Math.PI / 180;
// skew: x' = x + tan(hx)·y ;  y' = y + tan(vy)·x
const tx = Math.tan(rad(skewH)), ty = Math.tan(rad(skewV));
const newW = Math.ceil(w * sx + Math.abs(tx) * h * sy);
const newH = Math.ceil(h * sy + Math.abs(ty) * w * sx);

out.setTransform(sx, ty, tx, sy, tx < 0 ? -tx * h * sy : 0, ty < 0 ? -ty * w * sx : 0);
out.drawImage(source, 0, 0);
```

> **Chất lượng khi thu nhỏ:** `drawImage` một bước làm ảnh vỡ hạt khi tỉ lệ < 50%. Dùng
> **downscale từng bước 50%** (halving) cho tới khi gần kích thước đích rồi mới scale nốt —
> chất lượng tốt hơn nhiều mà vẫn nhanh.

Nếu có vùng chọn đang active, Resize/Skew áp dụng cho **vùng chọn**, không phải toàn ảnh.

### 10.2 Rotate & Flip
Xoay 90° → hoán đổi `width`/`height` của tài liệu. Vì là bội số của 90°, không có mất mát
chất lượng: dùng `ctx.rotate` + `drawImage` với `imageSmoothingEnabled = false`.

### 10.3 Crop
`newW = selection.bounds.w`, tạo canvas mới, `drawImage` phần được chọn vào (0,0), thay thế
`base`, cập nhật `document.width/height`, reset selection.

Với free-form selection, Paint crop theo **bounding box**, phần ngoài mask được lấp bằng
Color 2 — không phải trong suốt.

---

## 11. Undo / Redo

### 11.1 Vấn đề
Snapshot toàn bộ `ImageData` mỗi bước: ảnh 1920×1080 = 8.3 MB/bước × 50 bước = **415 MB**.
Không chấp nhận được (NFR-04).

### 11.2 Giải pháp: snapshot theo tile + dirty rect

Chia canvas thành lưới **tile 256×256**. Mỗi thao tác chỉ lưu những tile thực sự thay đổi.

```ts
interface HistoryEntry {
  label: string;                                   // "Pencil", "Fill", "Resize"
  kind: 'tiles' | 'full';
  tiles?: Map<number, Uint8ClampedArray>;          // key = ty * cols + tx, dữ liệu TRƯỚC khi sửa
  full?: { w: number; h: number; data: ImageData };// cho thao tác đổi kích thước
  docSize: { w: number; h: number };
}

class History {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly LIMIT = 50;

  beginStroke() { this.dirty = new Set<number>(); this.backup = new Map(); }

  /** Tool gọi trước khi ghi vào một vùng */
  touch(rect: Rect) {
    for (const id of tilesIntersecting(rect)) {
      if (!this.backup.has(id)) this.backup.set(id, readTile(this.base, id));
      this.dirty.add(id);
    }
  }

  commit(label: string) {
    if (!this.dirty.size) return;
    this.undoStack.push({ label, kind: 'tiles', tiles: this.backup, docSize: currentSize() });
    if (this.undoStack.length > this.LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;                     // nhánh mới → xoá redo
    notifyStore();
  }
}
```

Với nét bút thông thường (dirty ~4 tile), mỗi bước chỉ tốn `4 × 256×256×4 B = 1 MB`; thường
còn ít hơn. Các thao tác toàn ảnh (Resize, Rotate, Invert) dùng `kind: 'full'`.

**Ràng buộc khi ảnh tới 8K (§22.5 Q3):** một entry `kind: 'full'` ở 7680×4320 tốn
**132 MB**; 50 bước như vậy là 6.6 GB — không chấp nhận được. Ba quy tắc bù:

1. **Thao tác khả nghịch lưu lệnh, không lưu pixel.** Rotate 90/180/270 và Flip V/H đều có
   phép nghịch đảo chính xác → lưu `{ kind: 'op', op: 'rotate90' }` và undo bằng cách chạy
   phép ngược. Chi phí bộ nhớ ~0.
2. **Thao tác mất dữ liệu** (Crop, Resize thu nhỏ, Invert colours) buộc phải lưu pixel →
   giới hạn riêng **tối đa 3 entry `full`** trong stack; vượt thì đẩy entry `full` cũ nhất ra
   trước (các entry `tiles` không bị ảnh hưởng).
3. Khi ảnh > 16 Mpx, nén entry `full` bằng `canvas.toBlob('image/png')` trong Worker thay vì
   giữ `ImageData` thô — chậm hơn ~200 ms/bước nhưng giảm ~4–8× bộ nhớ.

### 11.3 Hành vi đặc biệt cần giống Paint
- Undo khi đang có **shape chưa commit** → huỷ shape đó, không đụng tới history.
- Undo khi có **vùng chọn nổi** → thả vùng chọn về chỗ cũ.
- Sau Redo mà người dùng vẽ tiếp → redo stack bị xoá.
- Paint giới hạn **3 bước undo** ở bản cũ; Win10 là 50. Ta dùng 50 (FR-07).

---

## 12. File I/O & Clipboard trên macOS/Linux

### 12.1 Mở file — ba đường vào

| Cách | API | Fallback |
|---|---|---|
| Menu Open | `window.showOpenFilePicker()` | `<input type="file" accept="image/*">` (Firefox/Safari) |
| Kéo-thả | `DataTransfer.items` | — |
| Dán | `navigator.clipboard.read()` | sự kiện `paste` + `clipboardData.items` |

```ts
async function openFile(file: File) {
  const bmp = await createImageBitmap(file);       // giải mã off-main-thread
  if (bmp.width > 8000 || bmp.height > 8000) throw new TooLargeError();
  engine.surface.resize(bmp.width, bmp.height, /*preserve*/ false);
  engine.surface.base.drawImage(bmp, 0, 0);
  bmp.close();                                     // giải phóng bộ nhớ ngay
}
```

> **GIF động:** `createImageBitmap` chỉ lấy frame đầu. Đúng với Paint (Paint cũng không sửa
> được GIF động) — nhưng phải hiện toast báo người dùng biết ảnh động sẽ bị làm phẳng.

### 12.2 Lưu file

| Trường hợp | Cách làm |
|---|---|
| Có `fileHandle` + Chrome/Edge | `handle.createWritable()` → ghi đè trực tiếp (Save thật sự) |
| Không có handle | `showSaveFilePicker()` → nhận handle mới |
| Firefox / Safari | `canvas.toBlob()` → `<a download>` → rơi vào Downloads. **Save luôn = Save as.** |

Phải làm rõ khác biệt này trong UI: trên trình duyệt không hỗ trợ File System Access API,
nút **Save** hiện tooltip "Trình duyệt này sẽ tải file về thư mục Downloads".

### 12.3 Định dạng BMP
Trình duyệt **không encode BMP**. Phải viết encoder thủ công (BMP 24-bit không nén):

```ts
function encodeBMP24(img: ImageData): Blob {
  const { width: w, height: h, data } = img;
  const rowSize = (w * 3 + 3) & ~3;                 // mỗi hàng padding về bội số 4
  const pixelSize = rowSize * h;
  const buf = new ArrayBuffer(54 + pixelSize);
  const dv = new DataView(buf);
  // BITMAPFILEHEADER (14 byte)
  dv.setUint16(0, 0x4d42, true);                    // "BM"
  dv.setUint32(2, 54 + pixelSize, true);
  dv.setUint32(10, 54, true);                       // offset tới dữ liệu pixel
  // BITMAPINFOHEADER (40 byte)
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true);                         // dương = bottom-up
  dv.setUint16(26, 1, true);                        // planes
  dv.setUint16(28, 24, true);                       // bpp
  dv.setUint32(34, pixelSize, true);
  const out = new Uint8Array(buf, 54);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * 4;                // BMP lưu ngược từ dưới lên
    let dst = y * rowSize;
    for (let x = 0; x < w; x++) {
      const i = src + x * 4;
      out[dst++] = data[i + 2];                     // B
      out[dst++] = data[i + 1];                     // G
      out[dst++] = data[i];                         // R
    }
  }
  return new Blob([buf], { type: 'image/bmp' });
}
```

**GIF:** trình duyệt cũng không encode. Dùng thư viện lượng tử hoá màu nhỏ
(`gifenc`, ~8 KB) với thuật toán octree, chạy trong Worker.

**Alpha:** JPEG và BMP không có kênh alpha. Khi lưu sang hai định dạng này, phải **hợp nhất
ảnh lên nền trắng** trước, nếu không vùng trong suốt sẽ thành đen.

### 12.4 Clipboard

```ts
// Copy: cần ClipboardItem với Promise<Blob> để giữ user-gesture trên Safari
async function copyToClipboard(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
```

**Giới hạn thực tế cần ghi vào tài liệu người dùng:**
- Clipboard API chỉ đảm bảo `image/png`. Copy ảnh JPEG ra ngoài sẽ thành PNG.
- Firefox: `navigator.clipboard.read()` bị hạn chế → phải dựa vào sự kiện `paste`
  (người dùng phải nhấn Cmd/Ctrl+V trong tab, không dùng được nút Paste trên ribbon).
- Safari đòi thao tác clipboard xảy ra **đồng bộ** trong user gesture.

### 12.5 In ấn
Tạo iframe ẩn chứa `<img src={dataURL}>` với `@page` CSS, gọi `print()`. Page setup dialog
lưu lề/hướng giấy vào CSS `@page` — nhưng trình duyệt vẫn hiện dialog in riêng của nó, đây
là giới hạn không vượt qua được.

---

## 13. Zoom, Ruler, Gridlines

**Mức zoom:** `[0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8]` — Paint chỉ cho các mức rời rạc này.

**Render khi zoom:** không scale `base` canvas. Thay vào đó đặt CSS:
```css
.canvas-base { width: calc(var(--doc-w) * var(--zoom) * 1px); image-rendering: pixelated; }
```
Trình duyệt scale bằng GPU — nhanh hơn `drawImage` lại mỗi frame.

**Ruler:** hai canvas nhỏ (ngang 20 px, dọc 20 px), vẽ vạch theo zoom. Mốc chia thay đổi để
khoảng cách giữa các nhãn luôn ≥ 40 px: chọn bước từ `[1,2,5,10,20,50,100,200,500]`.
Ruler chỉ bật được khi `zoom ≥ 1` (giống Paint).

**Gridlines:** chỉ hiện khi `zoom ≥ 4`; vẽ lưới 1 px màu `rgba(0,0,0,.2)` mỗi pixel ảnh, trên
lớp overlay.

**Thumbnail:** cửa sổ nổi 180×140 ở góc phải-dưới canvas, hiện toàn ảnh thu nhỏ, có khung đỏ
chỉ vùng đang xem. Kéo khung để cuộn.

---

## 14. Công cụ Text

Đây là tool phức tạp nhất vì phải chèn một vùng nhập liệu **thật** lên canvas.

### 14.1 Cách triển khai
Khi click, tạo một `<textarea>` (hoặc `contenteditable` div) **định vị tuyệt đối đè lên
canvas**, trong suốt, với font đúng như tuỳ chọn. Người dùng gõ vào DOM thật → có sẵn IME
(gõ tiếng Việt, tiếng Nhật), con trỏ, select, undo của trình duyệt.

Khi commit (click ra ngoài / Esc / đổi tool):
```ts
ctx.font = `${bold?'bold ':''}${italic?'italic ':''}${sizePt * 96/72}px "${family}"`;
ctx.textBaseline = 'top';
ctx.fillStyle = color1;
if (background === 'opaque') { ctx.fillStyle = color2; ctx.fillRect(box); }
lines.forEach((line, i) => ctx.fillText(line, box.x + 1, box.y + i * lineHeight));
// underline / strikethrough vẽ thủ công bằng fillRect
```

### 14.2 Ribbon tab ngữ cảnh "Text"
Khi text box đang mở, một **tab mới xuất hiện** trên ribbon (giống Paint), chứa:
- Nhóm **Font**: dropdown font family, dropdown size, B / I / U / abc̶
- Nhóm **Background**: Transparent / Opaque (radio)
- Nhóm **Clipboard**, **Colors** (dùng lại component)

Tab này biến mất khi commit. Tab cũ (Home) được khôi phục.

### 14.3 Danh sách font
Không thể enumerate font hệ thống (trừ Chrome với `queryLocalFonts()` cần quyền). Giải pháp:
- Danh sách cố định các font web-safe + font phổ biến mỗi HĐH, kiểm tra tồn tại bằng kỹ thuật
  đo chiều rộng chuỗi so với font fallback.
- Nếu trình duyệt hỗ trợ `window.queryLocalFonts` → hỏi quyền một lần, dùng danh sách thật.

---

## 15. Hiệu năng

| Vấn đề | Giải pháp |
|---|---|
| `pointermove` bắn 120–1000 Hz (bút vẽ) | Gom bằng `getCoalescedEvents()`, xử lý 1 lần/frame trong rAF |
| React re-render khi kéo chuột | Nét vẽ đi thẳng vào engine, không qua store. Store chỉ cập nhật ở `pointerup` |
| Toạ độ trên status bar cập nhật liên tục | Throttle 60 ms, và dùng `useSyncExternalStore` chỉ subscribe ô đó |
| Flood fill / filter trên ảnh lớn | Web Worker + `ImageData` transferable; hiện progress nếu > 300 ms |
| Bộ nhớ history | Tile-based (§11.2) + giới hạn 50 bước + `structuredClone` tránh giữ tham chiếu canvas |
| Đọc pixel chậm | `getContext('2d', { willReadFrequently: true })` cho canvas hay dùng `getImageData` |
| Zoom lớn làm canvas DOM khổng lồ | Ở zoom ≥ 4, chỉ render **phần nhìn thấy**: vẽ vùng viewport từ base lên một canvas cỡ màn hình (virtualized) |
| Ảnh > 4000 px | Cảnh báo trước; tự động chuyển sang chế độ virtualized render |
| Ảnh 6K/8K (§22.5 Q3) | Giới hạn **diện tích canvas** của browser là ràng buộc thật, không phải RAM — và mỗi browser một mức (iOS Safari thấp nhất, quanh 16.7 Mpx ≈ 4096², trong khi 8K là 33.2 Mpx). Phải **probe lúc khởi động** thay vì hard-code |
| Vượt giới hạn canvas đơn | Chia `base` thành nhiều canvas kề nhau (tile-surface) hoặc giữ bitmap ngoài DOM và luôn chạy virtualized render — không dựng một canvas 8K trong DOM |
| `willReadFrequently` trên ảnh 8K | **Không** đặt trên `base`: nó ép surface về CPU, ăn thêm ~130 MB. Chỉ đặt trên canvas scratch nhỏ dùng cho `getImageData` |
| Encode ảnh 8K | Bắt buộc trong Worker + `OffscreenCanvas`. BMP 24-bit ở 8K ≈ **99.5 MB**; phải ghi theo chunk, không nối một `Uint8Array` khổng lồ |

**Ngân sách frame (16.6 ms):**
```
pointer coalescing + toạ độ     ~0.3 ms
stamp nét lên preview            ~2–4 ms
composite preview lên màn hình   ~1 ms (GPU)
overlay (marching ants, handle)  ~0.5 ms
────────────────────────────────────────
dự trữ                           ~10 ms
```

---

## 16. Phím tắt

Giữ nguyên phím tắt của Paint. Trên macOS, **Ctrl được ánh xạ thành ⌘** cho các lệnh chuẩn
(N/O/S/Z/X/C/V/A/P), còn các lệnh riêng của Paint (W/E/G/R, PgUp/PgDn) giữ nguyên Ctrl.

| Phím | Lệnh |
|---|---|
| Ctrl/⌘ + N | New |
| Ctrl/⌘ + O | Open |
| Ctrl/⌘ + S | Save |
| Ctrl/⌘ + Shift + S | Save as |
| Ctrl/⌘ + P | Print |
| Ctrl/⌘ + Z | Undo |
| Ctrl/⌘ + Y *(hoặc ⌘⇧Z)* | Redo |
| Ctrl/⌘ + A | Select all |
| Ctrl/⌘ + I | Invert selection |
| Ctrl/⌘ + X / C / V | Cut / Copy / Paste |
| Ctrl + W | Resize and Skew |
| Ctrl + E | Image properties |
| Ctrl + G | Gridlines |
| Ctrl + R | Rulers |
| Ctrl + PgUp / PgDn | Zoom in / out |
| Ctrl + `+` / `-` | Tăng / giảm size nét |
| F11 | Full screen |
| Delete | Xoá vùng chọn |
| Esc | Huỷ vùng chọn / shape đang vẽ / text box |
| Enter | Commit shape / text |
| ← ↑ → ↓ | Dịch vùng chọn 1 px |
| Shift + kéo | Ép tỉ lệ (vuông, tròn, 45°) |
| Ctrl + kéo vùng chọn | Nhân bản vùng chọn |
| Shift + kéo vùng chọn | Kéo vệt (stamp liên tục) |

`useKeyboardShortcuts` phải **bỏ qua** khi focus đang ở `<input>`, `<textarea>`, hoặc text box
trên canvas — trừ Esc và Enter.

---

## 17. Theming & CSS

### 17.1 Design token

```css
:root {
  /* Ribbon */
  --rb-bg:            #f0f0f0;
  --rb-tab-active:    #ffffff;
  --rb-tab-hover:     #d4e7fb;
  --rb-border:        #dadada;
  --rb-group-label:   #6d6d6d;
  --rb-btn-hover-bg:  linear-gradient(#fdfbf7, #f2eee6);
  --rb-btn-hover-bd:  #d3c8b4;
  --rb-btn-active-bg: linear-gradient(#e5c365, #f6e8b1);
  --rb-btn-active-bd: #c2a75f;
  --rb-selected-bg:   #cde6f7;   /* tool đang chọn */
  --rb-selected-bd:   #7da2ce;

  /* Title bar */
  --tb-bg:            #ffffff;
  --tb-text:          #000000;
  --tb-close-hover:   #e81123;

  /* Canvas area */
  --cv-backdrop:      #c5cbd8;
  --cv-border:        #a0a0a0;
  --cv-handle-bd:     #000000;
  --cv-handle-bg:     #ffffff;

  /* Metrics */
  --rb-height:        94px;
  --tab-height:       24px;
  --title-height:     32px;
  --status-height:    24px;
  --font-ui:          "Segoe UI", "Selawik", "Inter", system-ui, sans-serif;
  --font-ui-size:     12px;
}
```

### 17.2 Kỹ thuật tái tạo Ribbon
- Nhóm ribbon = `flex` dọc: vùng nút (flex:1) + nhãn nhóm căn giữa ở đáy, `font-size: 11px`,
  màu `--rb-group-label`, có đường phân cách dọc 1px bên phải.
- Nút lớn (Paste, Select, Brushes): icon 32×32 ở trên, nhãn 2 dòng ở dưới, rộng cố định 52–64 px.
- Split button: phần trên (icon) và phần dưới (nhãn + ▾) là 2 vùng hover riêng biệt, ngăn bởi
  đường 1px hiện khi hover.
- Hiệu ứng hover/active mô phỏng bằng `linear-gradient` + `inset box-shadow` 1px trắng ở trên.

### 17.3 Vấn đề font trên macOS/Linux
Segoe UI **không có** trên macOS/Linux. Ba lựa chọn:

| Phương án | Ưu | Nhược | Quyết định |
|---|---|---|---|
| Nhúng Segoe UI | Giống 100% | **Vi phạm bản quyền Microsoft** | ❌ Không |
| Dùng **Selawik** (Microsoft mã nguồn mở, MIT, metric-compatible với Segoe UI) | Hợp pháp, khớp metric gần như hoàn toàn | +40 KB woff2 | ✅ **Chọn** |
| Fallback system-ui | 0 KB | Layout lệch, cảm giác khác hẳn | Chỉ làm fallback cuối |

Subset Selawik chỉ các ký tự Latin + tiếng Việt → ~28 KB woff2.

### 17.4 Dark mode
**Không làm.** Paint Win10 không có dark mode; thêm vào sẽ vi phạm P1. Nếu người dùng yêu cầu,
đưa vào backlog như một tuỳ chọn tắt mặc định.

---

## 18. Accessibility & i18n

Đây là điểm ta **có thể vượt Paint gốc mà không phá fidelity thị giác**:

- Mọi nút ribbon là `<button>` thật, có `aria-label`, `aria-pressed` cho toggle,
  `aria-expanded` cho dropdown.
- Ribbon dùng pattern **toolbar**: `role="toolbar"`, điều hướng bằng mũi tên trái/phải,
  chỉ một nút nằm trong tab order (roving tabindex).
- Dropdown/gallery: `role="menu"` + `role="menuitemradio"`, đóng bằng Esc, trả focus về nút mở.
- Dialog: focus trap, `aria-modal="true"`, Esc để đóng.
- Canvas: `role="img"` với `aria-label` mô tả kích thước; thông báo kết quả thao tác qua vùng
  `aria-live="polite"` ("Đã cắt ảnh còn 800 × 600").
- Tương phản: kiểm tra WCAG AA cho text trên ribbon (màu xám `#6d6d6d` trên `#f0f0f0` đạt 4.6:1 ✓).
### 18.1 i18n — pipeline CSV → JSON

Hỗ trợ **`en` + `vi`** ngay từ v1. Dùng `i18next` + `react-i18next`, và **nguồn sự thật là một
file CSV**, JSON được sinh ra chứ không sửa tay.

Khác `chat-app`: **không** tách thư mục `Tools/` — CSV, script sinh và JSON nằm **cùng một
chỗ** trong `src/locales/`, để sửa chuỗi không phải nhảy qua lại hai nhánh cây thư mục:

```
src/locales/
├─ language.csv           # NGUỒN SỰ THẬT — chỉ sửa ở đây
├─ generate-language.sh   # CSV → JSON; chạy: ./src/locales/generate-language.sh
├─ convert-to-json.py     # bộ chuyển, gọi từ script trên
├─ i18n.ts                # khởi tạo i18next, fallback 'en', cache localStorage key "language"
├─ translate.ts           # helper KHÔNG phải hook, cho code ngoài React
├─ en.json                # SINH RA — không sửa tay
└─ vi.json                # SINH RA — không sửa tay
```

**Không dùng `.xlsx`.** `chat-app` giữ một bản Excel song song (kéo theo `venv` + `openpyxl` +
`update-excel-from-csv.py`) cho người dịch không quen CSV. Ở đây bỏ hẳn: `csv` và `json` đều là
stdlib của Python, nên `generate-language.sh` **không cần venv, không cần `pip install`** —
chạy được ngay trên máy trống. Nếu sau này cần đưa file cho người dịch không dùng CSV thì thêm
lại, nhưng đừng thêm trước khi thực sự có nhu cầu.

**Định dạng CSV** (giữ đúng convention của `chat-app`): phân tách bằng **`;`**, encoding
**UTF-8 BOM** (`utf-8-sig`), key phân cấp bằng dấu chấm, tham số dạng `{0}`:

```csv
Key;English;Vietnamese
ribbon.tab.home;Home;Trang chủ
ribbon.home.clipboard.paste;Paste;Dán
ribbon.home.image.resize;Resize;Đổi kích thước
statusbar.selection-size;{0} × {1}px;{0} × {1}px
dialog.confirm-discard.message;Do you want to save changes to {0}?;Bạn có muốn lưu thay đổi cho {0} không?
history.label.pencil;Pencil;Bút chì
```

`convert-to-json.py` tách key theo `.` thành object lồng nhau rồi ghi JSON thụt bằng **tab**
(giữ nguyên cách format của `chat-app` để diff dễ đọc).

Quy trình: sửa `language.csv` → chạy `./src/locales/generate-language.sh` → commit **cả CSV lẫn
JSON**. JSON phải vào git vì `i18n.ts` `import` trực tiếp chúng, tức Vite cần chúng lúc build —
không thể sinh lúc runtime.

> Vì CSV nằm trong `src/`, thêm `src/locales/*.csv` và `*.py`/`*.sh` vào phần `exclude` của
> `tsconfig.json` là không cần thiết (tsc chỉ nhìn `.ts`/`.tsx`), nhưng **phải** chắc chúng
> không bị bundle: Vite chỉ bundle thứ được `import`, nên chỉ cần không import chúng ở đâu cả.

**Khác `chat-app` ba điểm:**
1. Gom CSV + script + JSON vào một thư mục `src/locales/`, không có `Tools/`.
2. Chỉ 2 cột ngôn ngữ (`English`, `Vietnamese`), không có `Japanese`; bỏ luôn nhánh `.xlsx`.
3. `translate.ts` ở đây **quan trọng hơn hẳn**: engine là module TS thuần, không có React
   (§5), nhưng vẫn cần chuỗi — nhãn history `"Pencil"`/`"Fill"` cho tooltip Undo (§21.3) và
   thông báo `aria-live` (§18). Những chỗ đó gọi `translate('history.label.pencil')`, không
   gọi được `useTranslation()`.

**Bẫy cần test:** nhãn nhóm ribbon tiếng Việt dài hơn tiếng Anh đáng kể ("Clipboard" → "Bảng
tạm", "Resize" → "Đổi kích thước"). Ribbon **không** co giãn theo chiều rộng (§7.1) nên chuỗi
dài sẽ bị `overflow: hidden` cắt mất. Visual regression (§19) phải chụp **cả hai** ngôn ngữ.

---

## 19. Kiểm thử

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Unit | Vitest | `floodFill` (biên, màu giống, vùng kín/hở), `encodeBMP24` (so với file mẫu), chuyển đổi màu HSL↔RGB theo thang Windows, ma trận skew, `screenToImage` ở các mức zoom |
| Engine | Vitest + `node-canvas` | Vẽ một nét pencil xác định → so sánh hash `ImageData` với snapshot vàng |
| Component | RTL | Ribbon: click tool → `aria-pressed` đổi; menu đóng khi Esc; roving tabindex |
| Visual regression | Playwright + `toHaveScreenshot` | Chụp ribbon ở 3 tab, so với ảnh chuẩn, ngưỡng 0.1% pixel khác |
| E2E | Playwright | Luồng: mở ảnh → crop → vẽ mũi tên đỏ → thêm text → lưu PNG → mở lại kiểm tra kích thước |
| Hiệu năng | Playwright trace | Vẽ 500 điểm liên tục trên ảnh 2000×2000, khẳng định không có frame > 32 ms |

**Test đối chiếu fidelity:** giữ một thư mục `fixtures/paint-win10/` chứa ảnh chụp Paint thật
ở từng trạng thái, dùng làm mốc so sánh thủ công trong review — không tự động hoá được nhưng
là tài liệu tham chiếu bắt buộc cho reviewer.

---

## 20. Lộ trình triển khai

### 20.1 Phase

| Phase | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| **P0 — Nền móng** (1 tuần) | Vite + TS + store, Surface 3 lớp, viewport + scroll + zoom, status bar, khung ribbon rỗng có 3 tab | Mở được app, canvas trắng 1152×648, zoom và xem toạ độ chạy đúng |
| **P1 — Vẽ cơ bản** (1.5 tuần) | Pencil, Eraser, Fill, Picker, Magnifier; Size; Colors + palette; History tile-based | Vẽ và undo/redo hoạt động; đây là lúc chạy được thử nghiệm người dùng đầu tiên |
| **P2 — File** (1 tuần) | Open (3 đường vào), Save/Save as 5 định dạng, encoder BMP+GIF, clipboard, dirty tracking, beforeunload | Chỉnh sửa trọn vòng đời một file |
| **P3 — Hình & chọn** (2 tuần) | 23 shapes, Outline/Fill, shape editable sau khi thả; Selection chữ nhật + tự do, move/cut/copy/paste, transparent selection | Annotate screenshot đầy đủ |
| **P4 — Ảnh & Text** (1.5 tuần) | Crop, Resize/Skew dialog, Rotate/Flip, Text tool + tab ngữ cảnh | Ngang tính năng Paint cho công việc thực tế |
| **P5 — Brushes & View** (1 tuần) | 9 brush, Ruler, Gridlines, Thumbnail, Full screen, Edit colours dialog | Đủ tính năng v1.0 |
| **P6 — Hoàn thiện** (1.5 tuần) | A11y pass, i18n vi/en qua pipeline CSV (§18.1), pressure cho bút (§8.6), PWA + File Handling, visual regression, đường 6K/8K (§15) | Sẵn sàng phát hành |
| **P7 — Phát hành** (0.5 tuần) | Dọn §21.2, CSP + header, domain + HTTPS, manifest `file_handlers`, trang giới thiệu/miễn trừ | App chạy công khai trên domain thật |

Tổng ước tính: **~10.5 tuần** cho 1 dev full-time, hoặc ~6.5 tuần cho 2 dev (P3 và P4 song song được).

### 20.2 Deploy công khai

Chốt: **deploy công khai** (§22.5 Q4). Toàn bộ app chạy client-side nên không cần backend —
hosting tĩnh là đủ (Cloudflare Pages / Vercel / Netlify / GitHub Pages).

**Bắt buộc có HTTPS** — ba API cốt lõi của app chỉ chạy trên secure context:
File System Access (§12.1–12.2), `getUserMedia` cho "From camera" (§7.3), Clipboard API (§12.4).
Trên `http://` thì Save sẽ im lặng rơi về chế độ tải xuống — phải test trên chính domain thật,
không chỉ trên `localhost` (localhost được coi là secure nên **không** lộ lỗi này).

| Hạng mục | Yêu cầu |
|---|---|
| CSP | `default-src 'self'; connect-src 'self'; img-src 'self' blob: data:; object-src 'none'`. `img-src` phải có `blob:` và `data:` vì canvas xuất ảnh qua hai scheme đó |
| Quyền riêng tư | NFR-07 đã cấm gửi dữ liệu ảnh đi. Deploy công khai biến nó thành lời hứa với người lạ → **nói rõ trên trang** rằng ảnh không rời khỏi máy, và đừng gắn analytics có thể nuốt tên file |
| PWA | `manifest.webmanifest` khai báo `file_handlers` cho `image/png,jpeg,bmp,gif,webp` để app nhận "Open with"; cần Service Worker precache |
| Cache | Asset băm nội dung + `immutable`; riêng `index.html` và SW phải `no-cache`, nếu không người dùng kẹt ở bản cũ |
| GitHub Pages | Không đặt được response header → CSP phải nhúng bằng thẻ `<meta>`, và mất khả năng đặt `Cross-Origin-*`. Nếu cần header thật thì chọn Cloudflare Pages / Netlify |
| Giám sát | Chỉ log lỗi ẩn danh (kích thước ảnh, tên tool) — **không bao giờ** log nội dung ảnh hay tên file |

---

## 21. Khác biệt & hạn chế so với Paint gốc

### 21.1 Những chỗ buộc phải làm khác

| Tính năng Paint | Vấn đề trên web | Cách xử lý |
|---|---|---|
| Nút Minimize | Trình duyệt không cho thu nhỏ tab | Hiển thị nhưng disabled, tooltip giải thích |
| Nút Close | `window.close()` chỉ chạy với cửa sổ do script mở | Thử đóng; thất bại → dialog hướng dẫn |
| Save ghi đè | Firefox/Safari không có File System Access API | Save = tải về Downloads; báo rõ trong tooltip |
| Set as desktop background | Không có API | Gỡ bỏ |
| From scanner | Không có API | Thay bằng "From camera" (`getUserMedia`) |
| Send in email | `mailto:` không đính kèm được | Thay bằng "Copy to clipboard" |
| Đọc font hệ thống | Bị chặn vì fingerprinting | Danh sách cố định + `queryLocalFonts` khi có |
| Lưu GIF/BMP | Trình duyệt không encode | Encoder tự viết (§12.3) |
| Segoe UI | Font có bản quyền | Dùng Selawik (§17.3) |

### 21.2 Vấn đề pháp lý cần lưu ý trước khi phát hành

> ⚠️ **Phải xử lý trước khi public:**
> 1. **Icon:** toàn bộ icon phải được **vẽ lại**, không trích xuất từ `mspaint.exe` hay
>    `imageres.dll`. Đó là tài sản có bản quyền của Microsoft.
> 2. **Tên gọi:** không đặt tên sản phẩm là "Paint" hoặc "MS Paint" — đây là nhãn hiệu. Dùng
>    tên riêng (ví dụ "Repaint", "Canvas Classic") và mô tả là *"giao diện lấy cảm hứng từ
>    Microsoft Paint"*. Không dùng logo Microsoft.
>
>    ⚠️ **Mâu thuẫn chưa giải quyết:** §22.5 Q1 đã chốt tên là **"Paint Web"**, trong khi
>    Q4 chốt **deploy công khai** — đúng hai điều kiện làm cảnh báo này có hiệu lực. Xem
>    §22.5 Q1 để biết rủi ro cụ thể và các lựa chọn giảm thiểu. Đây là quyết định của chủ
>    dự án, không phải của tài liệu, nhưng tài liệu có trách nhiệm ghi lại rằng nó đã được
>    cảnh báo.
> 3. **Font:** không nhúng Segoe UI.
>
> Bản thân việc mô phỏng giao diện (look & feel) nhìn chung không bị cấm, nhưng ba điểm trên
> là rủi ro cụ thể và có thật. Nếu dự án chỉ dùng nội bộ, rủi ro thấp hơn nhiều — nhưng vẫn
> nên tuân thủ.

### 21.3 Chỗ ta cố ý làm tốt hơn
- Undo 50 bước có nhãn ("Undo Pencil") hiện trong tooltip.
- Keyboard accessibility đầy đủ (Paint gốc rất kém khoản này).
- Cảnh báo mất dữ liệu khi đóng tab.
- Auto-recovery từ IndexedDB sau crash.

Cả bốn đều **không thay đổi hình dáng giao diện**, nên không vi phạm P1.

---

## 22. Phụ lục

### 22.1 Bảng màu chuẩn của Paint (20 màu)

**Hàng 1:**

| Tên | Hex |
|---|---|
| Black | `#000000` |
| Grey-50% | `#7F7F7F` |
| Dark red | `#880015` |
| Red | `#ED1C24` |
| Orange | `#FF7F27` |
| Yellow | `#FFF200` |
| Green | `#22B14C` |
| Turquoise | `#00A2E8` |
| Indigo | `#3F48CC` |
| Purple | `#A349A4` |

**Hàng 2:**

| Tên | Hex |
|---|---|
| White | `#FFFFFF` |
| Grey-25% | `#C3C3C3` |
| Brown | `#B97A57` |
| Rose | `#FFAEC9` |
| Gold | `#FFC90E` |
| Light yellow | `#EFE4B0` |
| Lime | `#B5E61D` |
| Light turquoise | `#99D9EA` |
| Blue-grey | `#7092BE` |
| Lavender | `#C8BFE7` |

```ts
export const PAINT_PALETTE = [
  '#000000','#7F7F7F','#880015','#ED1C24','#FF7F27',
  '#FFF200','#22B14C','#00A2E8','#3F48CC','#A349A4',
  '#FFFFFF','#C3C3C3','#B97A57','#FFAEC9','#FFC90E',
  '#EFE4B0','#B5E61D','#99D9EA','#7092BE','#C8BFE7',
] as const;
```

### 22.2 Bảng ánh xạ định dạng

| Format | MIME | Encode bằng | Alpha | Ghi chú |
|---|---|---|---|---|
| PNG | `image/png` | `canvas.toBlob` | ✓ | Mặc định |
| JPEG | `image/jpeg` | `canvas.toBlob(q)` | ✗ | Hợp nhất nền trắng trước; q mặc định 0.92 |
| BMP | `image/bmp` | Encoder tự viết | ✗ | 24-bit không nén |
| GIF | `image/gif` | `gifenc` trong Worker | 1-bit | Lượng tử hoá 256 màu |
| WEBP | `image/webp` | `canvas.toBlob` | ✓ | Safari ≥ 16 |

### 22.3 Danh sách 23 shapes theo đúng thứ tự trong gallery

```
Hàng 1: Line, Curve, Oval, Rectangle, Rounded rectangle, Polygon, Right triangle, Triangle
Hàng 2: Diamond, Pentagon, Hexagon, Right arrow, Left arrow, Up arrow, Down arrow, Four-point star
Hàng 3: Five-point star, Six-point star, Rounded rectangular callout, Oval callout,
        Cloud callout, Heart, Lightning
```

### 22.4 Ma trận hỗ trợ trình duyệt

| Tính năng | Chrome/Edge | Firefox | Safari |
|---|---|---|---|
| Canvas 2D, pointer events | ✓ | ✓ | ✓ |
| `getCoalescedEvents` | ✓ | ✓ | ✓ 18+ |
| File System Access API | ✓ | ✗ | ✗ |
| `navigator.clipboard.write` | ✓ | ✓ 127+ | ✓ |
| `navigator.clipboard.read` | ✓ | ⚠️ hạn chế | ✓ |
| `OffscreenCanvas` | ✓ | ✓ | ✓ 16.4+ |
| `queryLocalFonts` | ✓ | ✗ | ✗ |
| WEBP encode | ✓ | ✓ | ✓ 16+ |
| File Handling API (PWA) | ✓ | ✗ | ✗ |

Trên Firefox/Safari, app vẫn dùng được đầy đủ để vẽ và lưu — chỉ khác ở cách lưu file
(tải về thay vì ghi đè) và nút Paste trên ribbon (phải dùng Ctrl/Cmd+V).

### 22.5 Quyết định đã chốt (2026-09-18)

Bốn câu hỏi mở đã được chủ dự án chốt. Ghi lại cả quyết định lẫn hệ quả kéo theo.

**Q1 — Tên sản phẩm: `Paint Web`.**

Title bar hiển thị `{fileName} - Paint` (§7.2) để giữ fidelity, tên sản phẩm/domain là
"Paint Web".

> ⚠️ Quyết định này **xung đột trực tiếp với §21.2 mục 2**, và Q4 (deploy công khai) làm xung
> đột đó có hiệu lực thật. Rủi ro cụ thể: "Microsoft Paint" là nhãn hiệu đã đăng ký; một web
> app tái tạo y nguyên giao diện Paint **và** mang chữ "Paint" trong tên sản phẩm là tổ hợp dễ
> bị coi là gây nhầm lẫn về nguồn gốc, hơn là chỉ mô tả chức năng.
>
> Tôi không phải luật sư và đây không phải tư vấn pháp lý. Ba lựa chọn giảm thiểu, không loại
> trừ nhau:
> 1. Giữ `paint-web` làm **tên repo / codename**, đặt tên hiển thị khác (Repaint, Canvas
>    Classic…) cho phần công khai. Rẻ nhất, gần như xoá hết rủi ro.
> 2. Giữ "Paint Web" nhưng thêm miễn trừ rõ ràng ở trang chủ và dialog About: *"không liên kết
>    với Microsoft; giao diện lấy cảm hứng từ Microsoft Paint"* — About đã có câu này
>    (`AboutDialog.tsx`). Giảm rủi ro nhầm lẫn nhưng không xoá được vấn đề tên.
> 3. Giữ nguyên và chấp nhận rủi ro. Hợp lý nếu lưu lượng thấp / phi thương mại, nhưng cần
>    biết là mình đang chấp nhận, không phải không biết.
>
> Đây là quyết định kinh doanh của chủ dự án. Tài liệu chỉ có trách nhiệm ghi rằng đã cảnh báo.

**Q2 — Bút cảm ứng lực nhấn: CÓ, nhưng gate theo `pointerType === 'pen'`.**

Đảo ngược đề xuất cũ ("không ở v1"). Web hỗ trợ đầy đủ qua Pointer Events; đặc tả chi tiết ở
**§8.6**. Điểm cốt lõi: chuột và ngón tay giữ hành vi **giống Paint chính xác**, chỉ bút thật
mới nhận pressure/tilt — nên không thêm UI nào và không phá P1. Chỉ 6 tool có biến thiên sẵn
được ánh xạ; Pencil/Eraser/Fill/Shapes/Text giữ nguyên cứng như Paint. Vào P6.

**Q3 — Kích thước ảnh: hỗ trợ 6K (6144×3456) và 8K (7680×4320).**

NFR-02 đã nâng lên. Ràng buộc thật **không phải RAM mà là giới hạn diện tích canvas của
browser**, và mỗi browser một mức — iOS Safari thấp nhất (quanh 16.7 Mpx ≈ 4096², trong khi 8K
là 33.2 Mpx, tức **vượt**). Hệ quả đã ghi vào §15: probe giới hạn lúc khởi động thay vì
hard-code, vượt giới hạn thì chia tile-surface / luôn virtualized, không đặt
`willReadFrequently` trên `base`, encode trong Worker. §11 thêm ba quy tắc chặn history phình
(thao tác khả nghịch lưu lệnh thay vì pixel, tối đa 3 entry `full`, nén PNG khi > 16 Mpx).

Lưu ý phạm vi: "From camera" (§7.3) **không** đạt 6K/8K — `getUserMedia` bị chặn bởi hardware,
thường tối đa 4K. Đường 6K/8K là để **mở và sửa** ảnh/screenshot có sẵn, không phải để chụp.

**Q4 — Deploy công khai: CÓ.**

Đặc tả ở **§20.2**, thêm phase **P7** vào lộ trình. Kéo theo: §21.2 chuyển từ "nên tuân thủ"
sang **bắt buộc xử lý trước khi phát hành**, HTTPS là điều kiện tiên quyết cho ba API cốt lõi,
và NFR-07 (không gửi dữ liệu ảnh đi) trở thành lời hứa công khai nên cần nói rõ trên trang.

---

*Hết tài liệu.*
