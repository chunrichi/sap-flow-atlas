# content/ · 知识内容

这是产品的事实层。**改这里等于改知识库；改 `scenes/` 只等于改布局。**

## 目录

| 目录 | 放什么 | 命名 |
| --- | --- | --- |
| `modules/` | 12 个 SAP 模块的元数据 | `modules/<id>/module.yaml` |
| `flows/` | 端到端流程（O2C、P2P、R2R、P2Pro） | `flows/<id>/flow.yaml` |
| `processes/` | 模块内业务流程 | `processes/<module>/<process-id>/process.yaml` |
| `steps/` | 流程步骤，全局唯一 | `steps/<primary-module>/<step-id>/step.yaml` |
| `objects/` | 开发对象 | `objects/<type>/<technicalName>.yaml` |
| `snippets/` | 示例代码 + 元数据 | `snippets/<language>/<id>.{yaml,abap,cds,...}` |
| `scenes/` | 画布布局，只存引用与坐标 | `scenes/<id>.scene.yaml` |
| `crosslinks/` | 跨模块语义关系 | `crosslinks/<id>.yaml` |
| `glossary/` | 术语表 | `glossary/terms.yaml` |
| `sources/` | 来源库 | `sources/sources.yaml` |
| `assets/` | 内容图片 | `assets/<entity-id>/...` |

## 四条硬规则

1. **事实只写一次。** 同一 `step` 被 SD、EWM、O2C 引用时，只保留一份 `step.yaml`；场景用 `ref` 指向它。
2. **对象 ID 就是 `<type>:<technicalName>`。** 例如 `table:VBAK`、`bapi:BAPI_SALESORDER_CREATEFROMDAT2`。引用对象时直接写这个 ID。
3. **没有来源不升级。** `status` 从 `draft` → `reviewed` → `verified`，每次升级都要补 `sources`。
4. **条件必须显式。** 条件流程写 `variant: optional | exception` + `trigger`；条件步骤写 `optional: true` + `condition`。不要用摘要暗示“可选”，否则画布无法用虚线区分。

## 最小示例

```yaml
# content/steps/sd/sd-va01-create-sales-order/step.yaml
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
  zh: 销售订单的入口。
  en: Entry point for a sales order.
objects:
  - "tcode:VA01"
  - "table:VBAK"
status: draft
sapVersion: S/4HANA 2023
sources:
  - sap-help-s4hana
updatedAt: 2026-11-24
```

## 怎么加内容

完整流程见 [`docs/06-content-guide.md`](../docs/06-content-guide.md)。最短路径：

1. 复制一个同类实体目录；
2. 改 `id`、标题、摘要；
3. 补 `sources`；
4. 如果要出现在画布上，在 `scenes/` 里加节点 `ref`；
5. 跑 `pnpm content:validate`；
6. 提 PR，描述里写清依据与未核对项。

## 当前示例

- 模块：12 个；价值流：10 条（45 个阶段全部有流程）；模块流程：85 个（21 可选 + 7 例外）；步骤：238 个（32 条件步骤）；对象：365 个（T-Code 198、表 123、BAPI 10、CDS 9、增强 6、OData 6、函数 3、IDoc 3、类 2、Fiori 2、报表 2、作业 1）；代码：19 段；场景：5 个（含 ABAP 开发地图与 D2D）。
- 条件流程在界面中以虚线 + 「可选/例外」徽标 + 触发条件呈现；完整清单见 [`docs/12-content-map.md`](../docs/12-content-map.md)，数字用 `pnpm content:report` 重新生成。
- 示例用于验证结构，`status` 多为 `draft` / `reviewed`，尚未逐条由 SAP 顾问复核。

## 不要放这里

- UI 文案 → `src/i18n/`
- 设计 token / 颜色主题 → `src/styles/tokens.css`
- 测试夹具 → `tests/fixtures/`
- 客户真实数据 / 导出文件 → 本地 `raw/`（已 gitignore）
