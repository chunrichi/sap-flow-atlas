# 04 · 目录结构

> 这是本项目的核心交付之一。原则：**内容可 review，视图可替换，构建可复现。**

## 1. 完整目标结构

```text
sap-map-dsh/
├─ README.md
├─ package.json
├─ pnpm-lock.yaml
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
├─ index.html
├─ .nvmrc
├─ .gitignore
├─ .editorconfig
│
├─ docs/                              # 设计文档、ADR、调研（先读这里）
│  ├─ 01-research.md
│  ├─ 02-information-architecture.md
│  ├─ 03-data-model.md
│  ├─ 04-directory-structure.md
│  ├─ 05-tech-stack.md
│  ├─ 06-content-guide.md
│  ├─ 07-roadmap.md
│  ├─ 08-ingestion.md
│  ├─ 13-process-catalog.md
│  ├─ 14-archify-review.md            # Archify 诊断与优化记录
│  ├─ architecture/                   # 可交互架构图、离线诊断、分析配置
│  │  ├─ sap-flow-atlas.architecture.html
│  │  ├─ sap-flow-atlas.architecture.json   # 可编辑的图源
│  │  ├─ sap-flow-atlas.code-analysis.html
│  │  └─ code-analysis.config.json
│  └─ adr/
│     └─ 0001-canonical-graph-and-view-layouts.md
│
├─ content/                           # ★ 知识内容（产品的一部分，不是素材）
│  ├─ modules/                        # 模块元数据，一模块一目录
│  │  ├─ sd/module.yaml
│  │  ├─ mm/module.yaml
│  │  ├─ fi/module.yaml
│  │  ├─ co/module.yaml
│  │  ├─ pp/module.yaml
│  │  ├─ qm/module.yaml
│  │  ├─ pm/module.yaml
│  │  ├─ ewm/module.yaml
│  │  ├─ ps/module.yaml
│  │  ├─ cs/module.yaml
│  │  ├─ hr/module.yaml
│  │  └─ abap/module.yaml
│  ├─ flows/                          # 端到端流程
│  │  ├─ order-to-cash/flow.yaml
│  │  ├─ procure-to-pay/flow.yaml
│  │  ├─ record-to-report/flow.yaml
│  │  └─ plan-to-produce/flow.yaml
│  ├─ processes/                      # 模块内业务流程：<module>/<process-id>/
│  │  ├─ sd/sd-order-management/
│  │  │  ├─ process.yaml
│  │  │  └─ notes.mdx                 # 可选长文：背景、组织、常见问题
│  │  └─ mm/mm-procurement/
│  │     └─ process.yaml
│  ├─ steps/                          # 流程步骤：<primary-module>/<step-id>/
│  │  ├─ sd/sd-va01-create-sales-order/
│  │  │  ├─ step.yaml
│  │  │  └─ notes.mdx
│  │  ├─ sd/sd-atp-availability-check/step.yaml
│  │  ├─ sd/sd-vl01n-create-delivery/step.yaml
│  │  ├─ sd/sd-vf01-create-billing/step.yaml
│  │  ├─ fi/fi-f28-post-incoming-payment/step.yaml
│  │  ├─ mm/mm-me51n-create-purchase-requisition/step.yaml
│  │  ├─ mm/mm-me21n-create-purchase-order/step.yaml
│  │  ├─ mm/mm-migo-post-goods-receipt/step.yaml
│  │  └─ mm/mm-miro-verify-invoice/step.yaml
│  ├─ objects/                        # 开发对象，按类型分目录
│  │  ├─ tcode/VA01.yaml
│  │  ├─ tcode/VL01N.yaml
│  │  ├─ tcode/VF01.yaml
│  │  ├─ tcode/ME21N.yaml
│  │  ├─ tcode/MIGO.yaml
│  │  ├─ tcode/MIRO.yaml
│  │  ├─ table/VBAK.yaml
│  │  ├─ table/VBAP.yaml
│  │  ├─ table/EKKO.yaml
│  │  ├─ table/EKPO.yaml
│  │  ├─ table/MSEG.yaml
│  │  ├─ bapi/BAPI_SALESORDER_CREATEFROMDAT2.yaml
│  │  ├─ bapi/BAPI_PO_CREATE1.yaml
│  │  ├─ enhancement/MV45AFZZ.yaml
│  │  ├─ cds/I_SalesOrder.yaml
│  │  ├─ cds/I_PurchaseOrder.yaml
│  │  ├─ odata/API_SALES_ORDER_SRV.yaml
│  │  └─ …                            # 示例共 365 个对象，此处只列代表项
│  ├─ snippets/                       # 代码与代码元数据同目录
│  │  ├─ abap/bapi-create-sales-order.yaml
│  │  ├─ abap/bapi-create-sales-order.abap
│  │  ├─ abap/user-exit-save-document.yaml
│  │  ├─ abap/user-exit-save-document.abap
│  │  ├─ abap/select-sales-order.yaml
│  │  └─ abap/select-sales-order.abap
│  ├─ scenes/                         # ★ 视图：只存引用、坐标、边
│  │  ├─ universe.scene.yaml
│  │  ├─ module-abap.scene.yaml
│  │  ├─ process-sd-order-management.scene.yaml
│  │  ├─ flow-order-to-cash.scene.yaml
│  │  └─ flow-develop-to-deploy.scene.yaml
│  ├─ crosslinks/                     # 跨模块语义关系
│  │  ├─ sd-billing-to-fi-payment.yaml
│  │  ├─ sd-delivery-to-ewm-task.yaml
│  │  └─ …
│  ├─ glossary/
│  │  └─ terms.yaml
│  ├─ assets/                         # 内容图片 / 导出截图（构建时复制与哈希）
│  │  └─ README.md
│  └─ sources/
│     └─ sources.yaml
│
├─ src/                               # ★ 前端应用
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ router.tsx
│  ├─ app/
│  │  ├─ providers.tsx
│  │  ├─ AppShell.tsx
│  │  ├─ ErrorBoundary.tsx
│  │  └─ layout/
│  ├─ canvas/                         # 通用画布能力，不含业务语义
│  │  ├─ Canvas.tsx
│  │  ├─ nodes/
│  │  │  ├─ ModuleNode.tsx
│  │  │  ├─ FlowNode.tsx
│  │  │  ├─ ProcessNode.tsx
│  │  │  ├─ StepNode.tsx
│  │  │  ├─ PortalNode.tsx
│  │  │  ├─ GroupNode.tsx
│  │  │  └─ NoteNode.tsx
│  │  ├─ edges/
│  │  │  ├─ FlowEdge.tsx
│  │  │  ├─ HandoffEdge.tsx
│  │  │  └─ DependencyEdge.tsx
│  │  ├─ controls/
│  │  │  ├─ ZoomControls.tsx
│  │  │  ├─ MiniMap.tsx
│  │  │  └─ Legend.tsx
│  │  ├─ hooks/
│  │  │  ├─ useSemanticZoom.ts
│  │  │  ├─ useCamera.ts
│  │  │  ├─ useSpotlight.ts
│  │  │  └─ useKeyboardNav.ts
│  │  └─ theme.ts
│  ├─ features/
│  │  ├─ universe/                    # L0 全景
│  │  ├─ module/                      # L1 模块工作区
│  │  ├─ process/                     # L2 流程画布
│  │  ├─ object-focus/                # L3 对象聚焦
│  │  ├─ hover-card/
│  │  ├─ inspector/
│  │  ├─ breadcrumb/
│  │  ├─ search/
│  │  ├─ tour/                        # 首次进入引导
│  │  └─ trail/                       # 访问轨迹
│  ├─ content/
│  │  ├─ types.ts
│  │  ├─ schemas/                     # Zod schema：前端与 scripts 共用
│  │  │  ├─ module.ts
│  │  │  ├─ flow.ts
│  │  │  ├─ process.ts
│  │  │  ├─ step.ts
│  │  │  ├─ object.ts
│  │  │  ├─ snippet.ts
│  │  │  ├─ scene.ts
│  │  │  └─ source.ts
│  │  ├─ loader.ts
│  │  └─ occurrences.ts
│  ├─ generated/                      # 构建产物（gitignore）
│  │  ├─ content.json                 #   当前实现的单文件聚合产物
│  │  ├─ occurrences.json             #   目标拆分（Phase 3+）
│  │  ├─ backlinks.json
│  │  ├─ search.json
│  │  └─ stats.json
│  ├─ components/ui/                  # 无业务语义的 UI 原子组件
│  ├─ lib/
│  │  ├─ cn.ts
│  │  ├─ i18n.ts
│  │  ├─ format.ts
│  │  └─ analytics.ts                 # 可选，默认关闭
│  ├─ styles/
│  │  ├─ globals.css
│  │  └─ tokens.css
│  └─ i18n/
│     ├─ zh.ts
│     └─ en.ts
│
├─ scripts/                           # 内容管线（Node，不打包进前端）
│  ├─ validate-content.ts
│  ├─ build-graph.ts
│  ├─ build-scenes.ts
│  ├─ build-search-index.ts
│  ├─ build-all.ts
│  ├─ layout-scenes.ts                # ELK 预布局，缺失坐标时兜底
│  ├─ new-content.ts                  # 交互式脚手架（Phase 2）
│  └─ lib/
│     ├─ load-content.ts
│     ├─ resolve-refs.ts
│     └─ ids.ts
│
├─ public/
│  ├─ icons/modules/                  # 模块图标（SVG）
│  ├─ favicon.svg
│  └─ og-image.png
│
├─ tests/
│  ├─ content/
│  │  ├─ schema.test.ts
│  │  ├─ refs.test.ts
│  │  └─ scenes.test.ts
│  ├─ unit/
│  └─ e2e/
│     ├─ drilldown.spec.ts
│     └─ inspector.spec.ts
│
└─ .github/workflows/
   ├─ ci.yml                          # validate + typecheck + unit + build
   └─ deploy.yml                      # main → GitHub Pages
```

