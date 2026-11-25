# 05 · 技术选型

> 版本号为 2026-11 查询 npm registry 的结果；实际以 lockfile 为准。原则：**少依赖、可静态托管、画布可控。**

## 1. 总览

| 层 | 选择 | 版本（调研时） | 许可证 | 理由 |
| --- | --- | --- | --- | --- |
| 框架 | React + TypeScript | 19.3 | MIT | 生态、类型、团队熟悉度 |
| 构建 | Vite | 8.3 | MIT | 快、静态输出简单、GitHub Pages 友好 |
| 路由 | React Router（hash） | v7 | MIT | 深链接 + 浏览器前进后退；hash 避免 Pages 404 |
| 画布 | `@xyflow/react`（React Flow） | 13.0 | MIT | 节点/边/DOM 卡片/视口/迷你地图成熟 |
| 布局 | `elkjs` | 0.12 | EPL-2.0 | 分层布局适合有向流程；构建期预计算 |
| 动效 | `motion` | 14.14 | MIT | 声明式、支持 reduced motion、布局动画 |
| 样式 | Tailwind CSS | 4.3 | MIT | 快速迭代 + 设计 token |
| 组件 | shadcn/ui + Radix | — | MIT | 可复制、可改、可访问性好 |
| 状态 | Zustand | 5.1 | MIT | 小而直接；避免 Context 重渲染 |
| 校验 | Zod | 4.6 | MIT | 运行时校验 + 类型推导，前后端共用 |
| 搜索 | `cmdk` 内置过滤（Phase 1）；MiniSearch（Phase 3） | 1.1 / 7.2 | MIT | 先用命令面板过滤，内容规模上来后再换可序列化索引 |
| 命令面板 | `cmdk` | 1.1 | MIT | 可访问性好、可定制 |
| 代码高亮 | 自研 ABAP tokenizer | — | 本项目 | 零依赖、体积小；保留 Shiki/Prism 作为后续可选方案 |
| 浮动定位 | `@floating-ui/react` | 0.27 | MIT | Hover 卡翻转/边界处理 |
| 图标 | lucide-react | — | ISC | 一致、可按需 tree-shake |
| 测试 | Vitest + Playwright | — | MIT / Apache-2.0 | 单元/内容校验 + 浏览器交互 |

## 2. 为什么是 React Flow

需求本质是「**有语义的节点 + 有方向的边 + 可下钻的层级 + 富文本卡片**」，不是自由白板，也不是纯数据网络。

React Flow 提供：

- 自定义 DOM 节点（可以放 T-Code、对象 chips、代码预览）；
- 自定义边（贝塞尔、折线、标签、动画）；
- 嵌套子流程（`parentNode` + `extent: parent`）与展开/折叠；
- 视口 API（`fitView`、`setCenter`、`zoomTo`）与受控 viewport；
- 内置迷你地图、控制器、节点工具栏；
- MIT 许可，GitHub Pages 无额外限制。

不选其他方案的原因：

| 方案 | 不适合的点 |
| --- | --- |
| tldraw | 自由画布很强，但「自动布局 + 有向流程 + 语义下钻 + 对象检查器」几乎都要自建；授权模式需确认 |
| Excalidraw | 手绘风格不适合企业知识库；数据模型偏绘图 |
| Cytoscape.js | 图算法强，但 DOM 卡片与富交互体验差 |
| Sigma.js / Cosmograph | 适合展示上万节点，不适合表达「流程步骤」的叙事与卡片 |
| D3 手写 | 自由度最高，但交互成本与维护成本也最高 |

### 2.1 大图策略

React Flow 不是 GPU 渲染，单场景节点数必须受控：

- 场景拆分：全景 12 节点、模块 5–10 个流程、流程 5–15 个步骤；
- 单个对象依赖图如果超过 200 节点，改用 Cytoscape.js / Sigma.js 的独立 feature；
- 用 `onlyRenderVisibleElements` 与 `memo` 控制渲染；
- 不做「一张图装下整个 SAP」的尝试。

## 3. 布局：ELK 预计算

- **流程画布**：`layered` 算法，方向 `RIGHT`，边按类型加权（`sequence` 权重高，`data` 低）；
- **模块工作区**：`layered` 或网格，按阶段分组；
- **全景**：手工网格 + 少量力导向微调（或直接手排，12 个节点不值得上力导向）；
- 布局在构建期执行，结果写入 `src/generated/scenes/<id>.json`；
- 场景 YAML 中的 `position` 优先于自动布局；缺失时才调用 ELK；
- 人工微调后把坐标写回 YAML，并在 PR 中只提交坐标 diff。

为什么不在运行时布局：首屏抖动、性能、可复现性。运行时只做「展开/折叠」的小范围重排。

## 4. 状态与数据流

```text
URL (hash)
  │  解析 sceneId / stepId / objectId
  ▼
Router → SceneLoader（动态 import JSON）
  │
  ├─→ Zustand: uiStore（hover、inspector、spotlight、cameraMemory）
  ├─→ Zustand: contentStore（graph、backlinks、scenes）
  └─→ React Flow: nodes / edges / viewport
          │
          ├─→ HoverCard（floating-ui）
          ├─→ Inspector（右侧抽屉）
          └─→ Search / CommandPalette（cmdk + 内容数组）
```

规则：

