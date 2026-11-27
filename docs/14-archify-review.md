# 14 · Archify 架构诊断与优化

> 诊断日期：2026-11-26 · 工具：Archify 3.3.2（Code Analysis + Architecture） · 范围：`src/`、`scripts/` 的工作树。

## 1. 为什么做

项目已扩到 12 模块 / 85 流程 / 238 步骤 / 365 对象，但此前的质量判断主要靠内容测试与人工截图。
本次用 Archify 的静态分析先建立可复现的架构基线，再只改证据指向的问题；目标不是「零告警」，而是降低最贵的维护点并让首屏更轻。

## 2. 方法

```bash
# 1) 安装到项目（不写入全局目录）
npx -y skills@latest add https://archify.si --skill archify --skill archify-pr --agent codex --copy --yes

# 2) 只分析业务代码，排除本地 skill 与构建产物
node .agents/skills/archify/bin/archify.mjs code-analysis prepare . \
  --out .archify/code-analysis \
  --language ts --locale zh-CN \
  --config docs/architecture/code-analysis.config.json
```

- 分析报告：离线 HTML，含依赖星图、3D 模型、复杂度热点、分层与循环依赖；
- 交付物：[`code-analysis.html`](architecture/sap-flow-atlas.code-analysis.html)；
- 架构图：[`sap-flow-atlas.architecture.html`](architecture/sap-flow-atlas.architecture.html)（仓库证据固定在 `7c8070e`）；
- 可编辑源：[`sap-flow-atlas.architecture.json`](architecture/sap-flow-atlas.architecture.json)，重新交付用 `finalize architecture <json> <html> --repo-root . --quality showcase`。

## 3. 基线 → 结果

| 指标 | 基线 | 优化后 |
| --- | --- | --- |
| 错误 / 警告 / 提示 | 0 / 12 / 14 | 0 / 11 / 18 |
| 循环依赖 | 0 | 0 |
| `scripts/build-content.ts` `main` 复杂度 | 95（342 行） | 22（142 行，降为提示级） |
| `FlowCanvas.tsx` `CanvasInner` 复杂度 | 94（342 行） | 52（236 行） |
| 入口 chunk JS | 1,333.87 kB（gzip 368.14 kB） | 201.76 kB（gzip 53.38 kB） |
| 构建告警 | 存在 >500 kB chunk | 无 |
| 测试 | 21 | 27 |

> 提示数从 14 变 18 是因为新增了 `graph.ts`、`content-validation.ts` 等可测试单元，属于拆分后的函数级提示，不是回归。

## 4. 做了什么

### 4.1 画布图构建抽成纯函数（`src/features/canvas/graph.ts`）

- 把节点可见性、过滤/聚焦/选中状态、节点与边构建、`ref` 导航解析从 `CanvasInner` 抽出；
- `resolveActivation` 统一 portal / module / process / step / flow / object 的跳转语义；
- 新增 6 个单元测试覆盖命名空间解析、hidden 传播、对象聚焦与 portal 跳转；
- `CanvasInner` 复杂度 94 → 52，组件只保留视口与事件编排。

### 4.2 内容构建校验拆成按实体分组（`scripts/content-validation.ts`）

- `main` 只负责加载、排序、派生索引与写出；校验拆成 `checkModules` / `checkProcesses` / `checkScenes` 等函数；
- 校验顺序、错误文案与原实现保持一致；对 `content.json` 做逐字节对比（排除 `generatedAt`）确认 **IDENTICAL**；
- `main` 复杂度 95 → 22，新增校验逻辑可以单独补测试。

### 4.3 首屏拆包

- `FlowCanvas`（含 React Flow）改为按需加载，只在 Map 镜头请求；
- 用 Vite 8 / Rolldown 的 `codeSplitting.groups` 拆出 `content` 与 `react` 长期缓存块；
- `content` 数据块约 570 kB（gzip 129 kB），是知识库正文而非代码，构建阈值单独放宽到 600 kB；
- 入口 chunk 从 1.33 MB 降到 202 kB；Track 路线的首载不再包含 React Flow 的 266.98 kB（gzip 90.77 kB），content / react 仍按需随首屏加载。

### 4.4 仓库卫生

- `.gitignore` 增加 `.agents/`、`.archify/`，避免 22 MB 的本地 skill 与诊断产物进入版本库；`skills-lock.json` 保留来源与哈希，供重装时校验；
- 分析配置放入 `docs/architecture/`，报告与架构图作为可分享交付物。

## 5. 验证

```bash
pnpm content:validate   # 12 模块 / 238 步骤 / 365 对象通过
pnpm test               # 4 个文件 / 27 个测试通过
pnpm typecheck          # 通过
pnpm build              # 通过，无 >500 kB 告警
```

视觉验收用 headless Chrome 截了 7 张：桌面首页、Process Track、Process Map、Flow Track、对象索引、390px 移动端、架构图；
全部无 console error、无失败请求、无横向溢出。截图清单在 `tmp/shots/opt/shots.json`（本地临时目录，不入库）。

## 6. 剩余热点（下一轮再动）

| 位置 | 复杂度 | 建议 |
| --- | --- | --- |
| `DetailDock`（`Inspector.tsx`） | 57 | 按“概览 / 对象 / 代码 / 跨模块 / 来源”拆 tab 组件 |
| `PathBand` | 54 | 抽出 band item 构建与键盘导航 hook |
| `CanvasInner` | 52 | 把 fitView / 居中 / minimap 快捷键拆成 hooks |
| `NavigationRail`、`TrackView`、`StageRail` | 29 | 抽出重复的分组与状态渲染 |
| `src/features` | 占 46% 源码行 | 只在出现第二个消费方时再拆包，避免为拆而拆 |

Archify 的结论是 **没有循环依赖**；本次没有配置分层规则（`boundaries = null`），所以「分层违规」是未检查项，不能当成通过。剩余问题都是单函数复杂度，属于维护性信号，不是运行时缺陷。

## 7. 复现注意

- 本机 DSH 沙箱下 Chrome 需要加 `ARCHIFY_CHROME_NO_SANDBOX=1` 才能跑 `finalize` 的 browser-check；这只影响本地取证，不改变产物。
- `finalize` 的证据按 **提交后的字节** 校验；工作树未提交时，引用行号必须来自 `git show HEAD:<path>`。
- Code Analysis 描述的是当前工作树（含未提交改动），与架构图固定的 commit 是两套证据，不要混用。