> 说明：这是目标结构；`content/`、`src/`、`scripts/`、`public/`、`tests/`、`.github/workflows/` 均已创建。实际落地的是其中一部分，差异见第 8 节。

## 2. 为什么这样分层

### 2.1 `content/` 与 `src/` 分离

- 内容编辑者（SAP 顾问、业务专家）不需要懂 React；
- 内容可以单独 diff、review、校验、被 AI 生成；
- 未来可以把 `content/` 抽成独立包或换一个渲染器（比如 Astro 文档站）；
- 防止「改一个坐标顺手改一段业务事实」的耦合。

### 2.2 模块优先的目录，全局唯一的 ID

- `steps/<primary-module>/...` 让模块 owner 有清晰的归属；
- 但 `step.id` 是全局的，跨模块复用通过引用完成；
- 对象按类型分目录，是因为查对象时通常先知道「我要找一张表」而不是「它属于哪个流程」。

### 2.3 `scenes/` 单独一层

- 场景的改动频率远高于内容（调坐标、加注释、改布局）；
- 内容 diff 应当表达「事实变化」，而不是「坐标变化」；
- 同一份内容可以用不同场景渲染（模块视图、端到端视图、教学视图）。

### 2.4 `src/canvas/` 与 `src/features/` 分离

- `canvas/` 是通用能力：节点注册表、边、缩放、相机、聚光、键盘导航；
- `features/` 是业务视图：全景怎么排、模块工作区显示什么、检查器有哪些 Tab；
- 未来加「对象依赖图」时，只需新增 feature，不改画布内核。

