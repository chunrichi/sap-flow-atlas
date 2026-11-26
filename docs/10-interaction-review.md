# 10 · 交互审查与同类产品对标

> 日期：2026-11-25。目标：梳理 SAP Flow Atlas 当前交互，找出内容规模变大后的导航/探索摩擦，并给出可落地的下一步。
>
> 计数说明：本文提到的 108 步骤 / 185 对象是评审时快照；2026-11-26 已扩到 184 步骤 / 280 对象，最新覆盖见 [12 号文档](12-content-map.md)。

## 1. 结论摘要

当前产品的核心交互是“一张可缩放画布 + 右侧检查器 + 搜索”，方向是对的：符合“总览 → 缩放/过滤 → 细节”的原则，也已经有语义缩放、对象聚焦、价值流目录和移动端列表。

但内容到 108 个步骤、185 个对象后，最大的问题不再是“画布好不好看”，而是导航与过滤：

1. 进入某个流程后，看不到同级流程，也看不到自己在整张图里的位置；
2. 185 个对象没有按模块、类型、状态、角色筛选的入口；
3. 对象“使用位置”跳转时，背景画布可能仍是原场景，跨流程语义断裂；
4. Hover/检查器是临时的，不能钉住、对比或并排阅读；
5. 10 条价值流藏在右上角菜单里，新用户容易只看到 4 条主干。

建议下一步不要继续加节点，而是把布局升级为“左侧导航树 + 中间画布 + 右侧检查器 + 右下迷你地图”的四区结构。SAP Signavio、Sourcegraph 以及 Figma/Miro 这类画布产品虽然形态不同，但方向一致：空间负责关系，结构负责定位，详情按需出现。

## 2. 当前交互地图

| 层级 | 入口 | 主要动作 | 反馈 | 当前状态 |
| --- | --- | --- | --- | --- |
| 全局 | Header | 搜索（⌘K / Ctrl+K）；点 logo 回首页 | cmdk 面板，按模块/流程/步骤/对象分组 | 可用；无筛选、无最近搜索 |
| L0 系统全景 | #/ | 点模块卡片；点 4 条主干丝带；右上角价值流目录 | fitView 推进；场景栏显示 12 模块 / 10 流程 | 清晰；10 条流程的发现性不足 |
| L1 模块工作区 | #/m/:module | 点流程卡片；点价值流卡片；ABAP 地图点对象/门户 | 模块 hub + 流程列 + 价值流列；自动兜底布局 | 可扩展；没有同级流程切换器 |
| L2 流程画布 | #/m/:module/p/:process | 拖拽/滚轮缩放；Hover 步骤；点步骤 | 语义缩放；步骤蛇形布局；检查器 | 核心体验；缺少步骤级导航/播放 |
| L3 对象/步骤详情 | 右侧检查器 | 切换 5–6 个 Tab；复制代码；点关系/使用位置 | 480px 抽屉；URL 带 step/object/tab | 信息密度高；跨场景跳转有断点 |
| 对象聚焦 | 点对象节点/对象 chip | 相关步骤高亮，其他淡化 | objectUsage 派生 + CSS 状态 | 有效；无“只看相关”硬过滤 |
| 移动端 | 小于 768px | 纵向分组卡片列表；点卡片进检查器 | 场景栏 + 分组标题 + 全宽检查器 | 可读；不是原生 bottom sheet |
| 键盘 | 全局 | Tab/Enter/Space；Esc 关检查器；⌘K 搜索 | 焦点环、ARIA label | 基础可用；无方向键空间导航 |
| URL/状态 | 所有场景 | 深链接、刷新保持 | hash 路由 + query | 做得好，应继续坚持 |

### 2.1 当前做得好的地方

- 层级命名清楚：Universe / Module / Process / Object，和 SAP 的“系统 → 模块 → 流程 → 对象”心智一致。
- URL 即状态：步骤、对象、Tab 都可分享，刷新不丢，这是知识库产品最重要的基础之一。
- 语义缩放：缩小时保留编号、T-Code、标题，放大才给摘要；避免了“缩小后全是字”。
- 搜索优先：⌘K 已覆盖模块/流程/步骤/对象，且现在能通过对象名反查步骤。
- 对象聚焦：从“看对象”变成“看对象在流程里的位置”，比纯对象列表更接近 SAP 的真实问题。
- 流程场景的蛇形布局：5–6 步不再横向压缩，移动端也有分组列表。

