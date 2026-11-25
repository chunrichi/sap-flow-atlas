# 08 · 内容获取：手工、半自动与 AI 辅助

> 开发对象可以从系统里「导出」，业务流程不能。**对象靠工具，流程靠人。** 这一节定义两者的边界与流水线。

## 1. 三层来源

| 层 | 内容 | 获取方式 | 可信度 |
| --- | --- | --- | --- |
| 系统事实 | T-Code、表、字段、函数、类、CDS、OData、增强 | SE16 / SE80 / SE11 / SE37 / SE24 / SE93 / ADT / abapGit | 最高（但只说明「有什么」，不说明「为什么」） |
| 官方文档 | 流程定义、配置、对象用途 | SAP Help、API Hub、Fiori Library | 高（需标注版本） |
| 实践经验 | 为什么这样做、常见坑、组织约束 | 顾问、业务、社区、项目复盘 | 中（必须标注来源与审核人） |

流程语义（步骤顺序、业务规则、交接）**不能**从代码自动推导；代码只能验证「这个对象确实被这个程序使用」。

## 2. 从 SAP 系统导出的对象清单

### 2.1 最小可用清单

| 目标 | 表 / 事务 | 关键字段 |
| --- | --- | --- |
| 仓库对象总表 | `TADIR` | `PGMID`、`OBJECT`、`OBJ_NAME`、`DEVCLASS`、`SRCSYSTEM`、`AUTHOR` |
| 事务码 | `TSTC` / `TSTCP` | `TCODE`、`PGMNA`、`DYPNO`、参数 |
| 表与字段 | `DD02L` / `DD03L` | `TABNAME`、`AS4LOCAL`、`FIELDNAME`、`ROLLNAME`、`DOMNAME` |
| 函数模块 | `TFDIR` / `ENLFDIR` | `FUNCNAME`、`PNAME`、`SPRAS` |
| 类与接口 | `SEOCLASS` / `SEOCOMPO`（按版本确认） | `CLSNAME`、`CMPNAME`、`COMPTYPE` |
| CDS 视图 | `DDLS`（S/4HANA） | `DDLNAME`、`AS4USER`、`AS4DATE` |
| 增强 | `SMOD` / `CMOD`、`ENHOBJ`、BAdI 定义表（按版本确认） | 增强名、对象、实现 |
| Where-used | `WBCROSSGT`、`D010INC` 等（按版本确认） | 对象 → 使用它的程序 / 类 |
| 包 | `TDEVC` | `DEVCLASS`、父包、描述 |

> 表名与字段在不同版本可能变化，导出前先在目标系统用 SE11 确认。不要在生产系统跑大范围查询。

### 2.2 导出脚本（只读，开发/测试系统）

```abap
" 仅示例：导出指定包下的对象清单
SELECT obj_name, object, devclass, author, srcsystem
  FROM tadir
  INTO TABLE @DATA(lt_objects)
  WHERE pgmid  = 'R3TR'
    AND devclass = @p_package
    AND object IN ( 'PROG', 'FUGR', 'CLAS', 'TABL', 'DDLS', 'SRVD', 'INTF' ).

" 导出事务码
SELECT tcode, pgmna, dypno
  FROM tstc
  INTO TABLE @DATA(lt_tcodes)
  WHERE tcode LIKE 'VA%'.
```

输出建议用 `cl_salv_export` 或 `GUI_DOWNLOAD` 为 CSV / JSON；不要直接连生产库，不要导出客户数据。

### 2.3 导出后的归一化

```text
raw/system-export/
  tadir.csv
  tstc.csv
  dd02l.csv
  dd03l.csv
  where-used.csv
        │
        ▼
scripts/import/（Phase 3）
        │  过滤包、去重、映射类型、生成草稿
        ▼
content/objects/**/*.yaml  (status: draft)
```

归一化规则：

- 只导入本知识库关心的对象类型；
- 过滤掉系统命名空间（`/0CUM/`、`/SAP/` 等），除非明确要讲；
- 对象名保原始大小写；
- 生成的 YAML 带 `generatedFrom: system-export` 与导出时间；
- 所有字段先标 `draft`，人工补 `summary` 与 `sources` 后才能升级。

## 3. 流程内容的获取

流程不能靠猜。推荐顺序：

1. **官方流程模型**：SAP Signavio / Best Practices / Fiori Library，确认标准流程的步骤与角色；
2. **项目文档**：蓝图、配置文档、培训材料、测试脚本；
3. **系统证据**：用 T-Code 菜单、日志、IDoc、工作流实例反推实际路径；
4. **访谈**：业务 owner 讲「异常怎么处理」，这往往是最有价值的部分；
5. **交叉验证**：同一流程至少两个来源，冲突时记录差异而不是强行合并。

访谈提纲（每个流程 30 分钟）：

- 触发条件是什么？谁发起？
- 正常路径有哪几步？每步的输入、输出、系统动作？
- 最常见的 3 个异常是什么？怎么处理？
- 哪些步骤跨模块 / 跨系统？交接物是什么？
- 哪些步骤最耗时 / 最容易出错？
- 有哪些报表、接口、增强是专门为这个流程做的？

## 4. AI 辅助流水线

```text
来源（官方文档 / 导出清单 / 访谈记录）
        │
        ▼
① 抽取：脚本切分、去噪、保留链接
        │
        ▼
② 起草：LLM 生成 YAML 草稿（只允许引用给定来源）
        │
        ▼
③ 机器校验：Zod + 引用完整性 + 技术名白名单
        │   失败 → 回到 ②
        ▼
④ 人工复核：顾问对照来源，改 status = reviewed
        │
        ▼
⑤ 交叉验证：另一人或另一模型独立核对
        │   不一致 → 记录争议，不强行通过
        ▼
content/... (verified)
```

硬规则：

- 技术名（T-Code、表、BAPI、类、CDS）必须来自**导出清单或官方文档**，LLM 不得自由生成；
- 每个断言至少一条 `sources`；没有来源的句子删除或标 `unsourced`；
- 模型输出必须通过 schema，禁止「差不多能解析」；
- 复核人与起草人分离（至少在不同 session / 不同模型）；
- 争议内容保留在 `notes.mdx`，不要伪装成结论。

## 5. 隐私与合规

- 不提交客户名称、真实订单号、员工姓名、内部 URL、系统地址；
- 导出文件放 `raw/` 并加入 `.gitignore`；
- 截图打码；
- 公开仓库发布前做一次 `grep` 敏感词与人工抽查；
- 遵循公司对 SAP 文档与对象名的使用规定；不确定时只写公开标准内容。

## 6. 质量指标

| 指标 | 目标 |
| --- | --- |
| 有来源的内容占比 | ≥ 90% |
| `verified` 内容占比 | ≥ 40%（Phase 4） |
| 悬空引用 | 0 |
| 每个步骤平均对象数 | 3–8 |
| 每个对象平均被引用步骤数 | ≥ 1 |
| 每模块至少 1 条端到端可走通的流程 | 12/12 |

## 7. 从零开始的最小行动

如果明天就要开始，只做三件事：

1. 选 SD 的「创建销售订单 → 交货 → 开票」三个步骤，手工写 3 个 step + 10 个 object；
2. 用 `TADIR` / `TSTC` / `DD02L` 导出对应对象，核对技术名；
3. 给每个对象找一条官方链接，标 `reviewed`。

先让一条链可信，再复制方法。