### 2.5 `scripts/` 独立

- 内容校验与生成是构建期任务，不进入浏览器 bundle；
- 可以单独在 CI 跑，失败即阻断；
- 脚本复用 `src/content/schemas/`，避免 schema 两份。

### 2.6 不采用 monorepo

当前只有一个可部署应用。单仓单包最简单；`content/`、`src/canvas/` 已经形成清晰边界，未来需要时再抽 `packages/content-model`，成本很低。现在就拆会增加配置与心智负担。

## 3. 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 目录 / 文件名 | kebab-case | `sd-order-management/` |
| YAML key | camelCase | `primaryModule`、`updatedAt` |
| 实体 ID | 小写 kebab；对象用 `type:technicalName` | `sd-va01-create-sales-order` |
| SAP 技术名 | 保留原始大写 | `VBAK`、`BAPI_SALESORDER_CREATEFROMDAT2` |
| React 组件 | PascalCase | `StepNode.tsx` |
| Hook | `use` 前缀 | `useSemanticZoom.ts` |
| 内容长文 | `notes.mdx` | 与 `step.yaml` 同目录 |
| 代码片段 | `<id>.yaml` + `<id>.<lang>` | `bapi-create-sales-order.abap` |
| 场景文件 | `<scene-id>.scene.yaml` | `module-sd.scene.yaml` |

约定：

- 一个目录一个实体，目录名 = 实体 ID；
- 同一实体的元数据与长文同目录，避免「孤儿文件」；
- 不在文件名里写版本号（版本由 Git 管理）；
- 图片等二进制资源放 `content/assets/<entity-id>/`，文件名用 kebab-case。

## 4. 内容构建管线

```text
content/**/*.yaml + *.mdx + *.abap
        │
        ▼
 ① load-content        读取、解析 YAML / frontmatter、展开短引用
        │
        ▼
 ② validate            Zod 结构校验 + 引用完整性 + 业务规则
        │  error → 退出码 1，CI 失败
        ▼
 ③ normalize           补默认值、统一日期 / 语言字段、排序
        │
        ▼
 ④ build-graph         实体图、反向引用、occurrences、stats
        │
        ▼
 ⑤ build-scenes        解析节点 ref → 摘要；ELK 补缺失坐标；裁剪
        │
        ▼
 ⑥ build-search        MiniSearch 文档与倒排索引
        │
        ▼
 ⑦ emit                src/generated/*.json
        │
        ▼
 ⑧ vite build          React 应用 + 按场景拆分的 JSON chunk
        │
        ▼
  dist/  →  GitHub Pages
```

