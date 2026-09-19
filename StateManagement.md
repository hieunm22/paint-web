# Zustand hay Redux Toolkit cho paint-web — quyết định

## 0. Kết luận

**Giữ Redux Toolkit.** Biên độ: **hẹp**, và lý do không phải chi phí đổi.

Phải nói rõ ngay, vì bản nháp trước của chính tôi đã sai chỗ này: **đổi sang Zustand là rẻ.** Khoảng 279 dòng cơ chế viết lại cộng 120 điểm nối trong 23 file — nửa ngày, `types.ts` (95 dòng) đi thẳng sang không sửa. Tôi cũng từng viết rằng "lần port trước đã làm mất 4 field có trong spec"; **điều đó không có bằng chứng và tôi rút lại** (§1). Nếu lập luận của tôi là "đổi thì tốn", thì lập luận đó đã chết.

Cái còn sống là ba điều:

1. **Không có năng lực nào thu được.** Luận điểm kỹ thuật duy nhất từng làm Zustand *bắt buộc* — rằng RTK không giữ nổi `floating: ImageBitmap` / `mask: ImageData` của §6 — **đã đo và là sai**; tôi rút lại nó ở §4 kèm số. Mọi thứ Zustand thắng còn lại cộng lại là **vài giờ** trên lộ trình ~10.5 tuần (§20.1, dòng 1431).
2. **§3 dòng 133 là một quyết định có ngày tháng**, không phải mặc định trôi vào: *"Chốt ngày 2026-09-18: dùng RTK cho quen tay và devtools."* Lật lại một quyết định đã chốt cần một lý do mới; sau khi đo, không có lý do mới nào đứng vững.
3. **"Quen tay" là tiêu chí trọng số cao nhất mà không bên nào bác được** — và nó là tiêu chí duy nhất trong bảng §8 không đo được bằng dòng code.

Kết luận này có điều kiện: giữ RTK chỉ đúng nếu làm xong **5 việc ở §10 mục 1–5 trước dòng engine đầu tiên** (mục 6–8 là kỷ luật chạy dài, không phải điều kiện). Trong đó việc số 1 — xoá `ui.cursor` — đáng giá hơn cả quyết định này.

Nếu bạn chỉ đọc một dòng: **cả hai thư viện đều dư sức cho app này; thứ thực sự quyết định hiệu năng của paint-web nằm ngoài cả hai.** §15 dòng 1197 cấm store dính vào `pointermove`, và code hôm nay đang vi phạm đúng điều đó (§9).

---

## 1. Store này thật ra là cái gì (đo trên repo)

Trước khi so thư viện, phải nhìn đúng đối tượng. Đây không phải một app Redux điển hình.

| Chỉ số | Giá trị đo được | Nguồn |
|---|---|---|
| Kích thước store layer | 374 dòng / 7 file; trừ `types.ts` (95 dòng, portable cho cả hai) → **279 dòng cơ chế RTK** | `wc -l src/store/**` |
| Số reducer | **32** (tool 8, ui 8, colors 4, doc 5, view 4, selection 3) | đọc 6 slice |
| Độ sâu ghi state sâu nhất | **1 cấp**: `Object.assign(state.text, action.payload)` (`toolSlice.ts:54`), `state.custom[free] = …` (`colorsSlice.ts:30`) | đọc toàn bộ 32 reducer |
| Điểm đọc state | **50** `useAppSelector` trong **19** file; **11** trong số đó subscribe cả slice | grep |
| Điểm ghi state | **54** `dispatch(`, **16** `useAppDispatch()` | grep |
| Tổng điểm nối UI↔store | **120** (50 + 54 + 16) trong **23** file import từ `store/` | grep |
| Tổng `src` | 2331 dòng TS/TSX → migration chạm ≈ **12%** | `wc -l` |
| Engine | `src/engine/color.ts` (9 dòng) + `src/engine/tools/` **rỗng** → chưa viết | `find src/engine` |
| `useSyncExternalStore` / `createSelector` / `localStorage` trong `src` | **0 / 0 / 0** | grep |
| Action creator chưa ai dispatch | **10 / 32** (xem §10 mục 7) | grep từng tên |
| Test | **không có** — `package.json` chỉ có `dev`, `build`, `preview`, `typecheck` | `package.json` |

Nghĩa là: store là **một object cấu hình phẳng ~70 scalar, dưới 2KB JSON**, một document duy nhất, không server, không remote data. Toàn bộ dữ liệu nặng nằm ngoài React theo §4.4 (dòng 252–254) và §11.2. Đây là ngữ cảnh mà mọi "ưu điểm kinh điển" của Redux đều không được kích hoạt, và cũng là ngữ cảnh mà mọi ưu điểm của Zustand đều chỉ đáng vài chục dòng.

### 1.1 Rút lại: không có "lần port trước làm mất field"

Bản nháp trước của tôi lặp lại bốn lần rằng lần chuyển từ Zustand sang RTK "đã làm mất 4 field có trong spec", và dùng đó làm bằng chứng rằng lần đổi tiếp theo sẽ lặp lại lỗi. **Kiểm tra git: tiền lệ đó không tồn tại.**

```
git log --all --stat  →  646893f  first commit   README.md | 1 +
git ls-files          →  DESIGN.md, README.md
```

Toàn bộ `src/` còn **untracked**. Không có commit nào của bản Zustand trong lịch sử để mà "regress khỏi". Và `src/store/types.ts:1` ghi rõ phạm vi của chính nó:

```ts
/** Kiểu dữ liệu theo §6 của DESIGN.md — phần UI cần đến. */
```

Các field thiếu là **port chưa xong theo đúng phạm vi đã khai báo**, không phải thiệt hại do áp lực thư viện. Rủi ro của một lần đổi thư viện phải được lập luận từ đầu — và như §13 chỉ ra, nó lớn hơn người ta tưởng vì **repo không có một test nào**.

### 1.2 Deviation so với §6 trong code hôm nay

| Field trong §6 / §4.4 | Trạng thái | Nguyên nhân thật |
|---|---|---|
| `floating: ImageBitmap` (dòng 450), `mask: ImageData` (452) | thiếu | **quyết định kiến trúc**, xem dưới |
| `isDragging` (dòng 454) | thiếu | ngoài phạm vi "phần UI cần đến"; boolean thuần, trả lại được ngay |
| `fileHandle?: FileSystemFileHandle` (dòng 380) | thiếu | §7.3 dòng 545 (Save ghi đè) phụ thuộc nó; thuộc P2 |
| `scrollX` / `scrollY` (dòng 437) | thiếu | number thuần; viewport hiện chưa có scroll state |
| `history: HistoryState` (§4.4 dòng 247) | chưa có | `TitleBar.tsx:23,26` hardcode Undo/Redo `disabled` |
| `ui.toast` (§4.4 dòng 248) | chưa có | §12.1 dòng 1056–1057 cần nó (GIF động) |
| `ui.cursor: Point \| null` (`types.ts:89`) | **thừa** | không có trong section nào của spec; là nguồn của defect §9 |

