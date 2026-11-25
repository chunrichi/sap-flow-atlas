# 03 · 数据模型

> 内容模型的目标：**事实只存一份，视图可以有无数种。** 所有跨模块的「重复」都由引用与派生索引解决。

## 1. 实体总览

```text
                 ┌──────────────┐
                 │   Module     │  12 个 SAP 模块
                 └──────┬───────┘
                        │ 包含 / 参与
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │   Flow     │  │  Process   │  │   Step     │
   │ 端到端流程  │◄─┤ 模块内流程  │◄─┤ 流程步骤    │
   └────────────┘  └────────────┘  └─────┬──────┘
          │                              │ 使用
          │                              ▼
          │                       ┌────────────┐
          │                       │   Object   │  T-Code / 表 / BAPI / CDS…
          │                       └─────┬──────┘
          │                             │ 关联
          │                             ▼
          │                       ┌────────────┐
          │                       │  Snippet   │  示例代码 + 行注解
          │                       └────────────┘
          ▼
   ┌────────────────────────────────────────────┐
   │ Scene（视图布局）                            │
   │ nodes: [{ ref: step:sd-va01, position }]    │  不拥有事实，只引用
   │ edges: [{ from, to, kind }]                 │
   └────────────────────────────────────────────┘
```

| 实体 | 文件位置 | 职责 | 是否可被多处引用 |
| --- | --- | --- | --- |
| Module | `content/modules/<id>/module.yaml` | 模块元数据、颜色、范围 | 是 |
| Flow | `content/flows/<id>/flow.yaml` | 端到端价值链（O2C 等）与阶段 | 是 |
| Process | `content/processes/<module>/<id>/process.yaml` | 模块内业务流程的步骤编排 | 是（跨模块流程可引用） |
| Step | `content/steps/<module>/<id>/step.yaml` | 单个业务步骤及其对象 | **是（核心）** |
| Object | `content/objects/<type>/<technicalName>.yaml` | 开发对象事实与关系 | 是 |
| Snippet | `content/snippets/<language>/<id>.yaml` + 代码文件 | 示例代码与行注解 | 是 |
| Scene | `content/scenes/<id>.scene.yaml` | 节点/边/坐标/分组 | 否（每个视图一份） |
| Crosslink | `content/crosslinks/<id>.yaml` | 跨模块语义关系 | 否 |
| Source | `content/sources/sources.yaml` | 来源去重与版本信息 | 是 |
| Glossary | `content/glossary/terms.yaml` | 术语表 | 是 |

## 2. 公共字段

所有 `.yaml` 内容共享以下字段（Scene / Source 除外，见各自章节）：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 全局稳定 ID，见第 3 节 |
| `type` | 是 | 实体类型，必须与目录一致 |
| `title` | 是 | `{ zh, en }`；`zh` 必填，`en` 可后补 |
| `summary` | 是 | `{ zh, en }`，各 1–2 句，不超过 120 字 |
| `status` | 是 | `draft` / `reviewed` / `verified` |
| `sapVersion` | 是 | 内容适用的版本，如 `S/4HANA 2023`、`ECC 6.0 EHP8` |
| `sources` | 建议 | 来源 ID 数组；`verified` 状态至少 1 条 |
| `updatedAt` | 是 | ISO 日期，内容最后一次实质性修改 |
| `tags` | 否 | 自由标签，用于搜索与筛选 |

状态含义：

- `draft`：结构完整，事实未核对；UI 显示「草稿」；
- `reviewed`：有来源，已做一次人工通读；UI 正常显示；
- `verified`：至少一条官方来源 + 与系统/文档交叉核对；UI 显示绿色勾；
- 没有来源的内容不得标为 `reviewed` 以上。

## 3. ID 规范

| 实体 | 规则 | 示例 |
| --- | --- | --- |
| Module | 小写缩写 | `sd`、`mm`、`ewm`、`abap` |
| Flow | 小写 kebab | `order-to-cash`、`procure-to-pay` |
| Process | `<module>-<kebab>` | `sd-order-management`、`mm-procurement` |
| Step | `<module>-<tcode 或阶段>-<kebab>` | `sd-va01-create-sales-order` |
| Object | `<type>:<technicalName>` | `tcode:VA01`、`table:VBAK`、`bapi:BAPI_SALESORDER_CREATEFROMDAT2` |
| Snippet | `<language>-<kebab>` | `abap-bapi-create-sales-order` |
| Scene | 小写 kebab，文件名 `<id>.scene.yaml` | `universe`、`module-sd`、`process-sd-order-management` |
| Crosslink | 小写 kebab | `sd-billing-to-fi-payment` |
| Source | 小写 kebab | `sap-help-sales-order` |

约束：

