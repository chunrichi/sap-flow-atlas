# docs/ · 设计文档

建议阅读顺序：

1. [`01-research.md`](01-research.md) — 同类项目与知识来源，为什么这样设计；
2. [`02-information-architecture.md`](02-information-architecture.md) — 四层视图、导航、Hover 卡、检查器；
3. [`03-data-model.md`](03-data-model.md) — 实体、字段、ID 与校验；
4. [`04-directory-structure.md`](04-directory-structure.md) — 完整目录树与构建管线；
5. [`05-tech-stack.md`](05-tech-stack.md) — 技术选型与取舍；
6. [`06-content-guide.md`](06-content-guide.md) — 如何新增内容；
7. [`07-roadmap.md`](07-roadmap.md) — 分阶段交付；
8. [`08-ingestion.md`](08-ingestion.md) — 从 SAP 系统与文档获取内容；
9. [`09-abap-content.md`](09-abap-content.md) — ABAP 工具、增强、BAPI/CDS/OData 与代码的持续添加方式；
10. [`10-interaction-review.md`](10-interaction-review.md) — 当前交互审查、同类产品对标与优先级建议；
11. [`11-flexible-workbench-and-benchmarks.md`](11-flexible-workbench-and-benchmarks.md) — 非 SAP 开源对标、多镜头工作台、流程带与详情坞方案；
12. [`12-content-map.md`](12-content-map.md) — 12 模块 × 10 价值流 × 59 流程 × 184 步骤 × 280 对象的覆盖图，以及可选/例外流程清单；
13. [`adr/0001-canonical-graph-and-view-layouts.md`](adr/0001-canonical-graph-and-view-layouts.md) — 核心架构决策。

文档中的「目标结构」与「当前已落地」会明确区分：`content/`、`src/`、`scripts/`、`tests/`、`.github/workflows/` 均已创建；具体差异见 04 的第 8 节。
