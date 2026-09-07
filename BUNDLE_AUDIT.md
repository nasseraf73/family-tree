# Bundle Audit Report

Analysis conducted using Webpack Bundle Analyzer and compilation stats on Next.js client bundle.

---

## 1. Target Chunk: `chunks/fd9d1056-e9a170689970b9d1.js`

- **File Path**: `static/chunks/fd9d1056-e9a170689970b9d1.js`
- **Total Size (statSize)**: 176,902 bytes (172.8 KB)
- **Total Size (parsedSize)**: 172,834 bytes (168.8 KB)
- **Total Size (gzipSize)**: 53,640 bytes (52.4 KB)
- **Total Modules**: 1 module

### Top Modules by Size
1. `node_modules/next/dist/compiled/react-dom/cjs/react-dom.production.min.js`
   - **Size**: 172,747 bytes parsed (176,902 bytes stat)
   - **Category**: (a) Next.js framework / (b) React core
   - **Role**: React-DOM core rendering runtime packaged by Next.js

### Category Breakdown
- **(a) Next.js framework / (b) React core**: 100.0% (176,902 bytes)
- **(c) Node polyfill**: 0.0%
- **(d) Application code**: 0.0%
- **(e) Third-party library**: 0.0%

---

## 2. Target Chunk: `chunks/2117-ce6d988c465cc8a2.js`

- **File Path**: `static/chunks/2117-ce6d988c465cc8a2.js`
- **Total Size (statSize)**: 367,223 bytes (358.6 KB)
- **Total Size (parsedSize)**: 123,814 bytes (120.9 KB)
- **Total Size (gzipSize)**: 31,721 bytes (31.0 KB)
- **Total Modules**: 111 modules

### Top 10 Modules by Size
1. `node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-client.browser.production.min.js`
   - **Size**: 10,627 bytes parsed (11,459 bytes stat)
   - **Category**: (a) Next.js framework (RSC client runtime)
2. `node_modules/next/dist/compiled/react/cjs/react.production.min.js`
   - **Size**: 7,975 bytes parsed (8,609 bytes stat)
   - **Category**: (b) React core
3. `node_modules/next/dist/client/components/app-router.js`
   - **Size**: 6,840 bytes parsed (27,295 bytes stat)
   - **Category**: (a) Next.js framework (App Router)
4. `node_modules/next/dist/client/components/layout-router.js`
   - **Size**: 4,805 bytes parsed (23,431 bytes stat)
   - **Category**: (a) Next.js framework (Layout Router)
5. `node_modules/next/dist/client/components/router-reducer/ppr-navigations.js`
   - **Size**: 4,263 bytes parsed (28,646 bytes stat)
   - **Category**: (a) Next.js framework (PPR Navigation Reducer)
6. `node_modules/next/dist/compiled/scheduler/cjs/scheduler.production.min.js`
   - **Size**: 3,798 bytes parsed (4,259 bytes stat)
   - **Category**: (b) React core (Scheduler)
7. `node_modules/next/dist/server/app-render/dynamic-rendering.js`
   - **Size**: 3,614 bytes parsed (9,688 bytes stat)
   - **Category**: (a) Next.js framework (Dynamic Rendering Client)
8. `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js`
   - **Size**: 2,809 bytes parsed (8,939 bytes stat)
   - **Category**: (a) Next.js framework (Server Actions Reducer)
9. `node_modules/next/dist/client/components/router-reducer/reducers/navigate-reducer.js`
   - **Size**: 2,634 bytes parsed (21,586 bytes stat)
   - **Category**: (a) Next.js framework (Navigate Reducer)
10. `node_modules/next/dist/client/components/error-boundary.js`
    - **Size**: 2,505 bytes parsed (7,074 bytes stat)
    - **Category**: (a) Next.js framework (Error Boundary)

### Category Breakdown
- **(a) Next.js framework (App Router runtime)**: ~90.0% (111,541 bytes parsed)
- **(b) React core (react.production.min + scheduler)**: ~10.0% (11,773 bytes parsed)
- **(c) Node polyfill**: 0.0%
- **(d) Application code**: 0.0%
- **(e) Third-party library**: 0.0%

---

## 3. Findings & Observations

1. Both chunks `fd9d1056` and `2117` are pure Next.js 14 Framework and React internal runtime chunks:
   - `fd9d1056`: Dedicated `react-dom` runtime chunk.
   - `2117`: Next.js App Router orchestration runtime (`app-router`, `layout-router`, `router-reducer`, `react-server-dom-webpack`).
2. Heavy third-party libraries (`@xyflow/react` totaling 170.4 KB parsed and `dagre` totaling 27.9 KB parsed) are bundled into separate chunks:
   - `chunks/3585-*.js` (88.6 KB @xyflow + 27.9 KB dagre)
   - `chunks/1a258343-*.js` (81.8 KB @xyflow)
3. Lucide icons were previously scattered across chunks. Enabling `experimental.optimizePackageImports: ['lucide-react', '@xyflow/react']` and per-icon imports tree-shakes unused icons cleanly.
