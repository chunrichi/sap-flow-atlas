# 12 · 流程与对象覆盖图

> 这份文档回答三个问题：现在有哪些流程和对象？哪些是条件触发的？下一轮补什么？
> 数字由 `pnpm content:report` 从 `content/` 重新生成；逐流程的步骤、输入输出与对象明细见 [13 号文档](13-process-catalog.md)。

## 1. 当前总量

| 层级 | 数量 | 说明 |
| --- | ---: | --- |
| 模块 Module | 12 | SD、MM、FI、CO、PP、QM、PM、EWM、PS、CS、HR、ABAP/Basis |
| 价值流 Flow | 10 | O2C、P2P、R2R、P2Pro、A2R、H2R、S2C、P2Pft、M2A、D2D |
| 模块流程 Process | 85 | 其中 21 个可选流程、7 个例外流程 |
| 流程步骤 Step | 238 | 其中 32 个条件步骤 |
| 开发对象 Object | 365 | T-Code 198、表 123、BAPI 10、CDS 9、增强 6、OData 6、函数 3、IDoc 3、类 2、Fiori 2、报表 2、作业 1 |
| 代码片段 Snippet | 19 | 覆盖 12 个模块；新增 ABAP/IDoc/OData/权限/后台作业/工作流示例 |
| 画布场景 Scene | 5 | 其余场景由 `src/lib/scenes.ts` 自动布局 |

当前内容以 `draft` 为主，字段 `status` / `sources` 用于逐条复核；流程事实尚未全部由 SAP 顾问确认。

## 2. 模块覆盖

| 模块 | 流程 | 其中条件流程 | 主步骤 | 对象 | 角色 |
| --- | ---: | ---: | ---: | ---: | ---: |
| SD 销售与分销 | 9 | 4 | 26 | 50 | 11 |
| MM 物料管理 | 9 | 3 | 23 | 42 | 9 |
| FI 财务会计 | 12 | 2 | 29 | 50 | 10 |
| CO 管理会计 | 7 | 1 | 20 | 29 | 10 |
| PP 生产计划 | 6 | 2 | 21 | 28 | 9 |
| QM 质量管理 | 4 | 2 | 9 | 17 | 6 |
| PM 工厂维护 | 5 | 3 | 13 | 22 | 8 |
| EWM 扩展仓库管理 | 5 | 2 | 14 | 14 | 10 |
| PS 项目系统 | 6 | 0 | 15 | 15 | 8 |
| CS 客户服务 | 5 | 3 | 12 | 13 | 7 |
| HR 人力资源 | 6 | 1 | 18 | 26 | 7 |
| ABAP 开发与 Basis | 11 | 5 | 38 | 59 | 17 |

解读：

- **FI 流程最多**（12 个），因为它同时参与 O2C、P2P、R2R、A2R 与 S2C 五条价值流；
- **QM / EWM / CS 已从“每模块 2–3 个流程”补到 4–5 个**：QM 增加检验结果与拒收处置，EWM 增加补货与盘点，CS 增加保修与安装；
- **PS 没有条件流程**：立项、预算、执行、结算是项目制的固定阶段，条件性体现在“是否走项目制”而不是流程内部；
- 每个模块至少 4 个流程，每个流程 3–6 个步骤；ABAP 11 个流程覆盖分析、实现、集成、测试与传输。

## 3. 价值流阶段覆盖

| 价值流 | 阶段覆盖 | 模块流程 | 唯一步骤 | 对象 |
| --- | --- | ---: | ---: | ---: |
| A2R 购置到退役 | 4/4 | 4 | 11 | 31 |
| D2D 开发到上线 | 5/5 | 11 | 38 | 68 |
| H2R 入职到离职 | 4/4 | 6 | 18 | 28 |
| M2A 维护到可用 | 4/4 | 6 | 16 | 34 |
| O2C 订单到收款 | 6/6 | 13 | 38 | 70 |
| P2Pro 计划到生产 | 5/5 | 12 | 39 | 85 |
| P2P 采购到付款 | 5/5 | 12 | 37 | 65 |
| P2Pft 项目到利润 | 4/4 | 6 | 16 | 30 |
| R2R 记账到报告 | 4/4 | 8 | 23 | 40 |
| S2C 服务到收款 | 4/4 | 7 | 18 | 46 |

