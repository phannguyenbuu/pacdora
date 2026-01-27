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