**Sửa một hiểu sai của chính tôi về `store/index.ts`.** Bản nháp trước viết rằng comment ở `index.ts:12-13` "viện dẫn `serializableCheck`" để biện minh cho việc xoá field. Đọc lại nguyên văn:

```ts
// Bitmap / ImageData sẽ không nằm trong store (giữ ở engine), nên
// serializableCheck mặc định là đủ.
```

Thứ tự nhân quả **ngược lại với điều tôi đã mô tả**: comment nêu *quyết định kiến trúc trước* (bitmap ở engine — đúng theo §4.4 dòng 252–254), rồi mới *kết luận* rằng config mặc định là đủ. Đây không phải lách `serializableCheck`; đây là §4.4 được thực thi. Hệ quả: luận điểm "áp lực thiết kế của RTK đã gây thiệt hại thật một lần" **không có cơ sở** và tôi bỏ nó khỏi §6.

Việc cần làm không phải sửa comment, mà là **sửa §6 cho khớp** — xem §10 mục 4, nơi tôi lập luận cho nó tử tế thay vì viện một "mâu thuẫn" mà spec không có.

---

## 2. Cách đo, và giới hạn của phép đo

Mọi số ở §3 và §4 tôi **tự chạy lại từ đầu bằng một script mới**, không lấy lại từ thảo luận trước và không lấy lại từ bản nháp trước.

- Script: `/private/tmp/claude-501/-Users-hieunm-projects-paint-web/fc8ca464-0d1b-4b3e-99e6-e5af28419b48/scratchpad/probe/rev.mjs`
  Chạy `NODE_ENV=development node rev.mjs` và `NODE_ENV=production node rev.mjs`.
- Phiên bản đúng như repo sẽ resolve: `@reduxjs/toolkit 2.12.0`, `immer 11.1.18`, `redux 5`, `zustand 5.0.15`, `react-redux 9.3.0`.
- Throughput: 20.000 vòng, `process.hrtime.bigint()`, có warm-up 2.000 vòng. Store trong probe mô phỏng đúng hình dạng repo (3 slice `tool`/`doc`/`selection`, reducer phẳng).
- Đếm `console.error`: thay `console.error` bằng một hàm **chỉ tăng biến đếm**, không stringify tham số.

**Ghi chú về một retraction.** Trong thảo luận trước, một con số "213 ms" từng bị chính agent đo rút lại vì nó là artifact của console stub tự làm (`args.map(String)` trên buffer). Bản nháp trước của tôi lại đăng "667 ms" — cùng dòng dõi, cùng script — mà không nói gì. Đó là lỗ hổng bằng chứng nặng nhất của bản nháp. Bảng §4 dưới đây là **đo lại sạch**, với counter thuần, và nó **xác nhận** hiện tượng ở cùng bậc độ lớn: 1 MB → ~800 ms/dispatch. RTK cũng tự in cảnh báo thật (`ImmutableStateInvariantMiddleware took 609ms…`), nên hiện tượng không phụ thuộc cách tôi đếm.

**Cảnh báo về giá trị dự báo của microbenchmark.** Các số này chạy trong Node, không DOM, không React commit, không layout. Chúng đo *chi phí của thư viện*, không đo *chi phí của app*. Một React commit của ribbon tốn khoảng hai đến ba bậc độ lớn hơn mọi con số ở §3. Vì §15 dòng 1197 quy định store chỉ được ghi ở `pointerup`, tần suất ghi thật là **1–3 lần/giây**. Ở tần suất đó, chênh 1 µs/op tương đương **3 µs mỗi giây** trên ngân sách frame 16.6 ms (§15 dòng 1209). Không đo được. **Đừng dùng bảng §3.1 để quyết định.**

---

## 3. Số liệu đo

### 3.1 Throughput ghi state (so ngang, cùng 31 subscriber)

| Phép đo | dev | production |
|---|---|---|
| RTK `dispatch` (31 subscriber, diff thủ công) | 4.5 µs/op | 1.71 µs/op |
| Zustand `setState` (31 selector subscriber) | 0.50 µs/op | 0.48 µs/op |
| Zustand `setState` (**0** subscriber) | 0.080 µs/op | 0.072 µs/op |

Tỉ lệ so ngang, 3 lần chạy mỗi env: **3.2–3.6× ở production** (rất ổn định), **7.8–15.2× ở dev** (nhiễu cao). Con số "15–49×" hay được trích là kết quả so `setState` **không subscriber** với một `dispatch` đầy đủ — phép so đó ở đây cho 20–24× (prod) và 51–57× (dev), tức nó *tạo ra* mọi con số hai chữ số. Không phải phép so ngang.

Và như §2 đã nói: ở 1–3 ghi/giây, cả hai cột đều bằng không.

### 3.2 `createListenerMiddleware` như một selector-subscribe (RTK)

| Phép đo | Kết quả |
|---|---|
| 4 dispatch, trong đó **1** lần đổi thật `tool.outline` | effect chạy **1** lần, 0 lần thừa (kể cả lần set lại đúng giá trị cũ) |
| Thứ tự thực thi | `before → effect → after-dispatch-returned` — **đồng bộ, trong lòng `dispatch`** |
| 10 listener luôn khớp × 20.000 ghi | 48.6 µs/op dev, 39.3 µs/op prod |
| Zustand `subscribeWithSelector`, 10 subscriber, tương đương | **0.27 µs/op** |

Đây là chỗ nhiều người nói sai: **Redux có selector-subscribe**, chỉ là không nằm ở `store.subscribe()` mà ở listener middleware, có sẵn trong `@reduxjs/toolkit`, không thêm dependency, không import React. Chi phí 39–49 µs/op nghe to nhưng đó là 10 listener × 20k ghi; ở app này ~8–10 watcher × 1–3 ghi/giây ≈ **0.05 ms mỗi commit**.

### 3.3 Ghi idempotent (`canUndo` / `isDirty` — hai ghi engine→store nhiều nhất)

`History.commit()` (§11.2, `notifyStore()` ở dòng 1008) chạy sau mỗi gesture; từ nét thứ hai trở đi `canUndo` **đã là `true`**. `isDirty` lật một lần rồi thôi.

| Cách viết | Ghi lại đúng giá trị cũ → điều gì xảy ra | Đo được |
|---|---|---|
| RTK + immer, `setDirty(true)` lần 2 | slice `doc` **giữ nguyên identity**, root state cũng **giữ nguyên** → 0 selector chạy lại, 0 re-render | `docA === docB` ✓, `rootA === rootB` ✓ |
| Zustand spread lồng `set(s => ({ doc: { ...s.doc, isDirty: true } }))` | object `doc` **mới mỗi lần** → `TitleBar.tsx:11` (`useAppSelector((s) => s.doc)`) re-render mỗi nét vẽ | `d1 === d2` ✗ |
| Zustand **phẳng** + selector primitive `s => s.isDirty` | root mới, nhưng **giá trị chọn ra ổn định** → 0 re-render | root ✗, value ✓ |