**10 条价值流的 45 个阶段全部有流程覆盖**（校验脚本与 `tests/content.test.ts` 都会检查）。
阶段覆盖不等于角色覆盖：同一阶段可能由多个模块流程承担，进入 Flow 页可用阶段轨筛选。

## 4. 条件流程：可选与例外

### 4.1 三种变体

| `variant` | 含义 | 界面呈现 | 必填字段 |
| --- | --- | --- | --- |
| `core` | 主干路径，每个业务周期都会经过 | 实线卡片 | — |
| `optional` | 条件满足时才执行，主路径可以跳过 | **琥珀色虚线** +「可选」徽标 | `trigger` |
| `exception` | 异常/纠偏路径，如退货、冻结、冲销 | **玫红色虚线** +「例外」徽标 | `trigger` |

流程页、Flow 轨道、画布节点、底部流程带与图例都使用同一套视觉语言；`trigger` 会直接显示在卡片和页头，回答“什么时候才走这条路”。

### 4.2 可选流程（21）

| 流程 | 模块 · 阶段 | 触发条件 |
| --- | --- | --- |
| `sd-presales` 售前询价与报价 | SD · 订单 | 客户需要正式报价、多供应商比价或价格审批；现货订单可直接下单 |
| `sd-credit-management` 信用管理 | SD · 订单 | 客户启用信用管理且订单超限或触发冻结 |
| `mm-sourcing` 询价与货源确定 | MM · 采购 | 新物料/新供应商、需要比价或框架协议 |
| `mm-subcontracting` 委外加工 | MM · 采购 | 生产委外给供应商加工；自制或外购成品不走 |
| `ewm-replenishment` 拣配区补货 | EWM · 发货 | 拣配区库存低于阈值或波次拣配需要补货 |
| `ewm-wave` 波次与拣配 | EWM · 发货 | 多订单合并拣配、按路线/承运商集中发运 |
| `fi-asset-retirement` 资产报废与转移 | FI · 退役 | 资产损坏、出售、报废或跨成本中心/公司代码转移 |
| `co-internal-order` 内部订单 | CO · 关账 | 需要按内部项目/活动归集费用并结算 |
| `pp-capacity` 能力计划与排产 | PP · 生产 | 存在瓶颈、交期冲突或需要有限排产 |
| `qm-notification` 质量通知与纠正措施 | QM · 检验 | 来料/过程/客诉异常，或需要纠正措施 |
| `pm-notification` 维护通知处理 | PM · 通知 | 设备故障、点检异常或客户报修 |
| `pm-calibration` 测量设备校准 | PM · 计划 | 测量设备/仪表按法规或质量体系需要定期校准 |
| `cs-contract` 服务合同与计划 | CS · 执行 | 年度/周期服务合同，需按计划生成订单或开票 |
| `cs-warranty` 保修索赔与服务 | CS · 执行 | 产品在保修期内故障、客户提出保修索赔 |
| `cs-installation` 设备安装与移交 | CS · 执行 | 新设备交付、搬迁或客户现场安装/更换 |
| `hr-time` 时间管理与考勤 | HR · 人事 | 按小时计薪、加班/倒班/缺勤扣减或需要时间评估 |
| `abap-interface` ABAP 接口集成 | ABAP · 集成 | 与外部系统或非 SAP 系统交换数据 |
| `abap-performance` ABAP 性能优化 | ABAP · 分析 | 出现性能问题、超时或主动优化任务 |
| `abap-migration` 数据迁移与批量导入 | ABAP · 实现 | 上线、合并或主数据切换需要批量导入 |
| `abap-workflow` 工作流与审批 | ABAP · 实现 | 审批、升级或跨系统通知需要自动流转 |
| `abap-background-job` 后台作业与批处理 | ABAP · 实现 | 定时批处理、月结/日结或海量数据后台执行 |

