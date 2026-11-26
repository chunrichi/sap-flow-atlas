# SAP Flow Atlas · SAP 业务流程图谱

> 面向人的、可缩放的 SAP 多模块知识库：从系统全景下钻到模块工作区、业务流程、流程步骤，再通过 Hover 卡进入开发对象与示例代码。

当前状态：**多视图工作台版**（浅色画布，尚未发布）。已打通 `首页 → 模块 → 流程/轨道 → 步骤 → 详情坞 → ABAP 对象/代码`，并扩到 10 条价值流、85 个模块流程（21 个可选 + 7 个例外）、238 个步骤（32 个条件步骤）、365 个开发对象；交互包含 Map / Track / Matrix / Table 四镜头、底部流程带与阶段轨、Peek/Pin 可调宽详情坞、只匹配过滤、对象索引与对象脉络、任意价值流 Story、A/B 对比、我的视图与移动端 bottom sheet，以及用**虚线 + 触发条件**表达的可选/例外流程。内容仍按 `status` 持续复核。

| 系统全景 | ABAP 开发地图 |
| --- | --- |
| ![系统全景](docs/assets/preview-home.png) | ![ABAP 开发地图](docs/assets/preview-abap.png) |
| **AP 六步流程（蛇形布局）** | **移动端流程列表** |
| ![AP 流程](docs/assets/preview-process.png) | ![移动端](docs/assets/preview-mobile.png) |
| **FI BAPI 代码与行注解** | **对象聚焦：VBAK 相关步骤高亮** |
| ![代码示例](docs/assets/preview-code.png) | ![对象聚焦](docs/assets/preview-focus.png) |
| **对象类型筛选（BAPI）** | **MiniMap（点开或按 M）** |
| ![对象类型筛选](docs/assets/preview-filter.png) | ![MiniMap](docs/assets/preview-minimap.png) |
| **钉住 Hover + 相关步骤** | **O2C 故事模式** |
| ![钉住 Hover](docs/assets/preview-pin.png) | ![O2C 故事模式](docs/assets/preview-story.png) |
| **流程对比（A/B）** | **最近访问轨迹** |
| ![流程对比](docs/assets/preview-compare.png) | ![最近访问](docs/assets/preview-recent.png) |
| **Track 轨道（多视图）** | **覆盖矩阵（多视图）** |
| ![Track 轨道](docs/assets/workbench/track.png) | ![覆盖矩阵](docs/assets/workbench/matrix.png) |
| **对象脉络（1/2 跳）** | **流程对比（并排详情）** |
| ![对象脉络](docs/assets/workbench/objects-lineage.png) | ![流程对比](docs/assets/workbench/compare.png) |
| **移动端流程 + 详情坞** | **任意价值流 Story** |
| ![移动端详情坞](docs/assets/workbench/mobile-track.png) | ![故事模式](docs/assets/workbench/story.png) |
| **可选流程：虚线 + 触发条件** | **模块地图：可选/例外图例** |
| ![可选流程](docs/assets/workbench/optional-process.png) | ![模块图例](docs/assets/workbench/module-optional.png) |
| **例外流程：发票冻结与冲销重开** | **FI 模块：12 流程与条件图例** |
| ![例外流程](docs/assets/workbench/exception-process.png) | ![FI 模块图例](docs/assets/workbench/module-optional-fi.png) |

---

## 1. 它解决什么问题

SAP 的知识天然是网状的：一个「销售订单」既属于 SD 的订单管理流程，也参与跨模块的 Order-to-Cash；它用到的表、BAPI、增强、CDS 又会被 MM、FI、EWM 的流程复用。传统 Wiki 用目录树描述它，丢失了方向、位置和关联。

本项目用一张**可缩放、可下钻的画布**表达这四层关系：

| 层级 | 视图 | 回答的问题 |
| --- | --- | --- |
| L0 系统全景 | Universe | SAP 有哪些模块？它们如何被端到端流程串起来？ |
| L1 模块工作区 | Module workspace | 这个模块内部有哪些业务流程？边界在哪里？ |
| L2 流程画布 | Process canvas | 这个流程按什么顺序走？每一步做什么？ |
| L3 对象聚焦 | Object focus | 这一步涉及哪些开发对象？代码长什么样？ |

核心交互承诺：**任何时刻都知道「我在系统的哪里」**，并且可以从任意节点看见它在其他模块中的同源位置。

## 2. 设计原则

