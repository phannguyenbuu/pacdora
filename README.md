scp -r dist/* root@31.97.76.62:/var/www/pacdora
@baoLong0511


# Pacdora - 3D Box Configurator (Vite + React + R3F)

Project nay la mot cong cu cau hinh hop 3D: dieu chinh kich thuoc, gap hop theo "fold progress", va gan texture tu anh upload. UI gom 3 cot: thong so kich thuoc (left), texture editor 2D (center), va view 3D (right).

## Scripts
- `npm run dev`: chay dev server (Vite)
- `npm run build`: build production
- `npm run preview`: preview build
- `npm run start`: preview host 0.0.0.0:3040
- `npm run lint`: eslint

## Tech stack
- Vite + React 19
- react-router 7
- @react-three/fiber + three + @react-three/drei
- Zustand (state)
- Ant Design (UI)
- Konva + react-konva (2D texture editor)
- GSAP (camera animation)

## Entry va routing
- `src/main.jsx`: boot app, mount `App` trong `BrowserRouter`.
- `src/App.jsx`: boc `PointerProvider` + `SelectionProvider`, render `Overlay` va `Router`.
- `src/routes/Router.jsx`: Route `index` -> `HomePage`. Cac route `about/dev-work/design-work` hien dang comment trong JSX.

## Trang chinh (Home -> Workspace)
- `src/pages/HomePage/HomePage.jsx`: lazy-load `WorkspaceConfig`.
- `src/Experience/components/WorkspaceConfig.jsx`:
  - **Left panel**: `BoxSizeSliders` + `BoxDepthSlider` + "Advance" textarea (hien message).
  - **Center panel**: upload image va `KonvaTextureEditor` (SVG: `/box-sample/150010.svg`).
  - **Right panel**: `Experience` (3D) + slider `Fold` (0..100 -> 0..1).

## 3D Experience layer
- `src/Experience/Experience.jsx`:
  - Tao `<Canvas>` va camera (`PerspectiveCamera`).
  - Dung `Environment`, `directionalLight`, `OrbitControls`.
  - Camera position va zoom thay doi theo `toggleRoomStore` (dark/light room).
  - Truyen `foldProgress` xuong `Scene`.
- `src/Experience/Scene.jsx`:
  - Render duy nhat `BoxSample` (GLB).
  - Nhan `foldProgress` de dieu khien do gap.

## Model pipeline: load -> resize -> fold -> texture
### 1) Load GLB
- `src/Experience/models/BoxSample.jsx`:
  - Load GLB `public/box-sample/150010.glb`.
  - Tim mesh co ten chua `O` va `C2` de tinh **original size** (width/length/height).
  - Luu original size vao `PointerProvider`.

### 2) Resize geometry theo kich thuoc tu UI
- `src/Experience/models/ResizeModule.jsx`:
  - Doc rules tu `src/json/pointConfig/150010.json`.
  - Duyet tung mesh, apply resize theo rule (X/Z axis, pivot/extent).
  - Tao cache theo `sizeKey` de tranh clone lai qua nhieu.

### 3) Fold (gap hop) theo progress
- `src/Experience/models/FoldModule.jsx`:
  - Tao cac fold group: A/B/C/F/D/E (theo prefix).
  - Stage progress (0..1) chia thanh nhieu giai doan (stage1..stage8).
  - Ap pivot, do lech va rotation theo config va size hien tai.
  - `FoldRenderer` tao scene moi, gan texture, build fold groups va add vao group root.

### 4) Gan texture tu upload
- `src/stores/uploadTextureStore.jsx`:
  - Upload image -> tao `CanvasTexture`.
  - `KonvaTextureEditor` cap nhat texture tu canvas.
  - `FoldModule` map texture len mesh co ten chua `_1`.

## State management (Zustand + Context)
- `src/stores/selectionStore.jsx`:
  - `PointerProvider`: boxWidth/Length/Height/Depth, original size, deltas.
  - `pulseResize()` de trigger resize nhieu frame.
  - `SelectionProvider`: message (dung de debug BBox, log tu FoldModule).
- `src/stores/experienceStore.js`: flag `isExperienceReady`.
- `src/stores/toggleRoomStore.js`: chuyen "dark/light room".
- `src/stores/useResponsiveStore.js`: theo doi mobile/desktop.

## 2D editor (Konva)
- `src/Experience/components/KonvaTextureEditor.jsx` + `.css`:
  - Doc SVG template.
  - Render canvas va dung de edit texture.
  - `uploadTextureStore.updateTextureFromCanvas()` dong bo texture sang 3D.

## Asset & data files
- `public/box-sample/150010.glb`: model chinh.
- `public/box-sample/150010.svg`: dieline/texture template.
- `src/json/pointConfig/150010.json`: rules resize + fold pivot/offset.
- `src/json/*.json`: material, lighting, library config, v.v.

## Luu y ky thuat
- `BoxSample` dung `useMemo` de tinh size goc 1 lan (dung `loggedRef`).
- Resize co cache (`sizeCache`) de giam clone/compute.
- Fold tao scene clone moi de tranh mutate goc.
- Texture chi apply cho mesh name co `_1` (de tranh anh huong debug boxes).

## Asset IDs
asset_base_id:d9eb0dc3-7266-47f7-9f85-15525a8398b3 asset_type:scene
asset_base_id:5fa7966c-0957-4e99-bb32-c30f40479394 asset_type:scene
asset_base_id:02d29819-dad1-4520-b106-80a7cf814009 asset_type:scene






Dưới đây là “xương sống” của folding GLB trong project bạn, dựa đúng code hiện tại.

1) Từ lúc load file

GLB được load ở BoxSample.jsx.
Khi slider đổi size, scene được “resize” qua resizeScene(...), rồi clone(true) để đưa sang folding.
Folding thật sự diễn ra trong FoldRenderer ở FoldModule.jsx.
2) Cách chia các “mốc thời gian” (stage)

Mỗi stage chiếm 1/8 timeline: hàm getStageProgress(stageIndex, progress) trong FoldModule.jsx.
Trong buildFoldScene(...), các stage được lấy như:
stage1, stage2, stage5, stage6, stage7, stage8
Mapping stage → nhóm:
F dùng stage1
C dùng stage2
D dùng stage5
E dùng stage6
B dùng stage7
A dùng stage8
3) Xác định group & pivot (tâm xoay)
Có 2 kiểu:

A) Nhóm thường A/B/C/F: createFoldGroup(...)

Thu mesh theo prefix:
trái: prefix + "1"
phải: prefix + "3"
pivot: prefix + "2"
Sau đó:
đặt vị trí theo rule resize (foldObj(...))
gom vào foldGroup
áp “pivot tại minZ / maxZ” bằng applyMinZPivot(...)
xoay group theo trục X hoặc Z (thường là X) với góc tối đa 90°.
B) Nhóm đặc biệt D/E: createThreeStageFoldGroup(...)

Đây là folding nhiều cấp (3 stage trong 1 nhóm).
Ý tưởng:
Tạo dPivot (pivot ngoài cùng)
Stage 2: tạo d12RotationGroup (xoay D1+D2 quanh mép)
Stage 3: tạo d1RotationGroup (xoay D1 quanh mép nhỏ hơn)
Pivot được tính từ bbox world/local của các mesh con.
4) Quan hệ giữa các group (nesting)
Trong buildFoldScene(...):

B chứa A: sideGroupB.add(lidGroupA)
C chứa B: sideGroupC.add(sideGroupB)
Rồi add vào scene:
F, C, D, E
Tức là: A ⊂ B ⊂ C, còn D/E/F là nhánh riêng.
5) Thời điểm xoay (ai xoay khi nào)

Theo stage như mục (2):
F bắt đầu sớm (stage1)
C tiếp theo (stage2)
D/E ở giữa (stage5/6)
B gần cuối (stage7)
A cuối cùng (stage8)
Mỗi nhóm xoay tối đa 90° (Math.PI / 2).
Nếu bạn muốn, mình có thể:

liệt kê “pivot cụ thể” theo từng nhóm A/B/C/F/D/E ngay từ bbox, và
vẽ sơ đồ stage theo trục thời gian (0→1) để bạn bám sang SVG.