Đây là **đảo ngược** của luận điểm re-render thường gặp: mặc định của RTK an toàn hơn, mặc định ngây thơ của Zustand tệ hơn. Nhưng nó chỉ rộng đúng một dòng: store phẳng + selector primitive, hoặc `if (get().isDirty) return`, là xoá sạch chênh lệch. **RTK thắng ở *mặc định*, không thắng ở *trần*.**

---

## 4. Bitmap không-serializable: đọc lại §4.4 và §6 cho đúng

Đây là chỗ duy nhất mô hình dữ liệu của spec va vào thư viện, nên xử lý đủ sâu.

### 4.1 Căng thẳng nằm **bên trong §4.4**, không phải giữa §6 và §4.4

Bản nháp trước của tôi khung nó thành "§6 đối đầu §4.4" và tuyên bố "hai điều này không thể cùng đúng". Đọc nguyên văn thì sắc hơn — và yếu hơn — thế:

- `DESIGN.md:246` — `selection:SelectionState;   // kind, bounds, floating bitmap, transparentMode`
- `DESIGN.md:252-254` — *"`history` trong store chỉ chứa **2 boolean**… Toàn bộ dữ liệu ảnh nằm trong engine, ngoài React — nếu đưa `ImageData` vào store, mỗi lần undo React sẽ so sánh tham chiếu của mảng hàng trăm MB."*

Hai quan sát:

1. Căng thẳng là **246 chọi 252**, tức **trong cùng một section**. §6 dòng 450/452 chỉ lặp lại điều §4.4 dòng 246 đã nói.
2. Câu cảnh báo `ImageData` được viết **trong đoạn nói về slice `history` và về undo**, không phải về selection. Spec **ủng hộ** `floating` nằm trong selection state ở **hai** chỗ (246 và 450); một câu về undo data đang bị kéo dài ra để phủ lên nó.

Nên nói cho đúng: spec **nhất quán** ở chỗ này, và §10 mục 4 (đẩy `floating`/`mask` xuống engine) là một **đề xuất sửa spec của tôi**, cần lập luận riêng — không phải "giải quyết một mâu thuẫn". Lập luận đó ở §10 mục 4. Và dù sao: căng thẳng này **không phụ thuộc thư viện** — nó tồn tại y hệt trong Zustand.

### 4.2 Luận điểm "RTK không giữ được bitmap" — đo, và sai

`NODE_ENV=development`, 1 lần `setMask`, rồi 20 dispatch **hoàn toàn không liên quan** (`tool/setSize`):

| Kịch bản (mask nằm trong state) | `setMask` | ms/dispatch **không liên quan** | `console.error` |
|---|---|---|---|
| Không có mask, `autoFreeze` ON | — | 0.005 | 0 |
| 64 KB plain object, `autoFreeze` ON | 0.18 ms | 0.011 | 22 |
| **64 KB plain object, `autoFreeze` OFF** | 8.80 ms | **64.553** | 22 |
| 64 KB plain, `autoFreeze` OFF, `immutableCheck` OFF | 0.02 ms | 0.005 | 22 |
| 1 MB plain object, `autoFreeze` ON | 0.03 ms | 0.038 | 22 |
| **1 MB plain object, `autoFreeze` OFF** | 181 ms | **800.272** | 22 |
| 16 MB plain object, `autoFreeze` ON | 0.07 ms | 0.009 | 22 |
| `ImageData` thật (16 MB, `data` là accessor), `autoFreeze` ON | 0.38 ms | 0.009 | 22 |
| `ImageData` thật (16 MB), `autoFreeze` **OFF** | 0.02 ms | 0.022 | 22 |
| 16 MB plain + `ignoredPaths` (cả hai check) | 0.38 ms | 0.014 | **0** |
| `ImageData` thật + `ignoredPaths` | 0.02 ms | 0.013 | **0** |

Ở `NODE_ENV=production`: **cả 11 dòng đều 0 `console.error` và 0.001–0.004 ms/dispatch**, kể cả các dòng `autoFreeze` OFF. Cả hai middleware bị strip.

Bổ sung, đo trực tiếp trên `immer 11.1.18` (`autoFreeze` ON):

| Phép đo | Kết quả |
|---|---|
| `isDraftable(Uint8ClampedArray)` | **false** |
| `isDraftable(<class có `data` là accessor trên prototype>)` | **false** |
| `isDraftable({width, height, data})` (plain object) | true |
| `Object.keys(<ImageData thật>)` | `["width","height"]` — **buffer không own-enumerable** |
| `produce()` gán `ImageData` 16 MB | 0.053 ms dev / 0.020 ms prod |
| `produce()` gán DTO plain 16 MB | 0.013 ms dev / 0.011 ms prod |
| `mask.data` có bị freeze không | **false** — engine vẫn `putImageData` / ghi pixel trực tiếp được |

### 4.3 Đọc kết quả

1. **`serializableCheck` không duyệt 16 triệu phần tử** — nó bail ở giá trị non-plain đầu tiên (16 MB rẻ ngang 64 KB). Nhưng nó **log 1 `console.error` mỗi dispatch, vĩnh viễn**, chừng nào giá trị còn nằm trong state: cột `22` = 2 lần lúc `setMask` + 1 lần × 20 dispatch. Đây là chi phí *debug*, không phải chi phí *runtime*, và nó bằng 0 ở production.
2. **`immer` không deep-freeze `ImageData`.** Luận điểm "autoFreeze cố deep-freeze ImageData vài MB" từng nêu trong thảo luận trước là **sai**, tôi rút lại. Bản nháp trước còn báo "produce() gán DTO 16 MB = 1.22 ms"; **tôi không tái lập được** — đo lại ra 0.013 ms. Rút luôn.
3. **Cái bẫy thật nằm ở chỗ khác, và điều kiện của nó bây giờ đã đo xong.** `immutableCheck` duyệt bằng `for…in`; `for…in` trên một typed array liệt kê **từng index**. Thứ duy nhất chặn nó là `autoFreeze` của immer đóng băng *object bọc slice*, khiến `immutableCheck` không đi sâu xuống. Bẫy nổ **khi và chỉ khi** `autoFreeze` bị tắt **và** buffer là **own-enumerable property của một plain object**. `ImageData` thật của trình duyệt có `data` là accessor trên prototype — `Object.keys()` trả `["width","height"]` — nên `for…in` không chạm buffer, an toàn trong mọi cấu hình (0.022 ms). Một DTO tự chế `{ w, h, data: Uint8ClampedArray }` — thứ rất dễ xuất hiện khi làm mask free-form (§9.2, dòng 899) hay khi chuyển qua Worker (§15 dòng 1199) — thì kích hoạt bom.
4. **Ngưỡng thấp hơn tôi tưởng.** Không cần 1 MB: **64 KB đã là 64.5 ms mỗi dispatch không liên quan**, tức gần **4 lần ngân sách frame 16.6 ms**. 1 MB là ~800 ms.
5. **Nhưng nó không âm thầm.** RTK tự in: `ImmutableStateInvariantMiddleware took 609ms, which is more than the warning threshold of 32ms`, kèm link tài liệu và cách tắt. Đây là điểm phải nhượng bộ: khung "ai đó sẽ mất một buổi mới tìm ra" ở §6 Nhược 3 là **quá lời cho trường hợp này**.
6. **Giá của việc implement §6 đúng nguyên văn trong RTK: 6 dòng config.** Không phải kiến trúc.

