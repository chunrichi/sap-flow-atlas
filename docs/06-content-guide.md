# 06 · 内容规范

> 目标：任何人（或 AI）按同一个流程，都能产出**结构一致、来源可查、可被画布消费**的内容。

## 1. 一条内容的生命周期

```text
选题 → 查来源 → 写 draft → 校验 → 人工复核 → reviewed → 交叉验证 → verified
                                      │
                                      └─ 发现错误 → 回到 draft，保留 Git 历史
```

| 状态 | 要求 | UI 表现 |
| --- | --- | --- |
| `draft` | 结构齐全，事实未核对；`sources` 可空 | 灰色「草稿」标记 |
| `reviewed` | 至少 1 条来源；已通读；术语一致 | 正常显示 |
| `verified` | 至少 1 条 `official-*` 来源 + 与系统/另一来源交叉核对 | 绿色勾 + 核对日期 |

## 2. 新增一个模块

1. 复制 `content/modules/sd/module.yaml` 为 `content/modules/<id>/module.yaml`；
2. 填写 `id`、`abbr`、双语标题、`color`、`icon`、`summary`、`scope`；
3. `keyFlows` 引用已存在的 flow；
4. 在 `content/scenes/universe.scene.yaml` 添加节点与边（坐标见第 7 节）；
5. 在 `public/icons/modules/` 放一个 24×24 的 SVG；
6. 运行 `pnpm content:validate`。

检查：

- [ ] `id` 与目录名一致；
- [ ] `color` 在深色/浅色背景上都可读（≥ 4.5:1）；
- [ ] `summary` 不超过 120 字，不写营销话术；
- [ ] 图标不是 SAP 官方受版权保护的图标（或来自官方开源图标库）。

## 3. 新增一条端到端流程（Flow）

1. 复制 `content/flows/order-to-cash/flow.yaml`；
2. 定义 `stages`（3–6 个），每个 stage 指定 `primaryModule`；
3. `modules` 列出所有参与模块；
4. `processes` 关联模块流程；
5. 在 L0 场景中添加流程丝带（可选）。

规则：

- Flow 是**价值链**，不是模块内流程；不要把所有 SD 流程都塞进 O2C；
- Stage 是叙事阶段（订单 / 履约 / 开票 / 收款），不是组织部门；
- 一条 Flow 至少跨越 2 个模块，否则它可能只是一个 Process。

## 4. 新增一个业务流程（Process）

1. 创建 `content/processes/<module>/<process-id>/process.yaml`；
2. 写 `steps`（引用 step ID）与 `edges`（顺序、分支、交接）；
3. 在模块场景 `content/scenes/<module>-module.scene.yaml` 添加 process 节点；
4. 确保 `step.processes` 里也包含该 process（双向一致由校验脚本检查）。

规则：

- 一个 Process 聚焦一个业务目标（订单管理、采购、开票），不要混入完全无关的步骤；
- 步骤顺序必须来自业务，不是来自 T-Code 菜单顺序；
- 分支用多条边表达，不要用文字描述分支；
- 跨模块交接用 `kind: handoff`，并在 step 的 `crossModule` 中写清关系。

## 5. 新增一个步骤（Step）

1. 创建 `content/steps/<primary-module>/<step-id>/step.yaml`；
2. 填写双语标题、摘要、输入/输出、规则、常见坑；
3. `objects` 引用已存在的对象；没有就先用 `draft` 占位（校验会警告）；
4. `snippets` 引用已存在的代码片段；
5. `processes` / `flows` 至少各有一个；
6. 如需长文，添加同目录 `notes.mdx`。

规则：

- 一个 Step 是一个**可执行的动作**（创建订单、过账、开票），不是一个界面或一个报表；
- 标题用动宾结构（创建销售订单，而不是「销售订单」）；
- 不要在一个 Step 里塞多个 T-Code；如果一个动作有多个入口，在 `objects` 里列出，并在正文说明差异；
- 没有 T-Code 的步骤（如 ATP 检查）`tcode` 可省略，但必须有对象或说明。

## 6. 新增一个开发对象（Object）

1. 确定类型，放对目录：`content/objects/<type>/<technicalName>.yaml`；
2. `id` 必须是 `<type>:<technicalName>`；
3. 写 `summary`（它是什么、在流程中做什么），不要复制 SAP 文档原文；
4. `relations` 只写**可验证**的关系，并注明方向；
5. 至少 1 条来源；`verified` 需要官方来源。