1. **内容与视图分离**：业务流程和开发对象只存一份（canonical graph）；模块画布只是引用它们的「场景 / 布局」。重复出现在布局，不重复在事实。
2. **内容即数据**：`content/` 下的 YAML / MDX 是产品的一部分，可 review、可 diff、可被脚本校验，也可被 AI 辅助生成。
3. **先看懂，再深入**：Overview first, zoom & filter, details on demand。Hover 给线索，点击才进入细节。
4. **位置感优先**：面包屑、场景栏、左侧导航树、迷你地图与跨模块门户常驻；访问轨迹逐步补齐。
5. **动效服务于理解**：只做「层级变化、路径流动、焦点切换」三类动画；尊重 `prefers-reduced-motion`。
6. **可静态发布**：纯前端 + 预生成 JSON，GitHub Pages 可直接托管，无需后端。

## 3. 目录速览

```text
sap-map-dsh/
├─ docs/                 # 设计文档与 ADR（先读这里）
├─ content/              # ★ 知识内容：模块 / 流程 / 步骤 / 对象 / 代码 / 场景
│  ├─ modules/           #   模块元数据
│  ├─ flows/             #   端到端流程（O2C、P2P…）
│  ├─ processes/         #   模块内业务流程
│  ├─ steps/             #   流程步骤（全局唯一，可被多处引用）
│  ├─ objects/           #   开发对象（T-Code / 表 / BAPI / 增强 / CDS / OData…）
│  ├─ snippets/          #   示例代码与代码注解
│  ├─ scenes/            #   ★ 画布布局：只存引用 + 坐标 + 边
│  ├─ crosslinks/        #   跨模块关系与门户
│  ├─ glossary/          #   术语表
│  └─ sources/           #   来源库（URL、版本、核对日期）
├─ src/                  # React 应用：画布、节点、Hover 卡、检查器、移动端列表
│  ├─ content/           #   内容类型、Zod schema、数据访问
│  ├─ features/          #   canvas / mobile
│  ├─ components/        #   layout / search / hover / inspector
│  ├─ lib/               #   场景兜底布局、ABAP 高亮、路由工具
│  └─ generated/         #   构建产物 content.json（gitignore）
├─ scripts/              # 内容校验与构建：scripts/build-content.ts
├─ public/               # favicon、.nojekyll 等静态资源
├─ tests/                # Vitest 内容完整性测试
└─ .github/workflows/    # CI 与 GitHub Pages 部署
```

## 4. 文档索引

| 文档 | 内容 |
| --- | --- |
| [01 调研](docs/01-research.md) | 同类项目、知识来源、可借鉴的交互与技术 |
| [02 信息架构](docs/02-information-architecture.md) | 四层视图、导航、语义缩放、Hover / 检查器、跨模块 |
| [03 数据模型](docs/03-data-model.md) | 实体、字段、ID 规范、校验规则、派生索引 |
| [04 目录结构](docs/04-directory-structure.md) | 完整目录树、命名、构建管线、发布方式 |
| [05 技术选型](docs/05-tech-stack.md) | React Flow / Motion / Tailwind / ABAP 高亮等选型与取舍 |
| [06 内容规范](docs/06-content-guide.md) | 如何新增模块、流程、步骤、对象、场景 |
| [07 路线图](docs/07-roadmap.md) | 分阶段交付与验收标准 |
| [08 内容获取](docs/08-ingestion.md) | 手工 / 半自动 / AI 辅助的内容生产与审核 |
| [09 ABAP 内容](docs/09-abap-content.md) | ABAP 工具、增强、接口与代码的持续添加方式 |
| [10 交互审查](docs/10-interaction-review.md) | 当前交互地图、同类产品对标与下一步优先级 |
| [11 多视图工作台](docs/11-flexible-workbench-and-benchmarks.md) | 非 SAP 开源对标、多镜头/流程带/详情坞方案与 P0–P2 路线 |
| [12 流程与对象覆盖](docs/12-content-map.md) | 模块 × 价值流 × 流程 × 步骤 × 对象覆盖、可选/例外清单与下一步 |
| [13 模块流程与对象明细](docs/13-process-catalog.md) | 按模块列出每个流程的步骤、输入输出、规则与对象；可选/例外用虚线块标出 |
| [ADR-0001](docs/adr/0001-canonical-graph-and-view-layouts.md) | 为什么「内容图 + 视图布局」而不是按模块复制数据 |

## 5. 已放入的示例切片

`content/` 已从“单条示例”扩成可浏览的多模块知识库：