### 4.3 例外流程（7）

| 流程 | 模块 · 阶段 | 触发条件 |
| --- | --- | --- |
| `sd-returns` 退货与贷项 | SD · 履约 | 客户退货、拒收、错发或需要贷项凭证；正向销售不经过 |
| `sd-billing-exception` 开票冻结与冲销重开 | SD · 开票 | 发票被冻结、开错或客户拒收，需要冲销重开 |
| `mm-vendor-returns` 供应商退货 | MM · 收货 | 来料不合格、数量差异或供应商召回，需要退货 |
| `fi-invoice-block` 发票冻结与释放 | FI · 发票校验 | 价格、数量或税差导致发票冻结，需要人工复核释放 |
| `pp-mrp-exceptions` MRP 异常处理 | PP · 计划 | MRP 后出现缺料、提前/推迟或取消建议 |
| `qm-lot-rejection` 检验批拒收与处置 | QM · 检验 | 检验批判定拒收，需要冻结/报废库存并启动纠正措施 |
| `pm-breakdown` 设备故障抢修 | PM · 通知 | 设备突发故障、停机或安全事件 |

> 例外流程不是“负向流程”的同义词：它表示**从主路径分叉出去、处理偏差**的路径。后续可把交货冻结释放、生产订单冲销也整理为 `exception`。

## 5. 条件步骤：只在特定条件下执行

步骤级 `optional: true` + `condition` 用于表达“同一流程里，某些步骤可跳过”。与条件流程的区别：流程整体仍是主干，只有个别动作按条件执行。

| 模块 | 条件步骤 | 触发条件（摘要） |
| --- | --- | --- |
| SD | `sd-atp-availability-check` | 物料启用可用性检查且订单触发 ATP |
| SD | `sd-vkm3-credit-check` | 客户启用信用管理且订单超限 |
| SD | `sd-vkm3-release-order` | 信用冻结后决定继续发货 |
| SD | `sd-vf11-cancel-billing` | 发票开错、客户拒收或需要重开 |
| SD | `sd-vl06o-delivery-due-list` | 需要批量筛选到期交货；单笔可直接创建 |
| MM | `mm-mb03-display-material-document` | 需要查看或冲销物料凭证 |
| MM | `mm-mi01-count-document` | 到达盘点周期或触发循环盘点 |
| MM | `mm-mi07-count-difference` | 盘点存在差异且需要调账 |
| FI | `fi-f110-payment-run` | 启用自动付款程序并生成付款建议 |
| FI | `fi-f53-manual-payment` | 自动付款未覆盖或需要临时手工付款 |
| FI | `fi-f150-dunning` | 客户存在逾期应收且需要催款 |
| FI | `fi-mir6-invoice-overview` | 需要批量查看冻结发票 |
| PS | `ps-cj32-budget-supplement` | 原预算不足且追加已审批 |
| PP | `pp-cm21-capacity-planning` | 存在瓶颈、交期冲突或有限排产 |
| PP | `pp-cm25-capacity-leveling` | 出现明确瓶颈且需要平衡 |
| PP | `pp-md05-mrp-list` | 需要查看 MRP 清单或例外消息 |
| QM | `qm-qa32-inspection-lot-list` | 需要批量筛选检验批 |
| QM | `qm-qm01-quality-notification` | 检验不合格、来料异常或客户投诉 |
| PM | `pm-iw21-maintenance-notification` | 设备故障、点检异常或客户报修 |
| EWM | `ewm-wave-create` | 多订单合并拣配或集中发运 |
| CS | `cs-va41-service-contract` | 年度/周期服务合同 |
| CS | `cs-va42-service-contract-change` | 合同续签、范围或价格变更 |
| HR | `hr-pt01-attendance` | 按小时计薪、倒班或需要考勤扣减 |
| HR | `hr-pt50-overtime` | 有加班审批、补休或时间账户 |
| HR | `hr-pt60-time-evaluation` | 薪酬依赖时间评估结果 |
| ABAP | `abap-st05-sql-trace` | 怀疑 SQL 性能问题 |
| ABAP | `abap-st12-runtime-analysis` | 需要定位运行时/内存/数据库瓶颈 |
| ABAP | `abap-sat-abap-trace` | 需要分析 ABAP 执行路径与耗时 |
| ABAP | `abap-lsmw-migration` | 上线/合并/主数据切换批量导入 |
| ABAP | `abap-sm35-batch-input` | 使用 LSMW 或 BDC 生成批输入会话 |
| ABAP | `abap-ltmc-migrate` | S/4HANA 迁移项目使用迁移 Cockpit |
| ABAP | `abap-sm21-analyze-job-log` | 作业失败或出现运行时错误 |