- ID 一旦发布不再改名；需要改名时保留 `aliases` 并写迁移说明；
- 对象 ID 的 `technicalName` 保留 SAP 原始大小写（`VBAK`、`BAPI_...`）；
- 文件名与 ID 保持一致，大小写敏感；
- 引用统一写成 `<type>:<id>`（如 `step:sd-va01-create-sales-order`），对象内嵌套引用也使用完整前缀。

## 4. 各实体字段

### 4.1 Module

```yaml
id: sd
type: module
abbr: SD
title:
  zh: 销售与分销
  en: Sales and Distribution
color: "#3B82F6"
icon: sd
summary:
  zh: 从售前、销售订单、定价与可用性检查，到交货、开票与收款的完整销售链路。
  en: The end-to-end sales chain from pre-sales and sales orders to delivery, billing and payment.
scope: [销售订单, 交货, 开票, 定价, 信用管理]
keyFlows: [order-to-cash]
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-sd]
updatedAt: 2026-11-24
```

`color` 是 UI 识别色，不是 SAP 官方色；必须通过对比度检查。`icon` 指向 `public/icons/modules/<icon>.svg`。

### 4.2 Flow

```yaml
id: order-to-cash
type: flow
abbr: O2C
title:
  zh: 订单到收款
  en: Order to Cash
summary:
  zh: 从客户下单到收款核销的跨模块主干流程。
  en: The cross-module value chain from customer order to cash application.
modules: [sd, mm, fi, ewm]
stages:
  - id: order
    title: { zh: 订单, en: Order }
    primaryModule: sd
  - id: fulfillment
    title: { zh: 履约, en: Fulfillment }
    primaryModule: sd
  - id: billing
    title: { zh: 开票, en: Billing }
    primaryModule: sd
  - id: payment
    title: { zh: 收款, en: Payment }
    primaryModule: fi
processes: [sd-order-management]
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-sd, sap-help-fi-ar]
updatedAt: 2026-11-24
```

### 4.3 Process

```yaml
id: sd-order-management
type: process
title:
  zh: 销售订单管理
  en: Sales Order Management
module: sd
flow: order-to-cash
stage: order
summary:
  zh: 从创建销售订单、可用性检查，到交货、开票与收款的 SD 核心流程。
  en: The core SD flow from sales order creation and ATP to delivery, billing and payment.
steps:
  - sd-va01-create-sales-order
  - sd-atp-availability-check
  - sd-vl01n-create-delivery
  - sd-vf01-create-billing
  - fi-f28-post-incoming-payment
edges:
  - from: sd-va01-create-sales-order
    to: sd-atp-availability-check
    kind: sequence
    label: { zh: 可用性检查, en: ATP check }
  - from: sd-atp-availability-check
    to: sd-vl01n-create-delivery
    kind: sequence
    label: { zh: 创建交货, en: Create delivery }
  - from: sd-vl01n-create-delivery
    to: sd-vf01-create-billing
    kind: handoff
    label: { zh: 发货后开票, en: Bill after goods issue }
  - from: sd-vf01-create-billing
    to: fi-f28-post-incoming-payment
    kind: sequence
    label: { zh: 收款, en: Incoming payment }
roles: [销售内勤, 销售经理, 仓库管理员, 开票员, 应收会计]
outcomes: [销售订单, 交货单, 发票, 应收账款清账]
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-sd, sap-help-fi-ar]
updatedAt: 2026-11-24
```

约束：`edges` 的端点必须出现在 `steps` 中；流程默认必须无环，确需回退 / 重做的环用 `kind: loop` 显式标注。

### 4.4 Step

```yaml
id: sd-va01-create-sales-order
type: step
title:
  zh: 创建销售订单
  en: Create Sales Order
primaryModule: sd
modules: [sd]
processes: [sd-order-management]
flows: [order-to-cash]
tcode: VA01
summary:
  zh: 销售订单的入口，确定客户、物料、数量、价格与交货日期。
  en: Entry point for a sales order: customer, material, quantity, pricing and delivery date.
inputs: [客户, 物料, 数量, 价格条件, 交货日期, 销售组织]
outputs: [销售订单号, 订单状态, 定价结果]
rules:
  - 订单必须引用有效的客户与物料主数据。
  - 定价由条件技术决定，可手工覆盖但会留痕。
painPoints:
  - 不完整的客户主数据会导致订单无法保存。
  - 信用检查失败时订单进入冻结状态。
objects:
  - tcode:VA01
  - table:VBAK
  - table:VBAP
  - bapi:BAPI_SALESORDER_CREATEFROMDAT2
  - enhancement:MV45AFZZ
  - cds:I_SalesOrder
  - odata:API_SALES_ORDER_SRV
snippets: [abap-bapi-create-sales-order]
crossModule:
  - module: mm
    relation: master-data
    note: 可用性检查读取 MM 的库存与计划需求。
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-sales-order, sap-help-va01]
updatedAt: 2026-11-24
```