常见错误：

- 把 T-Code 当成对象关系（T-Code 调用的程序、写入的表才是关系）；
- 把「相关」写成 `calls`；关系类型必须准确；
- 表字段没有出处；
- 对象名大小写不一致（`VBAK` ≠ `vbak`）。

## 7. 新增 / 修改场景（Scene）

1. 复制一个现有 `.scene.yaml`；
2. `level` 选择 `universe` / `module` / `process` / `flow`；
3. 每个节点必须有 `id`、`kind`、`position`、`size`；业务节点用 `ref` 指向实体；
4. 边必须有 `id`、`kind`、`from`、`to`；
5. `viewport` 是进入场景时的初始视口。

坐标约定：

- 画布坐标单位为 px，原点左上；
- 节点间距 ≥ 80px，避免 Hover 卡互相遮挡；
- 流程从左到右，主路径 y 值相近；分支上下错开 ≥ 160px；
- 分组框比子节点外扩 32px；
- 门户节点放在主路径末端或模块边界，不放在流程中间。

原则：**场景只描述「怎么摆」，不描述「是什么」。** 如果改了场景导致内容事实变化，说明数据放错层了。

## 8. 新增代码片段（Snippet）

1. 在 `content/snippets/<language>/` 放 `<id>.yaml` 与 `<id>.<ext>`；
2. `file` 写相对 `content/snippets/` 的路径；
3. `annotations` 用行号区间解释关键逻辑；行号从 1 开始，闭区间；
4. 代码必须可运行或有明确上下文（伪代码要标注）；
5. 不超过 120 行；超出则拆分为多个片段并交叉引用。

ABAP 片段要求：

- 使用 `TRY / CATCH` 或 `RETURN` 检查；
- BAPI 调用后必须检查 `RETURN`，并显式 `COMMIT WORK AND WAIT`；
- 不包含客户系统名、真实客户数据、内部 URL；
- 变量命名符合 ABAP 惯例（`lv_`、`ls_`、`lt_`、`lo_`）。

## 9. 来源与引用

每条来源写进 `content/sources/sources.yaml`，内容只引用 ID：

```yaml
sources:
  - id: sap-help-sales-order
    title: Sales Order Processing
    url: https://help.sap.com/...
    publisher: SAP
    kind: official-doc
    language: en
    version: S/4HANA 2023
    accessedAt: 2026-11-20
```

规则：

- `url` 必须是 https；
- `accessedAt` 是实际打开日期；
- 官方文档、API Hub、Fiori Library 用 `official-*`；社区文章用 `community`；
- 不把第三方 T-Code 站作为唯一来源；
- 引用 SAP 文档时只做摘要与改写，不复制大段原文。

## 10. 术语与语气

- 首次出现的技术名词给中英文：`可用性检查（ATP, Available-to-Promise）`；
- 保留 SAP 官方术语，不自行翻译 T-Code、表名、BAPI；
- 用「步骤 / 流程 / 模块 / 开发对象」四个固定词，不用「节点 / 卡片」描述业务；
- 句子短，一段一个意思；
- 不写「非常简单」「众所周知」这类主观判断。

## 11. AI 辅助写作的边界

可以用 AI：

- 生成初稿、翻译、摘要、补全 YAML 结构；
- 从官方文档中提取字段并给出链接；
- 检查术语一致性。

不可以：

- 让 AI 编造 T-Code、表名、BAPI 或版本；
- 未经人工复核直接把 AI 内容标为 `reviewed` / `verified`；
- 把 AI 生成的解释当作官方事实。

建议流程：AI 生成 `draft` → 脚本校验 → 人工对照来源 → 改 `reviewed` → 交叉验证后 `verified`。

## 12. 提交前检查清单

- [ ] `pnpm content:validate` 通过（无 error）；
- [ ] 新增实体 ID 唯一，目录名与 ID 一致；
- [ ] 所有引用可解析；
- [ ] 双语标题/摘要已填（至少 `zh`）；
- [ ] 至少 1 条来源；
- [ ] `updatedAt` 已更新；
- [ ] 场景坐标没有重叠、没有被检查器遮挡的关键节点；
- [ ] 新增对象没有客户敏感信息；
- [ ] PR 描述写清「新增了什么、依据是什么、哪些还没核对」。
