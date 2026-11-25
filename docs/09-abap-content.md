# 09 · ABAP 内容：如何持续添加

> ABAP 不是一个独立的业务流程模块，而是横切在所有模块上的开发层。这个项目的目标不是罗列语法，而是把**开发对象放回业务流程**：谁用到它、在什么步骤、为什么需要增强。

## 1. 当前 ABAP 画布

访问 `#/m/abap`，会看到一个以开发对象为节点的地图：

```text
开发工具            数据对象
SE80 / SE11 / SE37  VBAK / VBAP
SE24 / SE93 / SE38

增强与接口
MV45AFZZ / BAPI_SALESORDER_CREATEFROMDAT2
I_SalesOrder / API_SALES_ORDER_SRV
```

它是 `content/scenes/module-abap.scene.yaml` 定义的普通场景，节点 `kind: object`，点击后打开对象检查器。场景底部还有通往 **D2D（开发到上线）** 价值流的 portal，包含 ABAP 增强、接口、性能三条流程、14 个步骤。新增 ABAP 对象不需要改前端代码，只需要：

1. 在 `content/objects/<type>/` 新增对象 YAML；
2. 在 `content/scenes/module-abap.scene.yaml` 加节点与边；
3. 运行 `pnpm content:build`；
4. 刷新 `#/m/abap`。

## 2. ABAP 对象类型

| 类型 | `type` | 例子 | 说明 |
| --- | --- | --- | --- |
| 事务码 / 工具 | `tcode` | SE80、SE11、SE37、SE24、SE93、SE38 | 开发、调试、查看对象的入口 |
| 增强 | `enhancement` | MV45AFZZ（user-exit）、ME_PROCESS_PO_CUST（BAdI） | 在标准流程中插入自定义逻辑 |
| BAPI / 函数 | `bapi` / `function` | BAPI_SALESORDER_CREATEFROMDAT2 | 编程接口，通常被集成或批处理调用 |
| CDS | `cds` | I_SalesOrder、I_JournalEntry | 语义化数据模型，供分析、API、Fiori 复用 |
| OData | `odata` | API_SALES_ORDER_SRV | 对外暴露的 REST/OData 服务 |
| 表 | `table` | VBAK、VBAP、MSEG | 数据落点，也是 where-used 的线索 |
| 类 / 报表 / 作业 / IDoc | `class` / `report` / `job` / `idoc` | 按项目补充 | 后续扩展 |

### 2.1 关系类型

只写可验证的关系：

- `writes` / `reads`：对象与表的数据关系；
- `calls`：程序/事务调用函数或类；
- `enhances`：增强作用于哪个事务/流程；
- `exposes` / `basedOn`：OData 基于哪个 CDS；
- `related`：弱关系，必须用 `note` 说明；
- `triggers` / `partOf`：触发或组成部分。

不要用 `related` 代替 `writes` / `calls`，否则对象图会失去信息量。

## 3. 新增一个 ABAP 工具对象

以 SE80 为例：

```yaml
id: "tcode:SE80"
type: tcode
technicalName: SE80
title:
  zh: 对象导航器
  en: Object Navigator
module: abap
summary:
  zh: 浏览包、程序、函数组、类与增强。
  en: Browses packages, programs, function groups, classes and enhancements.
relations:
  - target: "enhancement:MV45AFZZ"
    kind: related
    note: 可以在对象导航器中打开销售订单用户出口 include。
status: reviewed
sapVersion: S/4HANA 2023
sources:
  - sap-help-s4hana
  - abap-cheat-sheets
updatedAt: 2026-11-25
```

注意：

- `id` 必须是 `tcode:SE80`，和 `technicalName` 一致；
- 工具类对象的关系可以少，但 `summary` 要说明「在什么场景用它」；
- 不要给工具对象硬塞 `writes` 关系。

## 4. 新增一个增强

增强最重要的是**上下文**：它挂在哪个事务、哪个 BAdI、哪个保存点。

```yaml
id: "enhancement:MV45AFZZ"
type: enhancement
technicalName: MV45AFZZ
subtype: user-exit
module: sd
summary:
  zh: 销售订单保存时的用户出口 include，常用 FORM USEREXIT_SAVE_DOCUMENT。
  en: User exit include during sales order save.
relations:
  - target: "tcode:VA01"
    kind: enhances
status: reviewed
sapVersion: S/4HANA 2023
sources: [sap-help-s4hana]
updatedAt: 2026-11-25
```

可用的 `subtype`：`user-exit`、`badi`、`enhancement`。

## 5. 新增一段 ABAP 代码

代码与元数据同目录：

```text
content/snippets/abap/
├─ my-snippet.yaml
└─ my-snippet.abap
```

```yaml
id: abap-my-snippet
type: snippet
language: abap
title:
  zh: 读取当日销售订单
  en: Read today's sales orders
objects:
  - "tcode:SE38"
  - "table:VBAK"
file: abap/my-snippet.abap
summary:
  zh: 一句话说明这段代码解决什么问题。
  en: One sentence about the problem this code solves.
annotations:
  - lines: 4-7
    note: 只读取需要的字段。
status: draft
sapVersion: S/4HANA 2023
sources: [abap-cheat-sheets]
updatedAt: 2026-11-25
```

规则：

- 行号从 1 开始，`lines` 支持 `4` 或 `4-7`；
- 注解必须解释「为什么」，不是复述语法；
- 单段 ≤ 120 行；
- BAPI 调用后检查 `RETURN` 并显式提交；
- 不出现客户数据、内部 URL、真实系统名；
- 代码是原创演示代码，不要整段复制 SAP 标准代码。

## 6. 在画布上新增对象节点

```yaml
nodes:
  - id: n-se80
    kind: object
    ref: "tcode:SE80"
    position: [40, 40]
    size: [240, 140]
edges:
  - id: e-se80-mv45
    kind: dependency
    from: n-se80
    to: n-mv45afzz
    label:
      zh: 打开 include
      en: open include
```

对象节点会显示对象类型、技术名、关系数和使用次数；点击打开检查器。

## 7. ABAP 内容审核清单

- [ ] 技术名、包、表字段来自系统或官方文档；
- [ ] 增强的 `subtype` 与挂载点正确；
- [ ] BAPI/函数存在且版本匹配；
- [ ] 代码可读、可运行或有明确上下文；
- [ ] 行注解范围没有越界（构建会报错）；
- [ ] `objects` 与代码实际使用的对象一致；
- [ ] 没有客户敏感信息；
- [ ] `status` 与来源匹配。

## 8. 当前 ABAP 覆盖

- **工具**：SE80、SE11、SE37、SE24、SE93、SE38；
- **增强**：SMOD / CMOD / MV45AFZZ；
- **接口**：WE30 / WE20 / SEGW / WE02 / SM58，IDoc、OData、RFC 监控；
- **性能**：ST05 / SAT / ST12 + SE38 代码优化；
- **传输**：SE01 / STMS / E070 / E071；
- **代码**：14 段可读示例，覆盖 Open SQL、BAPI、用户出口、IDoc、成本与项目查询。

## 9. 后续可以加的 ABAP 视图

- **对象依赖图**：以 BAPI/表/增强为中心的反向依赖；
- **增强点地图**：按事务码列出 user-exit / BAdI / enhancement spot；
- **代码对比**：同一增强在不同项目/版本中的实现差异；
- **RAP / CDS 开发流程**：从数据模型、行为定义到服务暴露；
- **性能基线**：把 trace 结果与代码版本关联。

这些都可以复用 `scenes/` 与检查器，不需要改内容模型。