### 4.5 Object

```yaml
id: tcode:VA01
type: tcode
technicalName: VA01
title:
  zh: 创建销售订单
  en: Create Sales Order
module: sd
package: VA
summary:
  zh: 销售订单创建的事务码，写入 VBAK / VBAP 等表。
  en: Transaction for creating sales orders; writes VBAK / VBAP and related tables.
relations:
  - target: table:VBAK
    kind: writes
  - target: table:VBAP
    kind: writes
  - target: enhancement:MV45AFZZ
    kind: triggers
  - target: bapi:BAPI_SALESORDER_CREATEFROMDAT2
    kind: related
    note: BAPI 提供与 VA01 等价的编程入口。
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-va01, sap-help-sales-order]
updatedAt: 2026-11-24
```

对象类型与字段：

| `type` | 额外字段 | 示例 |
| --- | --- | --- |
| `tcode` | `package` | `VA01` |
| `table` | `tableClass`（`transparent` / `pool` / `cluster`） | `VBAK` |
| `bapi` | `functionGroup` | `BAPI_SALESORDER_CREATEFROMDAT2` |
| `cds` | `viewType`（`interface` / `consumption`） | `I_SalesOrder` |
| `odata` | `serviceVersion`（`v2` / `v4`） | `API_SALES_ORDER_SRV` |
| `enhancement` | `subtype`（`user-exit` / `badi` / `enhancement`） | `MV45AFZZ`、`BADI_SD_SALES` |
| `class` | `isAbstract` | `CL_SALES_ORDER`（示例） |
| `function` | `functionGroup` | `SD_SALESDOCUMENT_CREATE` |
| `idoc` | `messageType` | `ORDERS` |
| `fiori` | `appId` | `Fiori 应用 ID` |

关系 `kind` 枚举：`calls`、`reads`、`writes`、`enhances`、`exposes`、`basedOn`、`partOf`、`triggers`、`related`。

### 4.6 Snippet

```yaml
id: abap-bapi-create-sales-order
type: snippet
language: abap
title:
  zh: 使用 BAPI 创建销售订单
  en: Create a sales order with BAPI
objects: [bapi:BAPI_SALESORDER_CREATEFROMDAT2, table:VBAK]
file: abap/bapi-create-sales-order.abap
summary:
  zh: 最小可运行的 BAPI 调用骨架，包含订单头、行项目和提交后的错误处理。
  en: Minimal BAPI call skeleton with header, item and post-commit error handling.
annotations:
  - lines: 6-12
    note: 订单头：客户、销售组织、分销渠道与产品组。
  - lines: 23-30
    note: 行项目：物料、数量与工厂。
  - lines: 38-44
    note: BAPI 返回后必须检查 RETURN 并显式 COMMIT。
status: draft
sapVersion: S/4HANA 2023
sources: [sap-help-bapi-sales-order]
updatedAt: 2026-11-24
```

代码文件放在 `content/snippets/abap/` 下；`file` 是相对 `content/snippets/` 的路径。为控制体积，单段不超过 120 行，超出则拆成多个片段。

### 4.7 Scene

```yaml
id: process-sd-order-management
type: scene
level: process
title: { zh: 销售订单管理, en: Sales Order Management }
module: sd
process: sd-order-management
viewport: { x: 0, y: 0, zoom: 0.9 }
groups:
  - id: g-order
    title: { zh: 订单, en: Order }
    position: [0, 0]
    size: [540, 420]
nodes:
  - id: n-va01
    kind: step
    ref: step:sd-va01-create-sales-order
    position: [60, 120]
    size: [240, 128]
    emphasis: primary
  - id: n-portal-ewm
    kind: portal
    module: ewm
    position: [640, 120]
    size: [200, 88]
    label: { zh: 在 EWM 中查看, en: View in EWM }
    target: { scene: ewm-module, step: sd-vl01n-create-delivery }
edges:
  - id: e-va01-atp
    kind: sequence
    from: n-va01
    to: n-atp
    label: { zh: 可用性检查, en: ATP check }
```

`level` 取值：`universe`、`module`、`process`、`flow`。节点 `kind` 取值：`module`、`flow`、`process`、`step`、`object`、`portal`、`note`、`group`。边 `kind` 取值：`sequence`、`handoff`、`data`、`dependency`、`portal`、`loop`、`flow`。

### 4.8 Source