完整清单（含英文条件与所属流程）用 `pnpm content:report` 输出；逐流程的步骤表见 [13 号文档](13-process-catalog.md)。

## 6. 对象盘点

### 6.1 类型分布

| 类型 | 数量 | 说明 |
| --- | ---: | --- |
| T-Code | 198 | 业务流程的实际入口，覆盖 12 个模块 |
| 表 | 123 | 抬头/行项目/配置表，`tableClass` 标注透明表、文本表、定制表 |
| BAPI | 10 | 销售订单、采购订单、收货、发票校验、会计凭证、开票 |
| CDS | 9 | 销售订单、采购订单、物料凭证、日记账、开票、产品、业务伙伴、设备 |
| 增强 | 6 | MV45AFZZ、ME_PROCESS_PO_CUST、MB_DOCUMENT_BADI、MV50AFZ1、ME_PROCESS_REQ_CUST、WORKORDER_UPDATE |
| OData | 6 | 销售订单、采购订单、物料凭证、开票、产品、业务伙伴 |
| 函数 | 3 | 前导零转换、ALV 网格、启动工作流 |
| IDoc | 3 | ORDERS05、INVOIC02、DESADV01 |
| 类 | 2 | CL_SALV_TABLE、CL_HTTP_CLIENT |
| Fiori | 2 | F1873 管理销售订单、F0797 管理开票凭证 |
| 报表 | 2 | RSNAST00 输出控制、RVAUFSTA 销售订单分析 |
| 作业 | 1 | Z_MRP_NIGHTLY 夜间 MRP 批处理示例 |

### 6.2 被引用最多的对象

| 对象 | 被引用步骤数 | 角色 |
| --- | ---: | --- |
| `table:AUFK` 订单主数据 | 17 | 生产、维护、内部订单、项目网络共用 |
| `table:MSEG` 物料凭证行 | 17 | 收货、发料、转储、委外、退货 |
| `table:ACDOCA` 通用日记账 | 16 | FI/CO/资产/薪酬的统一账务底座 |
| `table:TADIR` 对象目录 | 16 | 所有 ABAP 开发对象登记 |
| `table:BSEG` 会计凭证行 | 14 | 总账、AP/AR、冲销、银行对账 |
| `table:COEP` CO 行项目 | 12 | 成本、获利分析、项目实际 |
| `table:COSP` 外部成本合计 | 11 | 成本中心、订单、项目 |
| `table:VBAK` 销售订单抬头 | 11 | 询价、报价、订单、合同 |
| `table:BKPF` 会计凭证抬头 | 10 | 总账与明细账 |
| `table:LIKP` 交货单抬头 | 10 | 交货、拣配、发货、EWM 出库 |
| `table:PROJ` 项目定义 | 10 | 项目结构、预算、执行、结算 |
| `table:PRPS` WBS 元素 | 10 | 项目预算、成本归集、结算 |
| `table:QMEL` 通知抬头 | 9 | 质量通知与维护通知共用 |
| `table:RESB` 预留/组件需求 | 9 | 生产订单、MRP、项目 |

