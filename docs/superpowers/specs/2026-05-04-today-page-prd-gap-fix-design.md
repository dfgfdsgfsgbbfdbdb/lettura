# Today 页面 PRD/Mockup 合规修复方案

> 基于 2026-05-04 审计结果，三批渐进修复。
> 审计覆盖率：PRD功能 78%，Mockup UI 90%，交互正确性 72%。

## 修复范围

- **P0 Bug**: 1项（isExpanded 逻辑反转）
- **P1 体验差距**: 8项（Align-3 已实现，移除）
- **P2 低优先级**: 4项
- 总计 13项，分三批执行

---

## 第一批 — Bug 修复（4项）

> 目标：修复影响所有用户的功能性错误
> 风险：低（每个修复 ≤5 行代码）
> 验证：tsc + vitest

### Fix-1: isExpanded 逻辑反转 🔴

**文件**: `SignalCard.tsx`
**问题**: `isExpanded = isActive || store.expandedSignalId !== signal.id`
- `expandedSignalId` 初始为 `null`，`null !== signal.id` 永远为 `true`
- 导致所有 SignalCard 默认展开（应为默认收起）
**修复**: `!==` → `===`
```tsx
// Before
const isExpanded = isActive || store.expandedSignalId !== signal.id;
// After
const isExpanded = isActive || store.expandedSignalId === signal.id;
```
**验证**: 页面加载时所有卡片应处于收起状态

- [ ] SignalCard isExpanded 逻辑修正
- [ ] 页面加载默认收起
- [ ] 点击展开/收起正常工作

### Fix-2: TodayHeader pipelineError 未使用 🟡

**文件**: `TodayHeader.tsx`
**问题**: `pipelineError` prop 接收但赋值给 `_pipelineError` 未传递给 StatusPill
**修复**: 将 `pipelineError` 传递给 StatusPill 的 error 状态，在 error 渲染中显示错误文字
```tsx
// StatusPill error 状态增加：显示 pipelineError 文字内容
// 当前 error 状态只有"重试"按钮，缺少错误信息
```
**验证**: Pipeline 失败时 StatusPill 显示具体错误信息

- [ ] TodayHeader 传递 pipelineError 给 StatusPill
- [ ] StatusPill error 状态显示错误文本（不仅仅是重试按钮）

### Fix-3: DailyStatus 进度条 fallback 🟡

**文件**: `DailyStatus.tsx`
**问题**: `progress ?? 1` 导致无进度时显示 100%
**修复**: `progress ?? 1` → `progress ?? 0`
**验证**: 无 pipeline 运行时进度条为空

- [ ] progress fallback 改为 0
- [ ] 无 pipeline 时进度条不显示 100%

### Fix-4: signalsError 未用于渲染判断 🟡

**文件**: `TodayPage.tsx`
**问题**: `signalsError` 从 store 读取但**完全未参与渲染逻辑**。`renderEmptyState()` 只判断 `!hasApiKey` / `!hasSignals`，错误状态丢失。`TodayEmptyState` 已有 `type="load_error"` 支持但从未被调用。
**修复**: 在 `renderEmptyState` 前增加 `signalsError` 独立判断
```tsx
if (store.signalsError) {
  return <TodayEmptyState type="load_error" onRetry={() => store.fetchSignals()} />;
}
```
**验证**: fetchSignals 失败时显示错误重试 UI

- [ ] signalsError 在渲染逻辑中独立判断
- [ ] 错误状态调用 TodayEmptyState type="load_error"
- [ ] 重试按钮触发 fetchSignals

---

## 第二批 — PRD/Mockup 对齐（4项）

> 目标：与 PRD 规范和 Mockup 视觉对齐
> 风险：中等（涉及 UI 变更和交互逻辑）
> 验证：tsc + vitest + 视觉确认
>
> 注：Align-3 (TodayHeader 副标题) 已实现 — TodayHeader.tsx L96 已有
>     `t("today.subtitle")` 渲染，i18n key 已存在于 en.json/zh.json。

### Align-1: 反馈后卡片视觉弱化 🔴

**文件**: `SignalCard.tsx`
**PRD**: `not_relevant` 反馈后卡片视觉弱化 + 可撤销
**当前**: 仅禁用反馈按钮
**修复**:
- `feedbackMap[signal.id] === "not_relevant"` 时添加 `opacity: 0.5` + 删除线
- 显示"撤销"按钮
- 撤销 = `submitFeedback(signalId, null)` 清除反馈