### 2.2 当前主要摩擦

| 摩擦 | 证据 | 影响 | 优先级 |
| --- | --- | --- | --- |
| 没有持久导航树 | 进入流程后只有面包屑/返回；同级流程要回模块 | 连续比较 4 个 SD 流程要多走 3 次回头路 | 高 |
| 无过滤 | 185 对象、108 步骤；搜索只能输入关键词 | 无法“只看 FI / 只看 draft / 只看 T-Code” | 高 |
| 跨场景“使用位置”跳转不完整 | ObjectUsage 保持当前 pathname，只改 query | 从对象点另一流程步骤时，背景画布可能不是该步骤所在场景 | 高（可修） |
| Flow 层级与步骤层级语义不一致 | O2C 有 6 阶段，场景只画 4 个主干步骤 | 用户会问“定价/信用/退货在哪” | 中 |
| 10 条价值流藏在菜单 | 首页只画 4 条主干 | 新用户容易以为只有 4 条流程 | 中 |
| 检查器遮挡画布 | 480px 抽屉覆盖右侧节点 | 阅读详情时看不到上下文；无法并排比较 | 中 |
| 无迷你地图 | 只有 +/−/fit；ABAP 地图与蛇形流程较大 | 拖远后失去方向感 | 中 |
| 无 guided tour / story | 首屏没有“从哪开始”的引导 | 第一次进入的空白画布认知成本高 | 中 |
| Hover 不可钉住 | 120ms 出现、220ms 收起 | 想对照两个对象时要反复移动鼠标 | 低–中 |
| 移动端检查器是全宽面板 | 顶部 80px 固定层，不是可拖拽 bottom sheet | 返回/切换上下文不够顺 | 低–中 |

## 3. 同类产品与可借鉴模式

### 3.1 SAP Signavio Process Navigator：层级 + Tab + Where Used

SAP 的参考流程库不是“一张大图”，而是分层导航 + 详情 Tab：

- 业务流程详情有“通用业务流程层次结构”和“业务流程变式”等 Tab；
- 每个流程可用“展开到”下拉，展开到细分/业务活动/业务功能级别，也可以一键全部展开；
- 图表区支持过滤、结果计数、全屏、缩放与居中；
- Where Used 会列出引用该能力的通用业务流程与流程变式。

可借鉴：左侧放一棵可折叠的“模块 → 流程 → 步骤”导航树；顶部/树内提供“展开到层级”；右侧检查器保留 Tab；把“使用位置”做成可跳转的 Where Used。

不要照搬：SAP 的企业级 Tab 数量和配置感很重；本项目应保持浅色、轻量、单画布。

### 3.2 SAP Fiori Overview Page：全局筛选 + 角色化卡片

Fiori 的 Overview Page 用一组可操作卡片承载多来源信息，顶部 Smart Filter Bar 的筛选会影响所有卡片，用户可以隐藏/个性化卡片，按角色聚焦。

可借鉴：在模块/流程场景上方加一条轻量过滤条（模块、状态、对象类型、角色），并保存为“我的视图”；不要把所有筛选都塞进命令面板。

### 3.3 Celonis Process Explorer：点节点 → 过滤/详情

Celonis 的 Process Explorer 在点击活动节点后打开 Activity Details，还能选择“包含此活动 / 不包含此活动 / 从此活动开始 / 从此活动结束”的案例过滤；变式浏览器则把不同执行路径拆开。

可借鉴：对象/步骤点击后，除了“看详情”，还提供“只看包含它的步骤”（硬过滤，而不是只淡化）；未来可做“标准路径 vs 退货/异常路径”的变式对比。

不要照搬：Celonis 的核心是事件日志和案例级指标，本项目没有事件数据，不应该伪装出“流程挖掘”指标。

### 3.4 Sourcegraph：Hover 里的引用与定义

Sourcegraph Code Navigation 的典型交互是：Hover 符号 → 看定义/引用；点击 go to definition / find references；结果可跨仓库。