```yaml
sources:
  - id: sap-help-sales-order
    title: Sales Order Processing
    url: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/...
    publisher: SAP
    kind: official-doc
    language: en
    version: S/4HANA 2023
    accessedAt: 2026-11-20
    note: 只引用结构与术语，不复制原文。
```

`kind`：`official-doc`、`official-api`、`official-library`、`community`、`book`、`third-party`、`system-export`。

### 4.9 Crosslink

```yaml
id: sd-billing-to-fi-payment
type: crosslink
from: step:sd-vf01-create-billing
to: step:fi-f28-post-incoming-payment
relation: accounting-impact
label: { zh: 开票形成应收，收款清销应收, en: Billing creates a receivable, payment clears it }
note: SD 开票在 FI 生成客户应收；收款录入后完成清账。
sources: [sap-help-s4hana]
status: reviewed
updatedAt: 2026-11-24
```

## 5. 关系基数

| 关系 | 基数 | 说明 |
| --- | --- | --- |
| Module → Flow | N:N | 模块参与多条端到端流程 |
| Flow → Process | 1:N | 一条流程包含多个模块流程 |
| Process → Step | N:N | 步骤可被多个流程复用 |
| Step → Object | N:N | 步骤使用多个对象，对象被多个步骤使用 |
| Object → Snippet | N:N | 一个对象可有多段示例 |
| Scene → 任意实体 | N:N（引用） | 场景只是视图 |
| Step → Module | N:N | `primaryModule` + `modules` |

## 6. 派生索引（构建时生成，勿手写）

| 文件 | 内容 | 消费方 |
| --- | --- | --- |
| `src/generated/graph.json` | 所有实体与边的规范化图 | 画布、检查器 |
| `src/generated/scenes/<id>.json` | 解析后的场景：节点带摘要、边带样式 | 画布 |
| `src/generated/occurrences.json` | `stepId → [sceneId, nodeId, moduleId]` | 跨模块提示、门户 |
| `src/generated/backlinks.json` | 每个实体被谁引用 | 对象详情、影响面 |
| `src/generated/search.json` | 搜索索引（Phase 3；当前命令面板直接过滤内容数组） | 搜索 / 命令面板 |
| `src/generated/stats.json` | 模块 / 流程 / 对象计数 | 首页、模块卡片 |

派生文件加入 `.gitignore`；CI 与本地 `predev` / `prebuild` 自动生成。若需要静态审阅，可生成一份 `content-snapshot.json` 作为构建产物，而不是源文件。

## 7. 校验规则

`scripts/validate-content.ts` 必须覆盖：

1. **唯一性**：所有实体 ID 全局唯一（对象按命名空间唯一）；
2. **引用完整性**：`sources`、`objects`、`snippets`、`processes`、`flows`、`steps` 均可解析；
3. **反向一致性**：`process.steps` 与 `step.processes` 双向一致；`flow.processes` 与 `process.flow` 一致；
4. **场景完整性**：节点 `ref` 可解析；边端点存在；坐标与尺寸为有限数字；
5. **流程合理性**：默认无环；`loop` 边必须有说明；每个步骤至少有 1 个前驱或后继（首尾除外）；
6. **对象规范**：`id` 前缀与 `type` 一致；`technicalName` 与文件名一致；
7. **代码规范**：`snippet.file` 存在；`annotations.lines` 不越界；
8. **来源规范**：`source.url` 是 https；`accessedAt` 是 ISO 日期；`verified` 至少 1 条 `official-*` 来源；
9. **文案规范**：`title.zh` / `summary.zh` 非空；长度限制；不含 HTML；
10. **链接规范**：Markdown 内部链接指向存在的文件。

错误分级：`error` 阻止构建，`warn` 输出报告；CI 对 `error` 失败，对 `warn` 只提示。

## 8. 内容与视图的边界

| 放在内容里 | 放在场景里 |
| --- | --- |
| 步骤的先后、分支、交接 | 步骤在画布上的坐标 |
| 步骤使用的对象 | 节点尺寸、是否折叠、强调级别 |
| 对象的真实关系 | 边的视觉路径（贝塞尔 / 折线） |
| 模块、流程、术语 | 分组框、注释、图例位置 |
| 来源与版本 | 相机初始视口 |

判断标准：**如果把同一份内容渲染成另一种布局（比如纵向列表），这条信息还需要吗？** 需要，就属于内容；不需要，就属于场景。

## 9. 版本与演进

- 内容按 Git 提交演进，不单独维护版本号；
- 字段变更走 ADR + 迁移脚本；
- `sapVersion` 是内容断言，不是仓库版本；同一对象可以同时存在多个版本条目（未来用 `variants` 扩展）；
- 删除实体前先 `grep` 引用并保留 redirect 映射（`content/_redirects.yaml`，Phase 3 引入）。