没有“孤立对象”：`pnpm content:report` 的缺口检查当前为 0。

## 7. 本轮补全了什么

1. **流程从 59 扩到 85**：SD 增加交货与发货、开票冻结冲销；MM 增加收货、供应商退货；FI 增加发票冻结释放、银行对账；CO 增加成本分摊、获利分析；PP 增加 BOM、MRP 异常；QM 增加检验结果、拒收处置；PM 增加故障抢修、校准；EWM 增加补货、盘点；PS 增加资源计划、项目收尾；CS 增加保修、安装；HR 增加组织变更、离职；ABAP 增加 OData、工作流、后台作业、权限；
2. **步骤从 184 扩到 238**：新增步骤均含输入/输出、业务规则、常见问题与对象引用；复用步骤同时挂到多个流程，形成可追踪的共享关系；
3. **对象从 280 扩到 365**：补齐 `class` / `function` / `idoc` / `fiori` / `report` / `job` 六类空类型，新增 T-Code 41、表 15、BAPI 5、CDS 5、OData 3、增强 3、IDoc 3 等；
4. **条件表达继续落地**：新增 6 个可选流程（EWM 补货、PM 校准、CS 保修/安装、ABAP 工作流/后台作业）与 6 个例外流程（SD 开票冲销、MM 供应商退货、FI 发票冻结、PP MRP 异常、QM 拒收、PM 故障抢修），并新增 6 个条件步骤；
5. **代码片段从 14 扩到 19**：新增 IDoc 入站、OData HTTP 调用、授权检查、后台作业提交、工作流启动；
6. **新增模块明细文档**：`docs/13-process-catalog.md` 由 `pnpm content:catalog` 生成，按模块列出每个流程的步骤、输入输出、规则与对象，可选/例外流程用虚线块与徽标标出。

## 8. 下一步

| 优先级 | 事项 | 说明 |
| --- | --- | --- |
| P0 | 顾问复核 | 238 个步骤仍为 `draft`；优先核对新增 T-Code、表名与流程顺序 |
| P0 | 来源深化 | 目前多数内容只挂 `sap-help-s4hana` 入口，缺少页面级深链 |
| P1 | 代码片段 | 19 段代码仍集中在代表步骤；EWM 补货/盘点、PS 收尾、HR 离职可各补 1 段 |
| P1 | 例外流程 | 目前 7 个 `exception`；交货冻结释放、生产订单冲销、检验批冻结可继续整理 |
| P1 | 对象关系 | 新增对象的 `relations` 已可双向查询，但跨模块引用还可继续加密 |
| P2 | 专用场景 | 5 个手工场景之外，关键新流程可补 `scene.yaml` 做固定布局 |
| P2 | 角色视图 | 用流程 `roles` 驱动角色化入口（应收、采购、仓管、ABAP） |

## 9. 重新生成

```bash
pnpm content:build      # 生成 src/generated/content.json
pnpm content:validate   # 只校验，不写文件
pnpm content:report     # 打印覆盖矩阵、条件流程/步骤与缺口
pnpm content:catalog    # 生成 docs/13-process-catalog.md
pnpm test               # 内容一致性 + 阶段覆盖 + 条件字段
pnpm build              # typecheck + 生产构建
```

报告脚本在 [`scripts/content-report.ts`](../scripts/content-report.ts)，明细文档脚本在 [`scripts/content-catalog.ts`](../scripts/content-catalog.ts)；新增/调整统计口径时改这里，不要手工维护数字。
