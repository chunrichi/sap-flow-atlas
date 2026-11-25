# 01 · 调研：同类项目、交互参考与知识来源

> 调研时间：2026-11。目标不是找一个可以照搬的项目，而是确认三件事：**内容怎么组织**、**画布怎么交互**、**事实从哪里来**。

## 0. 结论先行

1. **没有找到「SAP 多模块 + 可下钻画布 + 开发对象」的完整开源对标品**。最接近的是商业产品 SAP Signavio Process Explorer（流程侧）和开源项目 abap_wiki（代码/对象侧），两者恰好互补。
2. **流程层级可以直接对齐 SAP 的 Business Process Hierarchy**：端到端流程 → 业务流程 → 流程步骤。这比自创一套分类更容易被 SAP 从业者理解，也方便后续导入官方内容。
3. **「同一流程出现在多个模块」不应靠复制解决**。正确做法是「唯一内容图 + 多份视图布局」，详见 ADR-0001。
4. **画布交互的黄金法则仍是 Shneiderman 的 overview → zoom/filter → details-on-demand**。React Flow 适合做流程画布，但不适合一开始就画几千个节点；分层场景 + 按需加载是前提。
5. **内容可信度是这类项目的生命线**。调研到的成熟项目（abap_wiki、process-as-code）都把「引用来源 / 证据 / 审核状态」作为一等公民，本项目也必须如此。

## 1. 同类项目对标

| 项目 / 产品 | 类型 | 与本项目的关系 | 最值得借鉴 |
| --- | --- | --- | --- |
| SAP Signavio Process Explorer / Process Navigator | 商业产品 | 官方流程知识库，内容与交互的主要参照 | 流程层级、图中属性面板、侧栏关联流程、按图级别导航 |
| abap_wiki | 开源（MIT） | 最接近「开发对象知识库」的开源实现 | L0→L2 分层、对象 frontmatter、逐行证据、Obsidian 图谱 |
| sapknowledge | 开源 | 按模块组织的 SAP 文本知识库 | `modules/<模块>/` 目录、T-Code 清单、配置路径的写法 |
| graph-system | 开源 | 最接近「SAP 流程画布」的原型 | O2C 图、Hover 面板、聚光高亮、按查询追踪路径 |
| process-as-code | 开源 | 流程即数据、静态站点发布 | YAML 流程契约、从内容生成站点、GitHub Pages |
| SAP/btp-solution-diagrams | 官方开源资源 | 视觉语言与图标参考 | 官方 draw.io / SVG 图标体系，避免自造 SAP 视觉 |
| SAP Fiori Apps Reference Library | 官方 | 应用 ↔ 业务流程的映射来源 | 用 App 作为「业务步骤」的一种证据 |
| SAP Business Accelerator Hub | 官方 | API / OData 对象来源 | 对象详情、沙箱、按业务领域浏览 |
| Mermaid Process Metro Map | 个人项目 | 视觉隐喻参考 | 用「地铁图」讲一条端到端流程，降低理解成本 |

### 1.1 SAP Signavio Process Explorer / Process Navigator

官方定位是「探索 SAP 价值加速器与最佳实践」：业务能力图、解决方案图、流程模型、指标、行业实践，以及流程之间的关联。它的导航方式与我们的 L0→L2 非常接近：从流程总览进入流程图，图下方是属性，侧栏是相关流程，图级别（diagram levels）显示当前图在目录中的位置。

可借鉴：

- 流程不是孤立页面，而是有**上下文侧栏**（相关流程、相关对象、指标）；
- 图本身保持干净，属性放在图的下方或侧边，而不是堆在节点上；
- 用「图级别 / 面包屑」告诉用户当前位置；
- 内容按行业、场景、流程、子流程组织，允许同一流程被多个场景引用。

不能照搬：它是商业产品，内容与交互均受许可约束；我们只借鉴信息架构，不复制其内容与视觉资产。