可借鉴：把 Hover 卡从“摘要”升级为对象关系入口：显示“被 5 个步骤使用”“在 3 个模块出现”，并提供“钉住”和“打开使用位置”。这比单纯加更多摘要更符合“开发对象”场景。

### 3.5 Figma / Miro / Obsidian Canvas：迷你地图与快捷键

Figma 的 MiniMap 插件支持点击居中、拖拽平移、双击缩放到图层；Miro 用 M 打开 minimap、⌘K 打开命令面板；Obsidian Canvas 的 minimap 也提供 viewport 框与点击/拖拽导航。

可借鉴：右下角增加可折叠 minimap，显示 viewport 矩形；点击/拖拽定位，双击回到最近节点；M 切换；小场景自动隐藏。

### 3.6 SAP Business Accelerator Hub：发现 → 试用 → 复制

SAP Business Accelerator Hub 把 API 发现、文档、沙盒测试和工作区放在一起，让开发者“找到 → 看懂 → 试一下”。

可借鉴：在代码/对象详情里提供“复制可运行片段”“在 API Hub 打开对应 API”“查看来源”三件事，把“知道”变成“能试”。

### 3.7 信息可视化原则：先总览，再过滤，再细节

Shneiderman 的 Visual Information Seeking Mantra 是“Overview first, zoom and filter, then details-on-demand”；渐进披露也强调先给常用信息，把复杂控制放到用户需要时。

可借鉴：当前 LOD 只做了“缩放”，还缺“过滤”这一层；过滤应该是画布的一部分，而不是搜索框的附属功能。

## 4. 建议的目标交互结构

     ┌──────────────────────────────────────────────────────────────┐
     │ Header：面包屑 · 统计 · 搜索 · 我的视图                       │
     ├──────────────┬───────────────────────────────┬───────────────┤
     │ 导航树        │ 画布                           │ 检查器         │
     │ Module       │ 场景 + 语义缩放 + 对象聚焦      │ 概览/对象/代码 │
     │  Flow        │                               │ 跨模块/来源    │
     │   Process    │                     ┌───────┐ │               │
     │    Step      │                     │MiniMap│ │               │
     └──────────────┴─────────────────────┴───────┴─┴───────────────┘

核心变化：把“导航”从画布里拿出来，把“详情”固定到右侧，把“位置”交给 minimap。画布继续负责空间关系，不再承担全部导航。

## 5. 推荐优先级

### P0：先做三个高收益交互

1. 左侧流程导航树 + 过滤条
   - 树：模块 → 流程 → 步骤；当前节点高亮；同级流程一键切换。
   - 过滤：状态（draft/reviewed）、对象类型、模块、flow；过滤后画布只保留匹配节点。
   - 参考：Signavio 的层级展开 + Fiori 的全局筛选。
   - 验收：从 SD 订单流程切到定价流程不超过 1 次点击；过滤后节点数可见下降。

2. MiniMap + “回到全图” + M 快捷键
   - viewport 矩形；点击居中；拖拽平移；双击缩放；小场景自动隐藏。
   - 参考：Figma / Miro / Obsidian Canvas。
   - 验收：ABAP 地图拖到右下角后，一次点击回到全图；不遮挡 Controls。

3. 可钉住的 Where Used / 对象聚焦
   - Hover 卡增加“钉住”；检查器的“使用位置”跳到正确 scene（stepRoute），而不是只改 query。
   - 提供“只看相关步骤”硬过滤，与当前淡化并存。
   - 参考：Sourcegraph 的 find references + Celonis 的节点过滤。
   - 验收：VBAK → 使用位置中的 SD 步骤，打开正确流程场景并保留对象上下文。

### P1：让“讲解”和“对比”成为可能

4. Story mode：对 O2C / P2P 做 5–7 步 guided walkthrough，支持上一步/下一步/自动播放，URL 记录当前步；适合首次使用和演示。
5. Compare / Variants：并排比较“标准订单 vs 退货”“SD 订单 vs MM 采购”；为未来“标准路径 vs 异常路径”留结构。
6. 搜索增强：最近搜索、类型/模块过滤、结果预览；搜索结果直接展示“在哪个流程、用了哪些对象”。

### P2：协作与个性化

7. 最近访问轨迹 / 收藏 / 分享视图；
8. 角色化视图（销售、采购、财务、ABAP）；
9. 评论/标注/内容状态流转；
10. 移动端 bottom sheet 与手势。