命令（目标）：

```bash
pnpm content:validate    # 只校验
pnpm content:build       # 生成 src/generated
pnpm content:watch       # 监听 content 变化，增量重建（Phase 2）
pnpm dev                 # predev: content:build → vite
pnpm build               # prebuild: content:build → tsc → vite build
pnpm preview             # 本地预览 dist
pnpm test                # vitest
pnpm test:e2e            # playwright
```

## 5. GitHub Pages 发布

### 5.1 关键配置

- `vite.config.ts` 的 `base` 从环境变量读取：本地 `/`，Actions 中 `/${{ github.event.repository.name }}/`；
- 使用 **hash 路由**（`#/m/sd`），避免项目页刷新 404；无需 `404.html` 重写；
- 构建产物是纯静态文件，不需要 Node 运行时；
- `deploy.yml` 使用官方 Pages Actions：`configure-pages` → `upload-pages-artifact` → `deploy-pages`；
- 权限：`contents: read`、`pages: write`、`id-token: write`；
- 环境：`github-pages`；并发组避免重复部署。

### 5.2 工作流草案

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm content:validate
      - run: pnpm build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

## 6. 规模与性能

假设第一阶段 12 模块 × 8 流程 × 8 步骤 ≈ 768 个步骤、约 2000 个对象：

| 关注点 | 策略 |
| --- | --- |
| 首屏 | 只加载 universe 场景 + 模块摘要，目标 JS < 250KB gzip |
| 场景切换 | 每个场景一个 JSON chunk，动态 `import()` |
| 画布节点 | 单场景控制在 60 个节点以内；超出则拆分或折叠 |
| 搜索 | 索引按需加载；> 500KB 时改为 Web Worker + 分段 |
| 布局 | 构建期 ELK 预计算，运行时零布局 |
| 渲染 | `onlyRenderVisibleElements`；节点 `memo`；缩放只用 CSS LOD |
| 图片 | 内容图走 `loading="lazy"` + 构建期哈希 |

## 7. 备选结构（以及为什么不选）

| 方案 | 描述 | 问题 |
| --- | --- | --- |
| 内容与功能同目录 | `src/features/sd/processes/...` | 内容与代码耦合，顾问无法独立编辑，diff 噪音大 |
| 扁平 `content/steps/*.yaml` | 所有步骤放一层 | 1000 个文件难以浏览与认领 |
| 按流程存内容 | `content/processes/<id>/steps/...` | 同一流程被多流程引用时必然复制 |
| 只用 MDX | 每页一篇长文 | 无法生成稳定的图、边与对象关系 |
| Astro | 文档站 + React islands | 画布是全屏交互，Astro 收益有限；未来可加文档子站 |
| Monorepo | `apps/web` + `packages/content` | 当前规模不划算 |

## 8. 当前实现与目标的差异

- 内容管线由 `scripts/build-content.ts`（加载、派生索引、输出 `content.json`）与 `scripts/content-validation.ts`（按实体分组的 Zod/引用校验）组成；尚未拆成 `build-graph` / `build-scenes` / `build-search`；
- Zod schema 目前集中在 `src/content/schemas.ts`，尚未拆成 `schemas/` 目录；
- 代码高亮使用自研 ABAP tokenizer，未引入 Shiki；
- 搜索使用 `cmdk` 内置过滤，未生成 MiniSearch 索引；
- `src/` 已实现画布、Hover、检查器（懒加载）、命令面板、移动端分组列表、语义缩放；`tests/` 已有内容完整性测试；`public/` 有 favicon/.nojekyll；`.github/workflows/` 有 CI 与 Pages；组件/E2E 测试、OG 图/自定义 404 待补；
- 场景布局优先读 YAML；缺失时由 `src/lib/scenes.ts` 自动生成，保证新增模块/流程即可浏览。

## 9. 演进预留

- `content/_redirects.yaml`：实体重命名后的跳转（Phase 3）；
- `content/versions/`：同一对象的多 SAP 版本（Phase 4）；
- `packages/content-model/`：内容模型独立发布（按需）；
- `src/features/object-graph/`：对象依赖图，不改画布内核；
- `src/features/compare/`：版本对比 / 差异视图。