```ts
// src/store/index.ts — toàn bộ chi phí để giữ đúng §6 trong RTK (đo: 0 log, 0.013 ms/dispatch)
export const store = configureStore({
  reducer: { doc, tool, colors, view, selection, ui },   // khớp index.ts:11 hiện tại
  middleware: (gdm) => gdm({
    serializableCheck: {
      // action creator chưa tồn tại — sẽ thêm cùng field
      ignoredActions: ['selection/setFloating', 'selection/setMask', 'doc/setFileHandle'],
      ignoredPaths: ['selection.floating', 'selection.mask', 'doc.fileHandle'],
    },
    immutableCheck: { ignoredPaths: ['selection.floating', 'selection.mask'] },
  }),
});
```

> `ignoredActions` **phải** có `'doc/setFileHandle'`: `serializableCheck` quét cả payload của action, không chỉ state. Bản nháp trước để `'doc.fileHandle'` trong `ignoredPaths` mà quên action tương ứng — vẫn log một lần mỗi lần set handle.

### 4.4 Trục này về gần 0

**Luận điểm mạnh nhất của mỗi bên đều tự triệt tiêu ở đây.** Zustand mất "RTK không giữ được bitmap" (sai). RTK mất "vậy thì cứ nhét vào store" (§10 mục 4 lập luận ngược lại). Còn lại một dư chấn không đối xứng: **RTK để lại một cái bẫy tiềm ẩn (mục 3) mà Zustand hoàn toàn không có**, vì Zustand không có middleware nào duyệt state — đổi lại, bẫy đó có điều kiện kích hoạt hẹp và tự báo cáo.

---

## 5. Những luận điểm SAI hoặc phụ thuộc phiên bản

Liệt kê thẳng, kể cả những cái do chính tôi viết ra ở bản nháp trước.

| # | Luận điểm | Phán quyết | Bằng chứng |
|---|---|---|---|
| 1 | "immer `autoFreeze` sẽ deep-freeze `ImageData` vài MB" | **SAI** | `isDraftable` = false cho typed array và host object; `produce()` gán 16 MB = 0.053 ms; `.data` không bị freeze |
| 2 | "`serializableCheck` sẽ duyệt hết buffer" | **SAI** (nửa còn lại đúng) | Bail ở giá trị non-plain đầu tiên, 16 MB ≈ 64 KB; **nhưng** log 1 error/dispatch mãi mãi; prod = 0 |
| 3 | "RTK không giữ được `floating`/`mask` của §6" | **SAI** | Bảng §4.2. 6 dòng config là đủ |
| 4 | "`store/index.ts:12-13` viện dẫn `serializableCheck` để bỏ 3 field" (**luận điểm của tôi**) | **SAI — đọc nhầm** | Comment nêu quyết định kiến trúc trước (bitmap ở engine, §4.4:252), config chỉ là hệ quả |
| 5 | "Lần port trước làm mất 4 field spec" (**luận điểm của tôi**) | **SAI — không có tiền lệ** | `git log --all` = 1 commit chỉ `README.md`; `src/` untracked; `types.ts:1` khai phạm vi "phần UI cần đến" |
| 6 | "`produce()` gán DTO 16 MB tốn 1.22 ms" (**số của tôi**) | **Không tái lập được** | Đo lại: 0.013 ms dev / 0.011 ms prod |
| 7 | §3 dòng 133: *"dùng RTK cho … devtools"* | **Nửa rỗng** | Time-travel vô nghĩa ở kiến trúc này: undo data là `Map` tile trong engine (§11.2), tua store về chỉ đổi 2 boolean còn canvas giữ nguyên pixel → một trạng thái app không bao giờ đạt được lúc chạy. Hơn nữa **không phân biệt**: `zustand/middleware/devtools` cũng implement `JUMP_TO_STATE`/`JUMP_TO_ACTION`, lệch y hệt. Cái còn sống là **action log**, và nó thật |
| 8 | Lý do Zustand ban đầu: *"subscribe chọn lọc, tránh re-render ribbon khi kéo chuột"* (đã bị thay ở §3:133) | **SAI** | `useStore(selector)` subscribe toàn store, chạy lại selector của **mọi** subscriber trên mỗi `set`, so bằng `Object.is` — đúng như `useSelector`. `subscribeWithSelector` chỉ giúp subscriber **ngoài React** |
| 9 | "Zustand nhanh hơn 15–49×" | **Sai cách đo** | So ngang 31 subscriber: 3.2–3.6× prod, 7.8–15.2× dev. Con số hai chữ số đến từ việc so với store **0 subscriber** |
| 10 | "Redux `store.subscribe()` không có selector nên engine phải tự viết prev/diff" | **SAI với RTK** | `createListenerMiddleware` có `predicate(action, curr, prev)`; đo: 1 fire / 1 thay đổi thật, 0 fire thừa, đồng bộ trong `dispatch` |
| 11 | "Zustand không kéo React vào engine, RTK thì có" | **SAI — hoà** | `zustand/esm/react.mjs` dòng 1 = `import React from 'react'`. Cả hai cần tách file. `@reduxjs/toolkit` core: 0 import React |
| 12 | "Ít dependency hơn / bundle nhỏ hơn" | **Không liên quan** | Repo đã có 6 package `@fortawesome/*`; sắp có engine canvas, encoder BMP/GIF, service worker. 6 transitive của RTK (`redux`, `redux-thunk`, `immer`, `reselect`, 2× `@standard-schema`) cùng một team. §2.2 nói về RAM và frame budget, không nói manifest |
| 13 | "`immutableCheck` là bom với typed array" | **ĐÚNG, có điều kiện hẹp và đã đo** | Nổ **khi và chỉ khi** `autoFreeze` tắt **và** buffer là own-enumerable property của plain object. 64 KB → 64.5 ms/dispatch; 1 MB → 800 ms. `ImageData` thật: 0.022 ms, an toàn. Prod: 0 |
| 14 | "Redux ép một đường ghi state duy nhất" | **Quá lời** | `dispatch` *đặt tên* cho ghi, không *chặn* ghi — engine vẫn dispatch bất cứ đâu. Zustand export setter có tên, grep được y hệt |

---

## 6. Redux Toolkit — ưu / nhược cho **app này**

### Ưu