- <https://www.signavio.com/products/process-explorer/>
- <https://help.sap.com/docs/cloud-alm/getting-started-process-navigator/overview>
- <https://help.sap.com/doc/d2ee04af5649445a91f655c23b8a9404/SHIP/en-US/SAPSignavioProcessExplorer_EN.pdf>

### 1.2 Gixsy95/abap_wiki

定位：把 SAP S/4HANA 系统（尤其是 `Z*` / `Y*` 自定义对象）转成可引用、可版本化的 Markdown / Obsidian 知识库，面向人与 AI Agent。它把内容分成分层：L0 清单 → L1 代码分析 → L2 功能与流程；每个对象页有结构化 frontmatter（对象类型、技术名、包、依赖、文档级别、来源哈希），并且每条结论都要求锚定到源码行（`[VERIFIED: path:N-M]`）。

可借鉴：

- **对象页的 frontmatter**：类型、技术名、包、依赖、来源、核对状态；
- **分层文档级别**：先有清单，再有代码事实，再有功能解释，不一步到位；
- **证据链**：每条断言可回溯到来源；无法证明的内容显式标注，而不是隐藏；
- **Obsidian 图谱**证明「网状知识」对 SAP 从业者有真实价值，但它的图是对象依赖图，不是业务流程画布——这正是我们可以补上的空位。

- <https://github.com/Gixsy95/abap_wiki>

### 1.3 brandedtamarasu-glitch/sapknowledge

定位：面向 Claude Code 的 SAP ECC 6.0 知识库，按 `modules/<模块>/` 组织 T-Code、配置路径、流程说明，并配有 `.claude/rules/` 做路由与消歧。

可借鉴：

- 模块目录 + 模块内 `tcodes.md`、`processes.md`、`config.md` 的拆分方式；
- 「消歧规则」很重要：同名流程、同义 T-Code、模块边界在 SAP 里非常常见；
- 但它以文本为主，缺少可视化与对象级关系，这印证了「结构化 + 画布」的差异化。

- <https://github.com/brandedtamarasu-glitch/sapknowledge>

### 1.4 sbdh11/graph-system

定位：SAP Order-to-Cash 的交互式图 + 对话查询。前端 React + Vite + `react-force-graph`，有 Hover 面板、聚焦高亮、发光效果和路径追踪；后端用规则解析自然语言。

可借鉴：

- Hover 面板作为「轻量预览」、点击再进入详情；
- 查询结果用**聚光（spotlight）**而不是隐藏其他节点，保留上下文；
- 动画粒子 / 发光用于表达「数据在流动」，但应克制，避免变成烟花。

不足：力导向图适合展示数据关系，不适合表达有明确方向的业务流程；节点一多就会变成毛线球。

- <https://github.com/sbdh11/graph-system>

### 1.5 dkharlanau/process-as-code

定位：用版本化的结构化文件定义业务流程，再生成流程地图、BPMN、文档与测试范围；站点本身发布在 GitHub Pages。

可借鉴：

- **流程即数据**：YAML 契约 + 稳定 ID，可 diff、可 review；
- 同一份内容派生多种视图（图、文档、BPMN）；
- 静态站点 + GitHub Actions 的发布方式，与我们的目标一致。

- <https://github.com/dkharlanau/process-as-code>
- <https://dkharlanau.github.io/process-as-code/>

### 1.6 其他

- **SAP/btp-solution-diagrams**：SAP 官方维护的 draw.io / SVG 图标库，适合做模块图标和架构图视觉参考。<https://github.com/SAP/btp-solution-diagrams>
- **SAP-samples/abap-cheat-sheets**：可执行的 ABAP 语法示例，适合作为示例代码的风格与正确性参考。<https://github.com/SAP-samples/abap-cheat-sheets>
- **SAP Fiori Apps Reference Library**：应用 ↔ 业务流程 / 角色，可作为「某步骤对应哪个 Fiori App」的来源。<https://www.sap.com/fiori-apps-library>
- **SAP Business Accelerator Hub**：OData / API 规范与沙箱，是开发对象详情的重要来源。<https://api.sap.com/>
- **Mermaid-Process-Metro-Map**：用一张 `.mmd` 画 SAP Business One 的流程地铁图。地铁图隐喻适合做「端到端流程」的入门视图。<https://github.com/iDinot21/Mermaid-Process-Metro-Map>