- **12 个模块**：SD、MM、FI、CO、PP、QM、PM、EWM、PS、CS、HR、ABAP/Basis
- **10 条端到端价值流**：O2C、P2P、R2R、Plan-to-Produce、A2R、H2R、S2C、P2Pft、M2A、D2D；**45 个阶段全部有流程覆盖**
- **85 个模块流程**：每个模块至少 4 个；新增交货与发货、开票冻结冲销、收货与供应商退货、发票冻结释放、银行对账、成本分摊、获利分析、BOM、MRP 异常、检验结果/拒收、故障抢修、设备校准、EWM 补货/盘点、项目资源/收尾、保修/安装、组织变更/离职、ABAP OData/工作流/后台作业/权限
- **28 个条件流程**：21 个 `optional`（信用管理、售前报价、询价寻源、委外、能力计划、质量通知、维护通知/校准、波次/补货、服务合同/保修/安装、时间管理、资产退役、内部订单、ABAP 接口/性能/迁移/工作流/后台作业）+ 7 个 `exception`（退货与贷项、开票冻结冲销、供应商退货、发票冻结释放、MRP 异常、检验批拒收、设备故障），在 Track、画布、流程带与图例中以**虚线 + 徽标 + 触发条件**呈现
- **238 个流程步骤**：其中 32 个条件步骤（ATP、信用检查、盘点、付款运行、催款、发票冻结、预算追加、能力平衡、MRP 清单、质量/维护通知、合同、考勤、SQL/运行时跟踪、批量导入等）
- **365 个开发对象**：T-Code 198、表 123、BAPI 10、CDS 9、增强 6、OData 6、函数 3、IDoc 3、类 2、Fiori 2、报表 2、作业 1；无孤立对象
- **19 段 ABAP 示例** 与 **5 个画布场景**：universe、ABAP 开发地图、SD 订单流程、O2C、D2D；其余模块/流程由自动布局生成

> 预览图覆盖 Map / Hover / 代码等既有交互；多视图工作台（Track / Matrix / Table / Peek-Pin 详情坞）以 [11 号文档](docs/11-flexible-workbench-and-benchmarks.md) 与本地运行版本为准。

> 新增内容以 `draft` 为主，标准流程与对象名可继续由 SAP 顾问逐条复核；`sources` 与 `status` 就是为此准备的。

> 示例内容用于验证结构，尚未逐条经过 SAP 顾问复核；字段 `status` 与 `sources` 就是为后续复核准备的。

## 6. 本地运行

环境：Node.js ≥ 22、pnpm ≥ 10。

```bash
pnpm install
pnpm content:validate   # 只校验内容，不写文件
pnpm content:report     # 覆盖矩阵 / 条件流程与条件步骤 / 缺口检查
pnpm content:catalog    # 生成 docs/13-process-catalog.md
pnpm test               # Vitest 内容完整性测试
pnpm dev                # 先构建 content，再启动 Vite；默认 http://127.0.0.1:4173
pnpm build              # 内容校验 + tsc + 生产构建
pnpm preview            # 预览 dist
```

已实现：