1. **Mặc định đúng trên đường ghi dày nhất.** `notifyStore()` (§11.2 dòng 1008) chủ yếu ghi lại đúng giá trị cũ; immer giữ nguyên identity của slice *và* của root (đo được, §3.3), nên 11 selector-lấy-cả-slice trong repo — gồm `TitleBar.tsx:11` đọc `s.doc` và `StatusBar.tsx:8` đọc `s.doc` — không re-render. Không cần guard.
2. **Action log cho 3 điểm ghi engine→store.** `notifyStore` (canUndo/canRedo), `isDirty` lúc commit, và colour picker §8.1 (dòng 722–724: đọc 1 pixel từ `base` → gán Color 1/Color 2 → **tự động quay về tool trước đó**). Ba chỗ này bắn từ module "TS thuần, không React" (§4.1 dòng 171), không có user event nào trong cây React — đây là code khó debug nhất của app, và nó **chưa được viết**. Log có tên, có diff, zero config là đòn bẩy thật trong lúc viết glue đó.
3. **Ghi cross-slice là nguyên tử.** Picker §8.1 chạm `colors` và `tool` cùng lúc. Một `createAction` dùng chung + `extraReducers` ở hai slice = **một** notification, **một** snapshot nhất quán, **một** dòng log.
4. **`Object.assign(state.text, action.payload)`** (`toolSlice.ts:54`) phủ cả 7 field `TextOptions` của §6 (dòng 418–423) trong một dòng; bản Zustand phẳng-hoá hoặc phải spread hai cấp.
5. **`reselect` đã nằm sẵn trong `@reduxjs/toolkit`, chi phí biên = 0.** Repo dùng 0 lần, nhưng §7.4 có một loạt nút phải derive `disabled` (Cut/Copy/Crop chỉ bật khi có selection — `ImageGroup.tsx:13` đang đọc cả `s.selection` để làm việc đó) và §8.3 dòng 791–793 có shape editable với 4 nguồn (Outline/Fill/Size/màu). Đó là chỗ `createSelector` trả công, và nó không thêm một byte dependency nào.
6. **`createAsyncThunk` khớp §7.3 Recent pictures** (dòng 555–557): IndexedDB + `handle.queryPermission()` là luồng ba nhánh granted / denied / phải xin lại.
7. **`createListenerMiddleware`** lấp đúng khoảng trống mà người ta hay nghĩ Redux thiếu (§3.2), không thêm dependency, không import React.
8. **Đã viết xong và đang typecheck sạch.** 374 dòng + 120 điểm nối.

### Nhược (thật, không phải nhượng bộ lấy lệ)

1. **immer — thứ đắt nhất trong gói — gần như không được dùng.** Trên 32 reducer, ghi sâu nhất là **1 cấp**. Cả `viewSlice.ts` (37 dòng `createSlice`) chỉ là 4 phép gán vào một object 6 key phẳng. Bạn trả phí cho một tính năng mà state shape này không kích hoạt.
2. **Bẫy `immutableCheck` × typed array.** Nếu có ai đó (hoặc một thư viện, hoặc chính bạn khi "tối ưu dev build") gọi `setAutoFreeze(false)` trong khi một buffer plain-object nằm trong state: **64.5 ms cho một dispatch không liên quan ở 64 KB, ~800 ms ở 1 MB**. Zustand không có bề mặt này vì không có middleware nào duyệt state. *Giảm nhẹ:* điều kiện hẹp (§5 mục 13), production miễn nhiễm, và RTK tự in `took 609ms` kèm link — nên nó **không âm thầm**.
3. **Tiếng ồn dev nếu quên config, và tên của check gây hiểu nhầm.** 1 `console.error` mỗi dispatch, không throw, không tự tắt. Ứng viên gần nhất là `fileHandle`: §7.3 dòng 555–556 **nói rõ handle *là* serialize được** (*"handle có thể serialize được"* — đúng, nó structured-cloneable). Nhưng `serializableCheck` không test structured-clone, nó test **plain-object-ness** — nên nó vẫn báo lỗi trên một giá trị mà spec vừa khẳng định là serializable. Đây là một cái tên sai đánh lừa người đọc spec.
4. **Boilerplate tăng tuyến tính theo state UI.** Mỗi field ribbon mới ở P4/P5 = reducer + action creator + import + wrap `dispatch()` ở call site. ~109 dòng chênh lệch hiện tại sẽ nới ra, chậm nhưng đều.
5. **Không có persistence.** §7.2 dòng 535 yêu cầu QAT lưu `localStorage`; §7.4.7 (dòng 598) có 10 ô màu custom. RTK không có gì sẵn (`redux-persist` là dependency thứ ba). Không chết người — QAT chỉ đổi khi người dùng bấm menu, nên 2 dòng `setItem` trong handler là đủ — nhưng nó là công việc tay.

> **Đã bỏ khỏi danh sách này so với bản nháp trước:** (a) *"Vi phạm §4.1 dòng 179: `store/index.ts` import `react-redux`"* — đúng là defect (dòng 2, 19–20) và vẫn phải sửa (§10 mục 2), nhưng nó là **lỗi tách file, không phải thuộc tính thư viện**: Zustand cần đúng một lần tách y hệt (§5 mục 11). (b) *"Áp lực thiết kế đã gây thiệt hại thật một lần"* — dựa trên hai luận điểm đã bị bác ở §1.2 và §5 mục 4–5.

---

## 7. Zustand — ưu / nhược cho **app này**

### Ưu

1. **`zustand/vanilla` không import React theo cấu tạo.** Đã kiểm: `zustand/esm/vanilla.mjs` sạch, `zustand/esm/react.mjs:1` mới là `import React from 'react'`. Với `subscribeWithSelector`, mỗi phản ứng engine là 1 dòng:
   ```ts
   paintStore.subscribe(s => s.outline,     () => shapeSession?.restyle());   // §8.3 dòng 791-793
   paintStore.subscribe(s => s.transparent, () => selection.reextract());     // §9.3 dòng 914-917
   paintStore.subscribe(s => s.active,      () => shapeSession?.commit());    // §8.3 dòng 793: đổi tool → commit
   ```
   RTK làm được điều tương đương bằng `createListenerMiddleware`, nhưng ~4 dòng/watcher thay vì 1 → khoảng 30 dòng trên 8–10 watcher.
2. **Không có bề mặt non-serializable.** `floating`, `mask`, `fileHandle`, danh sách recents có handle — nhét vào chạy thẳng, không config, không log, buffer vẫn ghi được, không có bẫy `immutableCheck`.
3. **Một file, một idiom.** ~170 dòng thay cho 279 dòng cơ chế; xoá luôn 16 `useAppDispatch()` và 54 lớp bọc `dispatch(...)`.
4. **`persist` + `partialize`** giải quyết §7.2 (dòng 535) và §7.4.7 trong 3–6 dòng.
5. **Ghi cross-slice (picker §8.1) là một `set()`** — một notification, không có trạng thái trung gian.

### Nhược (thật)