## 2. 交互与视觉参考

### 2.1 Overview first, zoom and filter, then details-on-demand

Shneiderman 1996 提出的信息可视化任务分类，至今仍是最可靠的交互骨架。对应到本项目：

- **Overview**：L0 全景只回答「有哪些模块、哪些主干流程」；
- **Zoom & filter**：点击模块进入工作区，点击流程进入画布；缩放不是装饰，而是改变信息密度；
- **Details-on-demand**：Hover 只给 3–5 个线索，点击才打开完整检查器。

- <https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf>

### 2.2 语义缩放（semantic zoom）

同一张画布在不同缩放下显示不同层级的信息：远看是模块色块 + 流程名称，中景是流程卡片 + 阶段，近景是步骤卡片 + T-Code + 对象数，最近处展开对象 chips。

关键实现原则：

- 不是无限细节，而是**离散的 3–4 个 LOD（level of detail）**，避免每个节点每帧重算；
- 缩放到阈值时用 CSS 过渡切换密度，节点位置不跳；
- 缩放到某个流程时，才加载该流程的完整对象数据。

参考：多分辨率知识图谱缩放专利（US10672155）描述了按「兴趣区域距离」分级的思路；学术上的 Flow States 也讨论了跨缩放尺度的「single view, multiple state」与动画过渡。

### 2.3 Hover 聚光（spotlight）

n8n 编辑器的做法值得直接借鉴：Hover 侧栏卡片时，画布上相关节点高亮、其余变暗；Hover 节点的状态图标时，用不遮挡节点的 tooltip。

本项目的 Hover 卡应遵守：

- 120ms 内不弹出，避免扫过时闪烁；
- 卡片不遮住当前节点，优先放在右侧，空间不足再翻转；
- 卡片自身可 Hover（有 180ms 离开宽限），否则无法点击里面的对象；
- 键盘聚焦节点时，卡片变为「固定」状态，可用 Tab 进入。

- <https://github.com/n8n-io/n8n/pull/25862>

### 2.4 无限画布 vs 有语义的流程图

Obsidian Canvas、tldraw、Excalidraw 证明了无限画布的自由度，但自由画布**不表达方向、不表达层级、不表达业务约束**。本项目要的是「受限但可导航」：

- 节点有类型、有层级、有稳定的语义 ID；
- 边有方向、有类型（顺序 / 交接 / 数据 / 依赖）；
- 布局可自动生成，也允许人工微调；
- 用户不能随意拖出新事实，只能调整视图。

- <https://obsidian.md/canvas>

### 2.5 地铁图隐喻

端到端流程（O2C、P2P）天然像地铁线路：一条主线穿过多个模块「站点」，换乘即跨模块交接。适合做 L0 的流程叠加层或独立的「线路图」视图。注意：地铁图适合讲**叙事**，不适合承载对象细节。

### 2.6 动效原则

只做三类动画：

1. **层级变化**：下钻时相机推进 + 旧层级淡出 + 新层级淡入（300–450ms）；
2. **路径流动**：选中流程时，边用 dashoffset 或粒子表达方向（600–900ms，循环但低对比度）；
3. **焦点切换**：Hover / 选中时其余节点降透明度（150–250ms）。

所有动画都要有 `prefers-reduced-motion` 降级；不做无意义的弹跳、闪烁和粒子雨。

## 3. 技术候选对比