- [ ] not_relevant 时 opacity + 删除线
- [ ] 撤销按钮显示
- [ ] 撤销调用 submitFeedback(signalId, null)
- [ ] 其余反馈按钮在已反馈后禁用

### Align-2: 信号级别标签 🟡

**文件**: `SignalCard.tsx`
**PRD T-H5**: Top Signal / Watch / Signal 三级标签
**Mockup**: 无文字标签，但有 3-bar indicator
**修复**: 在 3-bar indicator 后添加文字标签
```tsx
// relevance_score >= 0.8 → "Top Signal" (accent色)
// relevance_score >= 0.5 → "Watch" (amber色)
// else → "Signal" (gray色)
```
**i18n**: 新增 3 个 key: `today.signal.level_top`, `today.signal.level_watch`, `today.signal.level_signal`

- [ ] 三级标签组件
- [ ] i18n key (en.json + zh.json)
- [ ] 颜色匹配 level

### Align-3: DailyStatus 数据语义 🟡

**文件**: `DailyStatus.tsx`
**问题**: "已同步"/"已分析"/"高信号" 语义与 PRD 不一致
**修复**: 对齐 PRD 定义
- 已同步 → `overview.article_count` 篇 ✅
- 已分析 → `overview.signal_count` 个信号 (已修复)
- 高价值 → 前端过滤 `relevance_score >= 0.8` 的 signal 数量
**i18n**: 调整 key 描述

- [ ] 高价值信号计算逻辑
- [ ] 数据行语义修正

### Align-4: Star 全局同步 🟡

**文件**: `InlineReader.tsx` + `createTodaySlice.ts`
**问题**: Star 仅改 localStarred，不刷新 store
**修复**: Star 成功后调用 store 的文章状态更新
- 方案: `updateArticleStarStatus` 成功后，刷新当前 signal 的 sources 状态
- 或: 简化方案 — 读取 store 中文章的 starred 状态而非 localStarred

- [ ] Star 操作后刷新 store 状态
- [ ] 其他位置看到的 starred 状态一致

---

## 第三批 — 体验优化（5项，可选）

> 目标：提升用户体验和代码质量
> 风险：低
> 可推迟到后续迭代

### Opt-1: 反馈历史入口
- 在 TodayHeader 或 Settings 中添加反馈历史查看入口
- 调用已有 `fetchFeedbackHistory` action

### Opt-2: 离线检测空态
- 监听 `navigator.onLine` 或 Tauri 网络事件
- 离线时显示缓存结果 + 离线 pill

### Opt-3: 类型重复清理
- dataAgent.ts 和 createTodaySlice.ts 中的 Signal/SignalSource 等类型合并到一处
- 建议: 统一到 `typing/index.ts`

### Opt-4: EvidencePanel 加载更多
- 当前固定 5 条，添加"显示全部"入口

### Opt-5: PipelineIndicator 与 TodayHeader StatusPill 去重
- 两个组件都在 idle/done 状态显示刷新按钮
- 考虑合并或明确分工

---

## 验证 Checklist

### 每批完成后必检

- [ ] `tsc --noEmit` 0 errors
- [ ] `cargo check` 0 errors (涉及后端修改时)
- [ ] `pnpm test` 全部通过
- [ ] LSP diagnostics 0 errors

### 第一批专项验证

- [ ] 页面加载所有卡片默认收起
- [ ] 点击标题/展开按钮切换展开收起
- [ ] Pipeline 失败时 StatusPill 显示错误文本
- [ ] 无 Pipeline 时 DailyStatus 进度条不显示 100%
- [ ] fetchSignals 失败时显示错误重试 UI

### 第二批专项验证

- [ ] "不相关"反馈后卡片半透明 + 删除线
- [ ] "不相关"反馈后有撤销按钮
- [ ] 撤销后恢复正常状态
- [ ] 三级信号标签正确显示
- [ ] DailyStatus 高价值信号数正确
- [ ] InlineReader Star 后其他位置状态一致

### 全局验证

- [ ] 深色模式下所有修改正常
- [ ] i18n 中英文 key 完整
- [ ] 无新增 console.log
- [ ] 无 `as any` / `@ts-ignore`