## 6. 不建议优先做的事

- 继续堆节点和边：当前 185 个对象已经需要过滤，继续加内容不会提升理解。
- 模仿 Celonis 的流程挖掘指标：没有事件日志，硬造指标会损害可信度。
- 做完整的自由画布编辑器：这不是 Figma，节点位置应由场景/布局维护。
- 为每条 flow 画 10 条交叉丝带：首页已经验证会变成“意大利面”；用目录 + 主干更清楚。

## 7. 参考来源

- SAP Signavio Process Navigator：业务流程详情与“展开到层级”：https://help.sap.com/docs/cloud-alm/getting-started-process-navigator/accessing-details-of-solution-process?locale=en-US
- SAP Signavio Process Navigator：图表、过滤、全屏、缩放/居中：https://help.sap.com/docs/cloud-alm/getting-started-process-navigator/exploring-solution-processes?locale=en-US
- SAP Signavio Process Navigator：Where Used：https://help.sap.com/docs/cloud-alm/getting-started-process-navigator/exploring-business-and-solution-capabilities?locale=en-US
- SAP Signavio：流程变式管理：https://help.sap.com/docs/signavio-process-manager/user-guide/variant-management?locale=en-US&version=SHIP
- SAP Fiori Overview Page：卡片 + 全局筛选：https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/468a97775123488ab3345a0c48cadd8f/a1bb47ab-dc77-49fc-b527-116620586712.html?locale=en-US&version=1610+003
- Celonis Process Explorer：节点详情与案例过滤：https://docs.celonis.com/en/analysis---process-explorer--full-screen-.html
- Celonis Process Explorer：节点 popup / Occurrences：https://docs.celonis.com/en/view-node-details-in-process-explorer.html
- Sourcegraph Code Navigation：定义/引用/实现：https://sourcegraph.com/docs/code-navigation
- Miro 快捷键：M minimap、⌘K command palette：https://help.miro.com/hc/en-us/articles/360017731033-Shortcuts-and-hotkeys
- Figma MiniMap：click/drag/double-click：https://www.figma.com/community/plugin/1569335510456208257/minimap
- Obsidian Canvas minimap：viewport 框与点击/拖拽：https://github.com/lugglory/obsidian-hy-canvas-minimap
- Shneiderman, Visual Information Seeking Mantra：https://www.cs.cornell.edu/colloquium/2003FA/shneiderman.htm
- Progressive disclosure：https://www.sciencedirect.com/topics/computer-science/progressive-disclosure
- SAP Business Accelerator Hub：发现、探索、测试 API：https://developers.sap.com/tutorials/hcp-abh-getting-started..html

## 8. 落地状态（2026-11-25）

- 已实现：左侧“模块 → 流程 → 步骤”导航树（≥1400px 显示，小屏仍用面包屑/搜索）、对象类型筛选、MiniMap（场景栏按钮 + `M`，切换场景自动收起）、Where Used 跨场景跳转修复。
- 已实现：对象聚焦仍保留“高亮相关步骤、淡化无关节点”。
- 已实现：Hover 钉住、对象 Hover 的“相关步骤”、O2C 6 步 Story mode（上一步/下一步、键盘、URL、查看步骤）。
- 已实现：流程对比（A/B 步骤与对象差异）、最近访问轨迹、检查器/对比/故事焦点圈定、跳过链接、模块卡共享元素过渡。
- 已实现（2026-11-25 多视图工作台）：硬过滤/仅显示匹配、对象索引与对象脉络、Compare 并排、任意 flow 的 Story、Peek/Pin 可调宽详情坞、底部流程带与阶段轨。
- 未实现：SAP 顾问内容复核、真实用户可用性测试、跨设备保存视图。

> 多视图方案与落地状态见 [11 多视图工作台](11-flexible-workbench-and-benchmarks.md)。

## 9. 方法与限制

- 当前交互基于代码与本地截图审查，不做真实用户可用性测试；
- 同类产品依据官方文档与公开说明，未逐一手动操作全部企业版功能；
- “可借鉴”不等于“应照搬”，最终以本项目的内容结构（流程 + 对象 + 代码）为准。