| 方案 | 优势 | 局限 | 结论 |
| --- | --- | --- | --- |
| **React Flow（@xyflow/react）** | 节点/边/自定义 DOM 节点成熟，支持嵌套子流程、迷你地图、视口 API，MIT | 大规模图（数千可见节点）需要自己做虚拟化；不是 GPU 渲染 | **主选**：流程画布与模块工作区 |
| tldraw | 无限画布体验极佳，选择/缩放/手绘成熟 | 语义化流程、自动布局、下钻要大量自建；授权模式需确认 | 不选：自由度超过需求 |
| Cytoscape.js | 图算法与布局丰富，适合关系网络 | DOM 卡片与富交互较别扭 | 备选：对象依赖图 |
| Sigma.js | WebGL，大图性能好 | UI 层需自建，流程语义弱 | 备选：未来全局大图 |
| Cosmograph | GPU 力导向，适合知识图谱 | 视觉偏「星云」，不适合业务流程叙事 | 观察 |
| D3 | 完全可控 | 成本最高，交互细节都要自己写 | 不选 |

布局：**ELK.js**（分层布局，适合有方向的流程）预计算；模块全景可用简单的网格 / 力导向。ELK 为 EPL-2.0，可作依赖使用。

动效：**Motion**（原 Framer Motion），MIT。代码高亮：**Shiki**；若 ABAP grammar 不可用，退回 Prism 的 ABAP 组件。搜索：**MiniSearch** + `cmdk` 命令面板。状态：**Zustand** + URL。校验：**Zod**。

## 4. 知识来源与准确性

| 来源 | 用途 | 注意 |
| --- | --- | --- |
| SAP Help Portal <https://help.sap.com/> | 流程、配置、对象官方说明 | 链接 + 改写，不整段复制 |
| SAP Business Accelerator Hub <https://api.sap.com/> | API / OData / 业务对象 | 注意版本与 scope |
| SAP Fiori Apps Reference Library | App ↔ 业务流程 | 应用名与版本会变化 |
| SAP-samples/abap-cheat-sheets | ABAP 写法与示例 | 示例需按本项目场景改写 |
| SAP Community / 博客 | 实践经验、坑 | 非官方，必须标注 |
| 第三方 T-Code 站（如 tcodesearch.com） | 快速查 T-Code 描述 | 交叉核对官方文档；不单独作为「已验证」来源 |
| 真实系统导出（SE16 / SE80 / SE11 / SE37 / SE24 / SE93） | 对象事实 | 不发布客户数据；对象名可脱敏 |

建议在 `content/sources/sources.yaml` 中为每个来源分配稳定 ID，内容只引用 ID。这样：

- 来源 URL 变更只改一处；
- 可以统计「哪些内容没有来源」；
- 可以在 UI 上显示核对日期与版本。

## 5. 风险与边界

| 风险 | 说明 | 对策 |
| --- | --- | --- |
| 内容准确性 | SAP 版本差异大，T-Code / 表 / BAPI 可能随版本变化 | 每条内容标注 `sapVersion`、`status`、`sources`；未核对的内容显式标灰 |
| 内容规模 | 12 模块 × 数十流程 × 数十步骤，手工维护成本高 | 结构化 YAML + 脚本校验 + 半自动导入 + AI 只做草稿 |
| 画布性能 | 一次渲染上千节点会卡 | 分层场景、按需加载、可见性渲染、预计算布局 |
| 版权 | SAP 文档与图标受版权约束 | 只链接与改写；图标使用官方开源资源或自绘 |
| 过度设计 | 一开始就做 3D / 力导向 / 全量图 | 先做 L0→L2 的清晰路径，再扩展 |

## 6. 对项目的直接决定

1. 采用 **L0 全景 → L1 模块 → L2 流程 → L3 对象** 四层，而不是一张无限大的图。
2. 内容模型采用 **Flow（端到端）/ Process（模块流程）/ Step（步骤）/ Object（开发对象）** 四类核心实体。
3. 画布采用 **React Flow + ELK 预布局**，场景数据独立于内容。
4. Hover 卡 + 右侧检查器双通道：Hover 给线索，检查器给完整信息。
5. 跨模块用 **portal 节点 + 同一 step 的多场景出现** 表达，不复制事实。
6. 所有内容必须有来源与审核状态；先求可信，再求多。