- **URL 是唯一导航真相**；Zustand 只存瞬时 UI 状态；
- 场景数据不可变，切换场景时整体替换；
- 相机位置按 `sceneId` 记忆，存在 `sessionStorage`；
- 检查器、Hover 卡不写入全局历史，避免返回键混乱；
- 搜索索引懒加载，首次打开命令面板时请求。

## 5. 渲染与性能

### 5.1 分包

| chunk | 内容 | 加载时机 |
| --- | --- | --- |
| `app` | React、路由、Shell、设计 token | 首屏 |
| `canvas` | React Flow、节点/边、相机 | 首屏（L0 需要） |
| `scene-universe` | 12 个模块摘要 | 首屏 |
| `scene-<id>` | 单个场景 JSON | 进入场景时 |
| `inspector` | 检查器、代码高亮 | 首次打开 |
| `search` | cmdk 面板 + 过滤（Phase 3 换 MiniSearch） | 首次打开 |

### 5.2 预算

| 指标 | 目标 |
| --- | --- |
| 首屏 JS（gzip） | ≤ 300KB |
| 首屏 LCP（本地/4G） | ≤ 2.5s |
| 场景切换 | ≤ 300ms 出现骨架，≤ 800ms 完整 |
| Hover 卡出现 | ≤ 150ms |
| 画布帧率 | 60fps（拖动/缩放） |
| 单场景节点 | ≤ 60 |

Phase 2 实测（2026-11-25，`pnpm build`）：主包 280KB gzip（含 108 步骤 / 185 对象 / 14 段代码、导航树、MiniMap、钉住 Hover、O2C 故事、流程对比与最近访问），检查器异步 chunk 54KB gzip，CSS 11KB gzip；内容规模上来后仍可接受，后续可再拆内容 chunk。

### 5.3 优化清单

- Motion 使用 `LazyMotion` + `domAnimation`，避免全量引入；
- 代码高亮使用自研 ABAP tokenizer，不引入额外语法包；如未来换 Shiki，只注册 ABAP / CDS 等需要的语言；
- 中文字体用 `font-display: swap`，只加载 400/600 两个字重；
- 图标按需 import，不做全量 barrel；
- 节点组件 `memo`，props 只传扁平摘要；
- 避免在 `onMove` 中 setState：LOD 用 rAF 节流 + `data-lod`；
- 图片使用 `loading="lazy"` + `decoding="async"`。

## 6. 样式与设计系统

- Tailwind 4 + CSS 变量作为 design token（颜色、间距、动效、圆角）；
- 模块色作为 CSS 变量注入（`--module-color`），节点只消费变量；
- 当前以浅色为主；暗色作为后续可选项，两套都要过对比度检查；
- 不使用 SAP Fiori 的视觉资产；需要 SAP 图标时使用 SAP 官方开源图标库或自绘；
- shadcn/ui 组件按需复制到 `src/components/ui/`，不做黑盒依赖。

## 7. 可访问性与国际化

- Radix primitives 提供焦点管理与 ARIA 基础；
- 画布键盘导航：Tab 进入，方向键按空间位置移动，Enter 打开，Esc 返回；
- `prefers-reduced-motion` 全局降级；
- 文案全部走 `src/i18n/`，内容字段本身支持 `zh` / `en`；
- 日期使用 `Intl.DateTimeFormat`，不做手工拼接。

## 8. 测试策略

| 层 | 工具 | 覆盖 |
| --- | --- | --- |
| 内容 schema | Vitest + Zod | 字段、枚举、长度、日期 |
| 引用完整性 | Vitest | 所有 ID 可解析、双向一致 |
| 场景完整性 | Vitest | 节点/边坐标、重复 ID、悬空引用 |
| 组件 | Vitest + Testing Library | Hover 卡、检查器 Tab、搜索 |
| E2E | Playwright | L0→L1→L2 下钻、Hover、深链接、键盘 |
| 视觉 | Playwright 截图 / chrome-screenshot-qa | 关键视口与主题 |

CI 顺序：`content:validate` → `tsc --noEmit` → `vitest run` → `vite build` →（可选）Playwright。

## 9. 发布

- 纯静态 SPA，`dist/` 直接部署；
- GitHub Actions + Pages（见 `docs/04`）；
- 未来自定义域名时只需改 `base` 与 CNAME；
- 不引入运行时后端；搜索、图、代码全部预生成；
- 如果未来要评论 / 统计，单独接第三方，不阻塞主站。

## 10. 风险与替代

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| React Flow 大版本升级 | API 变动 | 锁定版本；画布封装在 `src/canvas/`，业务不直接依赖 API |
| ELK 包体积 / 许可 | 构建体积；EPL 合规 | 只在构建期使用，不进 bundle；不修改 ELK 源码 |
| 语法高亮扩展 | 多语言支持不完整 | 当前聚焦 ABAP；未来按需接入 Shiki/Prism，不影响内容格式 |
| 中文字体 | 体积大 | 子集化 / 系统字体回退 |
| 内容规模膨胀 | 构建变慢 | 增量构建；按场景拆分；CI 缓存 |
| 浏览器兼容 | Safari 旧版 | 目标 evergreen；React Flow 与 CSS 变量均支持 |

## 11. 明确不做的事

- 不做 3D 画布（除非有明确的教学价值）；
- 不做实时协作 / 多人编辑（Git 就是协作层）；
- 不做在线编辑内容（内容进 Git，PR review）；
- 不做后端 API（静态优先）；
- 不引入 UI 组件库全家桶（按需复制）。