1. **Mặc định ngây thơ tệ hơn trên đường ghi dày nhất.** `set(s => ({ doc: { ...s.doc, isDirty: true } }))` sinh object `doc` mới mỗi nét vẽ → `TitleBar` re-render mỗi nét (đo được, §3.3). Phải hoặc để store phẳng + selector primitive, hoặc tự guard. Đây là kỷ luật RTK **cho không**.
2. **Không có transcript.** Ba điểm ghi engine→store bắn từ ngoài React, không tên, không diff. `zustand/middleware/devtools` có, nhưng tên action là tham số thứ ba phải tự truyền mỗi lần `set()` — quên là thành `anonymous`. Đây là bề mặt khó debug nhất của P1–P3.
3. **Luận cứ gốc cho Zustand đã bị bác** (§5 mục 8): hook React của Zustand **không** subscribe chọn lọc hơn `useSelector`. §3 dòng 133 hiện đã ghi RTK; chuyển ngược lại vì lý do cũ là chuyển vì một điều không tồn tại.
4. **Không đưa engine ra khỏi React miễn phí.** Phải tách `store/vanilla.ts` / `store/react.ts` — đúng một thao tác bằng với việc tách `store/hooks.ts` khỏi `store/index.ts` ở phía RTK (§10 mục 2). Trục này **hoà**.
5. **Không sửa được defect thật của repo.** `CanvasViewport.tsx:60-67` sai từng byte y nguyên khi viết bằng `setState` (§9). Đổi thư viện tạo ảo giác đã sửa.
6. **Async không có khung.** §7.3 recents (IndexedDB + `queryPermission()` + có thể xin lại quyền) phải tự viết pending/error flag.
7. **Chi phí đổi rẻ, nhưng *xác minh* thì không có.** ~279 dòng cơ chế + 120 điểm nối / 23 file — nửa ngày viết. Vấn đề là repo **không có một test nào** (`package.json` chỉ có `typecheck`), §19 chưa viết. Cổng duy nhất là `tsc --noEmit` cộng bấm tay. Với 32 setter và 50 điểm đọc, typecheck bắt được đổi tên và đổi kiểu, **không** bắt được ghi nhầm slice, guard thiếu, hay watcher không bắn. Đây là lý do thật khiến "nửa ngày" không phải là toàn bộ rủi ro.
8. **`persist` bọc store làm module engine import thực thi I/O `localStorage` ngay lúc import** — chính là loại vẩn đục mà lập luận §4.1 dùng để chê RTK. Khắc phục được bằng cách tách store UI riêng, nhưng phải nhớ.

---

## 8. Bảng cân đối cuối

| Tiêu chí | Trọng số cho app này | Thắng | Độ lớn thật |
|---|---|---|---|
| Quen tay (1 dev, đã chốt ở §3:133 ngày 2026-09-18) | cao | **RTK** | không đo được, nhưng thật — và không bên nào bác được |
| Truy vết 3 điểm ghi engine→store | trung bình-cao | **RTK** | đáng kể ở P1–P3, khi glue engine đang được viết |
| Không cần xác minh lại 120 điểm nối **mà không có test** | trung bình | **RTK** | nửa ngày viết + rủi ro không có lưới an toàn (§7 Nhược 7) |
| Mặc định trên ghi idempotent (`canUndo`/`isDirty`) | trung bình | **RTK** | 1 dòng guard hoặc store phẳng là hoà |
| `reselect` sẵn có cho derive §7.4 / §8.3 | thấp-trung bình | **RTK** | 0 dependency biên |
| Push store→engine (§8.3:791, §9.3:914, đổi tool) | trung bình | **Zustand** | ~30 dòng, 1 giờ |
| Ma sát với state non-serializable | trung bình | **Zustand** | 1 block 6 dòng config + 1 bẫy điều kiện hẹp có tự cảnh báo |
| Khớp với mô hình dữ liệu (70 scalar phẳng) | trung bình | **Zustand** | ~109 dòng — **xem ghi chú dưới** |
| §7.2 / §7.4.7 persistence | thấp | **Zustand** | < 1 giờ |
| §4.1 engine không import React | thấp | **hoà** | 15 phút, **cho cả hai lựa chọn** (§5 mục 11) |
| §19 cô lập test RTL | thấp | hoà | cả hai đều là singleton module, cả hai đều cần factory/reset |
| Throughput | thấp | Zustand | không đo được ở 1–3 ghi/giây (§2) |
| Số dependency / bundle | bỏ qua | Zustand | 0 |

> **Ghi chú chống đếm trùng trên hàng "Khớp với mô hình dữ liệu".** Một phần đáng kể trong ~109 dòng chênh lệch đó **chính là** 32 action creator có tên và có type — thứ mà hàng 2 đang tính là **ưu điểm** của RTK. Không được cộng cả hai chiều. Nếu bạn coi action log là giá trị, thì phần lớn "ceremony" đó đã được trả công rồi; phần thừa thật chỉ còn ở boilerplate import/wrap tại call site.

Zustand thắng nhiều ô hơn về số lượng. Nhưng ba ô nặng nhất — quen tay, truy vết glue engine, và không phải xác minh lại 120 điểm nối bằng tay — đều thuộc RTK, và **không ô nào của Zustand mở ra một năng lực mới**. Đó là toàn bộ lý do của kết luận. Nó mỏng: hãy đọc §11 trước khi chốt.

---

## 9. Defect thật sự của repo (không liên quan thư viện, quan trọng hơn cả quyết định này)

`src/components/canvas/CanvasViewport.tsx:60-67`:

```tsx
onPointerMove={(e) => {
  const r = e.currentTarget.getBoundingClientRect();
  dispatch(setCursor({
    x: Math.floor((e.clientX - r.left) / zoom),
    y: Math.floor((e.clientY - r.top) / zoom),
  }));
}}
onPointerLeave={() => dispatch(setCursor(null))}
```

Không `getCoalescedEvents()`, không rAF, không throttle 60 ms, object literal mới mỗi event, đổ vào `ui.cursor` — một field không có trong section nào của spec. Nó vi phạm **ba dòng liên tiếp** của §15:

- **1196:** *"Gom bằng `getCoalescedEvents()`, xử lý 1 lần/frame trong rAF"*
- **1197:** *"Nét vẽ đi thẳng vào engine, không qua store. Store chỉ cập nhật ở `pointerup`"*
- **1198:** *"Throttle 60 ms, và dùng `useSyncExternalStore` chỉ subscribe ô đó"*

và cả **ràng buộc do chính §3 dòng 133 ghi ra**: *"không có dispatch nào chạy theo mousemove"*. §4.3 dòng 226 còn viết sẵn lời giải trong pseudo-code: `setStatusCoord(pt); // throttle 60ms, không mỗi frame`.

Viết bằng `useStore.setState` thì sai từng byte y hệt. Bản sửa giống nhau cho cả hai lựa chọn, ~15 dòng, và nó **cũng là kênh cho ô thứ 2 của status bar**:

```ts
// src/engine/cursorStore.ts — §15 dòng 1198; không thuộc store app, không thuộc React
let snap: Point | null = null;
const subs = new Set<() => void>();
export const cursorStore = {
  subscribe(cb: () => void) { subs.add(cb); return () => { subs.delete(cb); }; },
  getSnapshot() { return snap; },              // PHẢI trả về reference đã cache, không tạo object mới
  set: throttle60((p: Point | null) => { snap = p; subs.forEach(cb => cb()); }),
};
// StatusBar.tsx:9 →
//   const cursor = useSyncExternalStore(cursorStore.subscribe, cursorStore.getSnapshot);
```