- **多视图工作台**：三栏 + 状态栏；Map / Track / Matrix / Table 四镜头共享 `view/step/object/filter` URL 状态；默认 Process/Flow 用 Track、Universe/Module 用 Map；
- **条件流程表达**：流程级 `variant: core | optional | exception` + `trigger`、步骤级 `optional` + `condition`；轨道卡片、画布节点、底部流程带、Table 清单与图例统一使用虚线 + 徽标 + 触发条件说明，主干排序与步骤序号保持不变；
- **默认更轻**：Process 页顶栏只留「视图 / 筛选 / 更多」，阶段轨只在端到端流程页；Track 摘要默认收起，流程带单行；
- **字号统一**：10 / 11 / 12 / 14 / 16 / 20 六档，历史 8–20px 任意值在 `globals.css` 中收敛；
- **快速总览**：底部流程带（保留原步骤序号、状态、对象数；←/→、J/K）、端到端流程页的阶段轨（父 flow 阶段、当前阶段、覆盖计数）、覆盖矩阵（模块 × 价值流，点单元格浮层列出流程）；
- **细节容器**：Peek（320px）/ Pin（360–640px 可拖拽）/ 自动避让 / 上一步下一步 / 对象 chips / 双向关系；`Esc` 关闭并恢复上下文；
- **只匹配过滤**：模块 / 对象类型 / 状态 / 角色 / 价值流；`仅显示匹配` 硬过滤，Map/Track/Matrix/Table/流程带同步；
- **左侧知识库导航树**：≥1280px 常驻、可折叠；<1280 抽屉。模块 → 流程 → 步骤 + 10 条价值流 + 我的视图 + 对象索引；
- **对象追踪**：`#/objects` 对象索引、Where Used、对象脉络 1/2 跳（含反向关系）；
- **任意 flow 的故事模式**：5–8 步、上一步/下一步、自动播放、键盘、URL 深链；O2C 保留编辑注释；
- **A/B 对比**：底部并排双列，非模态，展示共同/独有对象与步骤差异；
- **我的视图 / 领域预设**：localStorage 保存 URL 组合；销售 / 采购 / 财务 / ABAP 领域预设收在筛选面板；首次全景提示；
- **MiniMap**：场景视图框、点击/拖拽导航、`M` 开关；
- **Hover 钉住**：对象 Hover 可直接看相关步骤，钉住后不随鼠标离开消失；
- **最近访问**：sessionStorage 保留 5 个场景，场景栏一键回跳；
- **可访问性**：跳过链接、Esc 关闭、`aria-current`、`aria-live`、焦点环、reduced-motion；
- **共享元素过渡**：模块卡 → 模块工作区使用 View Transitions（支持时）；
- 首页 4 条主干丝带 + 右上角 **10 条价值流目录**，避免 10 条交叉边；
- 5–6 步流程采用蛇形布局，避免横向压缩；
- 语义缩放：缩小时隐藏摘要与对象 chips，只保留编号、T-Code、标题；
- Hover 卡：对象 chips、ABAP 代码预览、跨模块提示；
- 详情坞：概览 / 开发对象 / 代码 / 跨模块 / 来源（Peek 与 Pin 两态、可拖拽）；
- 对象聚焦：打开对象检查器时高亮使用它的步骤，淡化无关节点；
- 238 个步骤均包含业务规则与常见问题；19 段 ABAP 示例覆盖 12 个模块；
- ABAP 开发地图、D2D 价值流与 Open SQL / BAPI / 用户出口示例；
- 命令面板（`⌘K` / `Ctrl+K`）与移动端 Track / 表格 / bottom sheet；
- `prefers-reduced-motion`、URL 深链接、`?shot=1` 截图模式；
- Vitest 内容测试 + 工作台/Story 派生测试（21 个）+ 阶段覆盖、条件字段与 12 类对象覆盖校验 + GitHub Actions CI；
- GitHub Pages 部署 workflow（`VITE_BASE` 自动按仓库名设置，默认由 `PAGES_ENABLED` 变量控制）。

下一阶段：SAP 顾问内容复核、来源深链、代码片段补齐、GitHub Pages 发布、真实用户可用性测试与更多角色化视图；238 个步骤的规则/常见问题已补齐，可选/例外流程已建模，后续按 SAP 版本变化维护。

## 7. 发布到 GitHub Pages

仓库已包含 [deploy.yml](.github/workflows/deploy.yml)，但默认**不自动发布**：只有仓库变量 `PAGES_ENABLED=true` 时才会运行。准备发布时：

1. 在 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**；
2. 在 **Settings → Secrets and variables → Actions → Variables** 新增 `PAGES_ENABLED=true`；
3. 在 **Actions → Deploy GitHub Pages → Run workflow** 手动运行，或再次推送 `main`。

如果仓库是 private，请先确认账户/组织支持私有仓库 Pages；否则可先将仓库设为 public，或使用其他静态托管。

若部署到用户主页（`<user>.github.io`），需要把 workflow 里的 `VITE_BASE` 改成 `/`；如果是项目页，默认的 `/<repo>/` 即可。

## 8. 验证

```bash
pnpm content:validate   # 12 模块 / 85 流程 / 238 步骤 / 365 对象
pnpm content:report     # 模块与阶段覆盖、条件流程/步骤、缺口
pnpm test               # 21 个测试：内容一致性 + 阶段覆盖 + 条件字段 + 对象类型 + 过滤/脉络/视图状态/Story
pnpm typecheck
pnpm build              # dist/
```

截图验收覆盖桌面首页、模块、Track、Map、Matrix、Table、Peek/Pin、过滤、对象索引/脉络、Compare、Story，以及 1280 / 1024 / 390 移动端；`?shot=1` 会关闭大部分动效，便于稳定对比。

## 9. 声明

本项目为个人学习 / 知识整理项目，与 SAP SE 无隶属关系。SAP、S/4HANA、Fiori 等是 SAP SE 的商标。文档内容以官方文档链接与改写为主，不复制受版权保护的原文；示例 ABAP 代码为原创演示代码。