**Còn ô số 2.** `StatusBar.tsx:10` đọc `useAppSelector((s) => s.selection.bounds)` để hiển thị `{w} × {h}px` (dòng 24). Theo §15 dòng 1197, `selection.bounds` chỉ được cập nhật ở `pointerup` — nghĩa là ô số 2 sẽ **trống suốt lúc đang kéo**, đúng ngược với §7.7 (dòng 635). Nó cần đúng kênh external ấy trong lúc drag, rồi mới đọc store sau khi thả. Đây là dòng code cụ thể mà `cursorStore` phải thay, và bản nháp trước của tôi khẳng định điều này mà không chỉ ra nó.

Một giờ làm việc này đáng giá hơn mọi kết quả của cuộc so sánh RTK/Zustand. Test §19 dòng 1408 (*"Vẽ 500 điểm liên tục trên ảnh 2000×2000, khẳng định không có frame > 32 ms"*) sẽ bắt được nó ở P1 — nếu test đó tồn tại, mà hiện chưa.

---

## 10. Việc phải làm với code hiện tại (giữ RTK)

Mục **1–5 là điều kiện của kết luận ở §0** — phải xong trước dòng engine đầu tiên. Mục 6–8 là kỷ luật chạy dài.

1. **Xoá `ui.cursor` và `setCursor`, dựng `cursorStore` ở §9.** Chạm **4 file**, không phải 2:
   - `src/store/types.ts:89` — `cursor: Point | null;` trong `UiState`
   - `src/store/slices/uiSlice.ts:8, 42-45, 51` — giá trị khởi tạo, reducer `setCursor`, dòng export
   - `src/components/canvas/CanvasViewport.tsx:3, 24, 60-67` — import, `useAppDispatch()`, `onPointerMove` **và `onPointerLeave`** (nhánh `null` mà `cursorStore.set` phải xử lý)
   - `src/components/statusbar/StatusBar.tsx:9, 20` — `useAppSelector((s) => s.ui.cursor)` và ô số 1. Đây chính là call site mà §15:1198 đang gọi tên cho `useSyncExternalStore`.

   Cùng lúc: quyết cách nuôi **ô số 2** (`StatusBar.tsx:10`) trong lúc drag (§9). (~1 giờ)
2. **Tách `src/store/hooks.ts`** (`useAppSelector` / `useAppDispatch`) ra khỏi `store/index.ts`, để engine `import { store } from '../store'` mà không kéo React vào đồ thị module — §4.1 dòng 179. Hiện `index.ts:2` import `react-redux` cùng module với `configureStore` và `export const store`; chỉ hai dòng 19–20 cần React. **Lưu ý:** đây là việc phải làm dù chọn thư viện nào (§5 mục 11). (~15 phút)
3. **Trả lại các field của §6**: `isDragging` (dòng 454, boolean thuần), `scrollX`/`scrollY` (dòng 437), thêm `historySlice { canUndo, canRedo }` (§4.4 dòng 247 — hiện `TitleBar.tsx:23,26` hardcode `disabled`) và `ui.toast` (§4.4 dòng 248, §12.1 dòng 1056–1057 cần). `fileHandle` (dòng 380) để tới P2, kèm `ignoredPaths` **và** `ignoredActions` lúc thêm (§4.3).
4. **Quyết dứt điểm chuyện bitmap — và lập luận cho nó, đừng viện mâu thuẫn.** Spec **ủng hộ** `floating` trong store ở hai chỗ (§4.4:246 và §6:450). Tôi vẫn đề nghị đẩy `floating`/`mask` xuống `SelectionManager` của engine, nhưng vì ba lý do độc lập với thư viện:
   - **Đồng vị trí với dữ liệu nó thuộc về.** Vòng đời vùng chọn (§9.1, dòng 880–896) là extract → float → drag → drop, toàn bộ là thao tác pixel trên `preview`/`base`; `SelectionManager` đã có sẵn trong sơ đồ §4.1 dòng 174. Store giữ con trỏ tới bitmap mà không bao giờ đọc nó chỉ tạo hai nguồn sự thật.
   - **Không một component React nào cần nó.** Marching ants (§9.4) vẽ trên `overlay` bằng rAF, không qua React. Ribbon chỉ cần `kind !== 'none'` để bật Cut/Copy/Crop. Đo trên repo: `ImageGroup.tsx:13` và `CanvasViewport.tsx:28` đọc `s.selection` **chỉ để lấy `bounds`**.
   - **`isDragging` (dòng 454) đã chứng minh ranh giới nằm ở đâu.** Nó là boolean, thuộc store; `floating` là buffer, không thuộc. Cùng một interface đang trộn hai loại.

   Store giữ `kind`, `bounds`, `transparent`, `isDragging` — đủ cho ribbon và cho `CanvasViewport` vẽ khung. **Việc phải làm là sửa §6 (dòng 449–452) và §4.4 (dòng 246) cho khớp nhau**, kèm một câu ghi lý do — không phải nhét `ImageBitmap` vào store rồi khai miễn trừ. Comment `store/index.ts:12-13` **đã đúng**, giữ nguyên.
5. **Sửa DESIGN.md hết tàn dư Zustand**: dòng **165** (sơ đồ §4.1 vẫn ghi `Store (Zustand)`) và dòng **310** (cây thư mục §5 ghi `# tạo store Zustand`) → Redux Toolkit. Đồng thời sửa lý do ở §3 dòng 133: bỏ hàm ý time-travel, ghi rõ *"action log + quen tay"*, vì time-travel không hoạt động có ý nghĩa ở kiến trúc này (§5 mục 7).
6. **Dùng `createListenerMiddleware`** cho watcher §8.3 / §9.3 / đổi-tool khi viết engine — đừng tự viết closure prev/diff, cũng đừng dùng `store.subscribe()` trần.
7. **Dọn action creator chết: 10 / 32 chưa ai dispatch.**
   - `docSlice` (cả 5): `setDocSize`, `setFileName`, `setFormat`, `setDirty`, `resetDocument`
   - `selectionSlice`: `setSelection`, `clearSelection`
   - `toolSlice`: `stepSize`, `setTextOptions`
   - `colorsSlice`: `setColor`

   *Lưu ý:* `setFormat` **có** xuất hiện ở `SaveAsDialog.tsx:18,33` nhưng đó là setter của một `useState` cục bộ trùng tên, không phải action. Nối chúng vào §7.3 / §12 / §9 hoặc xoá. **Con số này library-invariant**: port sang Zustand thì chúng thành 10 setter không ai gọi.
8. **Không bao giờ gọi `setAutoFreeze(false)`** (§4.3 mục 3), và nếu có typed array lọt vào state thì phải kèm `immutableCheck.ignoredPaths`.

---

## 11. Quyết định này đảo chiều khi nào

Chuyển sang Zustand nếu **bất kỳ** điều nào sau xảy ra — và nếu chuyển thì chuyển **trước khi viết engine**, không bao giờ sau:

1. Bạn quyết định store phải giữ bitmap thật theo §6 nguyên văn, **và** có thêm từ 2 giá trị non-serializable trở lên (recents handle, clipboard `Blob`, text session) → lúc đó `ignoredPaths`/`ignoredActions` thành thứ phải nhớ mãi, và bẫy `immutableCheck` thành rủi ro thật chứ không phải lý thuyết.
2. Sau P3, số watcher engine→store vượt ~15 và ceremony của listener middleware bắt đầu cộng dồn thấy được.
3. Có dev thứ hai vào, và người đó **không** quen Redux — lúc đó "quen tay", tiêu chí trọng số cao nhất của §8, đổi dấu, và cả kết luận đi theo.
4. Bạn dùng action log của devtools dưới 2 tuần đầu P1 rồi bỏ — vì khi đó hàng 2 của §8 về 0, hàng 1 vẫn đứng, nhưng biên độ mỏng đi tới mức mọi thứ khác quyết định.
5. Bạn viết xong bộ test §19 **trước** khi port. Lúc đó §7 Nhược 7 (không có lưới an toàn) biến mất, và hàng 3 của §8 mất phần lớn trọng số.

Ngược lại, nếu bạn đang phân vân chỉ vì bundle size, số dependency, throughput, hay "Zustand ít boilerplate hơn": **cả bốn đều không phải lý do**, xem §5.

---

## 12. Checklist — nếu giữ **Redux Toolkit**

- [ ] Làm §10 mục 1–5 trước khi commit dòng engine đầu tiên.
- [ ] `store/index.ts` chỉ chứa `configureStore` + `RootState`/`AppDispatch`; chuyển hai dòng hook (`index.ts:19-20`) sang `store/hooks.ts` và cập nhật 23 file import.
- [ ] Engine chỉ `import { store } from '../store'` — **không bao giờ** import `react-redux`.
- [ ] Watcher store→engine: `createListenerMiddleware` + `predicate(action, curr, prev)`, không dùng `store.subscribe()` trần.
  ```ts
  startListening({
    predicate: (_a, curr, prev) => curr.tool.outline !== prev.tool.outline,
    effect: () => shapeSession?.restyle(),           // §8.3 dòng 791-793
  });
  startListening({
    predicate: (_a, curr, prev) => curr.tool.active !== prev.tool.active,
    effect: () => shapeSession?.commit(),            // §8.3 dòng 793: đổi tool → commit
  });
  ```
- [ ] Picker §8.1 (dòng 722–724) = **một** `createAction('picker/picked')` + `extraReducers` ở `colorsSlice` **và** `toolSlice`. Cần thêm field `prevTool` — **không có** trong §6 lẫn `types.ts` hiện tại — để làm được *"tự động quay về tool trước đó"*.
- [ ] `notifyStore()` (§11.2 dòng 1008) dispatch action có tên (`history/changed`), không set trực tiếp.
- [ ] Khi thêm bất kỳ giá trị non-serializable nào: cập nhật **cả ba** — `serializableCheck.ignoredPaths`, `serializableCheck.ignoredActions`, `immutableCheck.ignoredPaths`.
- [ ] Không gọi `setAutoFreeze(false)` ở bất cứ đâu. Nếu thấy log `ImmutableStateInvariantMiddleware took …ms`, đó là §4.3 mục 3 đang xảy ra — tìm buffer plain-object trong state, đừng tắt middleware.
- [ ] §7.2 (dòng 535) QAT + §7.4.7 (dòng 598) custom colours: `localStorage.setItem` ngay trong handler đã có, không thêm `redux-persist`.
- [ ] §7.4 nút `disabled` + §8.3 shape editable: dùng `createSelector` (đã có sẵn trong `@reduxjs/toolkit`) thay vì đọc cả slice như `ImageGroup.tsx:13` đang làm.
- [ ] §19 RTL: tách `makeStore()` factory, mỗi test `render(<Provider store={makeStore()}>…)`. **Hiện chưa có test runner nào trong `package.json`** — thêm Vitest trước khi thêm dòng test đầu tiên.

## 13. Checklist — nếu đổi sang **Zustand**

> **Đọc trước mọi thứ khác: repo không có một test nào.** `package.json` chỉ có `dev`, `build`, `preview`, `typecheck`. Cổng xác minh duy nhất cho một lần port chạm 120 điểm nối trong 23 file là `tsc --noEmit` cộng bấm tay. Typecheck bắt được đổi tên và đổi kiểu; nó **không** bắt được ghi nhầm slice, guard re-render thiếu, hay watcher không bắn. Cân nhắc viết trước bộ RTL của §19 dòng 1405 cho ribbon — vài giờ, và nó biến "nửa ngày có rủi ro" thành "nửa ngày".

- [ ] Đổi **ngay bây giờ**, trước P1; sau khi engine tồn tại thì chi phí nhân lên.
- [ ] Tách hai module: `store/vanilla.ts` (`createStore(subscribeWithSelector(...))` — engine import file này) và `store/react.ts` (`useStore` — chỉ UI import). **Bắt buộc**: `zustand/esm/react.mjs` dòng 1 là `import React from 'react'`, để chung là vi phạm §4.1 dòng 179 y như `store/index.ts` hôm nay.
- [ ] **Store phẳng, selector primitive.** Đừng dựng lại 6 slice lồng — đó chính là cách sinh ra vấn đề re-render đã đo ở §3.3.
  ```ts
  const commit = () => paintStore.setState({ canUndo: true, canRedo: false, isDirty: true });
  ```
- [ ] Guard cho mọi ghi từ engine có thể trùng giá trị cũ, hoặc chấp nhận re-render mỗi nét:
  `if (!paintStore.getState().isDirty) paintStore.setState({ isDirty: true });`
- [ ] Bật `devtools` middleware và **luôn truyền tên** ở tham số thứ ba của `set()` cho 3 điểm ghi engine→store (`notifyStore`, `isDirty`, picker §8.1).
- [ ] Export setter có tên từ store, engine gọi setter — không `setState()` rải rác.
- [ ] Đối chiếu **toàn bộ** §6 và §4.4 khi port, đừng chép `types.ts` (nó tự khai chỉ phủ "phần UI cần đến", dòng 1): `fileHandle` (380), `scrollX`/`scrollY` (437), `isDragging` (454), `history` (§4.4:247), `ui.toast` (§4.4:248). Và **bỏ** `ui.cursor` (§9).
- [ ] `persist` + `partialize` cho §7.2/§7.4.7 — và nhớ nó làm module engine import thực thi I/O `localStorage` **lúc import**; đặt `persist` ở một store UI riêng.
- [ ] §19: `beforeEach(() => paintStore.setState(initialState, true))` trong setup file dùng chung — `true` để replace, không merge.
- [ ] Cập nhật DESIGN.md §3 dòng 133 (ghi quyết định mới + ngày mới, giữ lại dòng cũ để có lịch sử), và sửa luôn dòng 165 / 310 cho khớp. **Không** chép lại lý do cũ *"subscribe chọn lọc, tránh re-render ribbon khi kéo chuột"* — nó sai (§5 mục 8). Lý do đúng là: store phẳng hợp mô hình dữ liệu 70 scalar, và `subscribeWithSelector` cho engine.
- [ ] Vẫn phải làm §9 (`cursorStore`) và §10 mục 7 (10 action chết) — đổi thư viện không sửa được cái nào trong hai.
