# Topic 模块 Mockup vs 实现对比审计

> 基于 `apps/desktop/src/mockup/index.html` 和 `prd/ui/topics-page-spec.md` + `topics-interaction-spec.md` 逐项对比。

## 审计结论

| 维度 | 还原度 | 说明 |
|------|--------|------|
| 内容还原 | ~55% | 列表页核心信息完整，但缺少 sidebar、newCount、置信度等 |
| 交互还原 | ~65% | Follow/Mute/排序已实现，但缺 sidebar 快选、证据按钮、重算 |
| 视觉还原 | ~60% | 卡片/时间线样式接近，但缺 Hero Note、选中高亮、Tag 颜色 |
| PRD 合规 | ~75% | 四区阅读顺序正确，双分区正确，缺 Mute 过滤和 sidebar 展示 |

---

## 架构差异说明

| 维度 | Mockup | 实现 | 判定 |
|------|--------|------|------|
| 整体布局 | 三栏 Grid: `sidebar(236px) + main(flex) + detail(420px)` | 两页路由: `/local/topics` + `/local/topics/:uuid` | ✅ 接受 |
| 详情展示 | 同页面右侧面板 | 独立路由页面 `max-w-3xl mx-auto` | ✅ 接受 |
| Sidebar | 独立 Topic Sidebar（状态过滤+重点主题） | 全局 Sidebar 的 Tracked Topics 区 | ⚠️ 需增强 |

> **判定理由**: 桌面应用路由切换比同页三栏更自然。但 mockup 中 Topic Sidebar 的**状态过滤**和**重点主题快选**功能应补回到全局 Sidebar 的 Tracked Topics 区或列表页内。

---

## 逐项对比清单

### 一、列表页

| # | 元素 | Mockup | 实现 | 状态 |
|---|------|--------|------|------|
| 1 | 页面标题+副标题 | "Topics" + subtitle | ✅ `h1` + `t("layout.topics.subtitle")` | ✅ |
| 2 | Hero Note 紫色提示框 | `border:accent; background:accent-light` 解释 Topics 定位 | ❌ 无 | ❌ M9 |
| 3 | 重新分析按钮 | 标题右侧 `重新分析` | PipelineIndicator 有刷新，无独立按钮 | ⚠️ 部分 |
| 4 | 工具栏过滤标签 | 全部/追踪中/新发现/有变化 | All/Following/Muted 三按钮 | ⚠️ 标签差异 |
| 5 | "今天有变化"过滤 | mockup 有 `updated` 过滤+count | ❌ 无 | ❌ M2 |
| 6 | 排序下拉 | "按最近变化/按证据数量/按来源覆盖" | relevance/recent/article_count | ⚠️ 标签差异 |
| 7 | Tracked 分区标题 | "Tracked" | ✅ | ✅ |
| 8 | Discovered 分区标题 | "Discovered from Today" | ✅ | ✅ |
| 9 | 卡片状态 Tag 颜色 | accent(追踪中)/green(追踪中)/yellow(新发现) | 只有 accent(已关注)+gray(已静音) | ⚠️ M14 |
| 10 | 卡片 newCount badge | "4 个新变化" + 绿色小标 | ❌ 无 | ❌ M3 |
| 11 | 卡片 article/source count | "9 个来源 · 18 篇证据" | ✅ article_count + source_count | ✅ |
| 12 | 卡片置信度 | "置信度 86%" | ❌ 无（后端也不返回） | ❌ M6 |
| 13 | 卡片 Follow/Mute/证据 按钮 | 三按钮完整 | Mute 图标(hover显)，无 Follow/证据 | ⚠️ 部分 |
| 14 | 卡片选中高亮 | `active`: accent border + accent-light bg | ❌ 无（点击即导航走） | ❌ M13 |
| 15 | Sidebar 状态过滤 | 5项+count: 全部(28)/追踪中(12)/新发现(8)/今天有变化(5)/已静音(3) | 无独立 Topic sidebar | ❌ M1 |
| 16 | Sidebar 重点主题快选 | 带 "N 个新变化" 子标题 | 无 | ❌ M1 |
| 17 | Sidebar Footer | "上次分析 09:45 · 覆盖 126 篇文章" | 无 | ❌ M1 |
| 18 | PipelineIndicator | 无 | ✅ compact 模式 | ➕ 额外 |
| 19 | 空状态引导 | 无 | ✅ TopicEmptyPreview (API key检测+操作按钮+示例预览) | ➕ 额外 |

### 二、详情页

| # | 元素 | Mockup | 实现 | 状态 |
|---|------|--------|------|------|
| 20 | 返回按钮 | "← Topics" | ✅ ArrowLeft + "返回话题列表" | ✅ |
| 21 | 标题 + Follow 按钮 | 标题 + [Unfollow] | ✅ Pin/PinOff + Follow/Unfollow | ✅ |
| 22 | 状态 Tag | `tag-accent` "追踪中" | ❌ 无 | ❌ M4 |
| 23 | Definition | 一句话定义 | ✅ topic.description | ✅ |
| 24 | Topic Summary AI 卡片 | 无 | ✅ Sparkles + 独立摘要卡片 | ➕ 额外 |
| 25 | Recent Changes 时间线 | 📊 圆点+竖线+日期+标题+摘要 | ✅ Activity+圆点+竖线+日期+标题+统计 | ✅ |
| 26 | "查看证据" 按钮 | 每条 timeline 有 | ❌ 无 | ❌ M5 |
| 27 | 来源覆盖区 | "📰 Sources (18)" + 分组+可信度 | ✅ SourceGroup (COLLAPSE_THRESHOLD=3) | ✅ |
| 28 | 来源可信度标签 | "高可信/中高可信/需交叉验证" | ❌ 无 | ❌ M7 |
| 29 | 来源 "查看" 按钮 | 每个来源有 | ❌ 无 | ❌ M11 |
| 30 | Start Here 推荐区 | "📖 Start Here" + 推荐卡片+理由 | ✅ BookmarkPlus + top3 by relevance | ✅ |
| 31 | Start Here 推荐理由 | "推荐先读/看反方观点" | ❌ 无 | ❌ M8 |
| 32 | "重算" 按钮 | 详情 header 有 | ❌ 无 | ❌ M10 |
| 33 | Stats 行 (4格) | 无 | ✅ 文章/来源/首次/最近 | ➕ 额外 |

### 三、交互

| # | 功能 | Mockup | 实现 | 状态 |
|---|------|--------|------|------|
| 34 | Follow/Unfollow | 按钮切换 | ✅ 乐观更新+toast+回滚 | ✅ |
| 35 | Mute/Unmute | 按钮切换 | ✅ 乐观更新+回滚（无 toast） | ⚠️ 部分 |
| 36 | 侧边栏快选 | `data-topic-pick` 跳转卡片 | ❌ 无 | ❌ M1 |
| 37 | 排序切换 | 3 种排序 | ✅ 3 种排序 | ✅ |
| 38 | Start Here → 文章 | 跳转 Reader | ✅ navigate 或 window.open | ✅ |

---

## 差距清单（按优先级）

### 🔴 P0 — 体验关键缺失

| ID | 差距 | 影响范围 | 复杂度 |
|----|------|----------|--------|
| M1 | **无 Topic Sidebar** — 状态过滤+重点主题快选+Footer | 列表页左侧 | 高 |
| M2 | **无 "今天有变化" 过滤** | 列表页工具栏 | 低 |
| M3 | **卡片缺 newCount badge** — "N 个新变化" | 列表卡片 | 中(需后端) |
| M4 | **详情页无状态 Tag** | 详情页 header | 低 |
| M5 | **详情页无 "查看证据" 按钮** | 详情页 Recent Changes | 低 |

### 🟡 P1 — 信息完整度

| ID | 差距 | 影响范围 | 复杂度 |
|----|------|----------|--------|
| M6 | 无置信度显示 | 列表卡片 | 中(需后端) |
| M7 | 来源无可信度标签 | 详情页来源区 | 中(需后端) |
| M8 | Start Here 无推荐理由 | 详情页 Start Here | 低 |
| M9 | 无 Hero Note 提示框 | 列表页标题下方 | 低 |
| M10 | 详情页无 "重算" 按钮 | 详情页 header | 低 |
| M11 | 来源区无 "查看" 按钮 | 详情页来源区 | 低 |

### 🟢 P2 — 视觉对齐

| ID | 差距 | 影响范围 | 复杂度 |
|----|------|----------|--------|
| M12 | 工具栏 active 样式不一致 | 列表页工具栏 | 低 |
| M13 | 卡片无选中高亮态 | 列表卡片 | 低 |
| M14 | Tag 颜色不完整 | 列表+详情 | 低 |

---

## 修复方案

### 方案 A: 渐进式修复（推荐）

分三批修复，优先纯前端可完成项。

**第一批 — 纯前端快速修复 (M2, M4, M5, M9, M10, M11, M12, M13, M14)**
- 列表页增加 "有变化" 过滤按钮（前端过滤 `last_updated_at` 在今天的 topic）
- 详情页 header 增加状态 Tag（从 topic.status/is_following 推导）
- 详情页 Recent Changes 每条增加 "查看证据" 按钮（滚动到来源区）
- 列表页标题下方增加 Hero Note（i18n key 已有 `layout.topics.subtitle`，包装为紫色提示框）
- 详情页 header 增加 "重算" 按钮（调用 triggerPipeline）
- 来源区每个来源增加 "查看" 按钮（展开该来源的文章列表）
- 工具栏 active 样式改为 accent bg + white text
- 卡片增加选中高亮（当前选中卡片 accent border）
- Tag 颜色补全: tracked=accent, discovered=amber, muted=gray

**第二批 — 列表页增强 (M1 部分, M8)**
- 全局 Sidebar Tracked Topics 区增加 "有变化" badge
- Sidebar 增加状态 count (tracked N / all N)
- Start Here 推荐理由（后端已有 `relevance_score`，前端取 top 理由文案）

**第三批 — 后端依赖项 (M3, M6, M7, M1 完整)**
- 后端 topics 查询增加 `new_count` 字段（24h 内关联文章数）
- 后端 topics 查询增加 `confidence` 字段（复用 relevance_score）
- 后端 source_groups 增加 `quality_label` 字段
- 完整 Topic Sidebar（独立面板或增强全局 sidebar）

### 方案 B: 最小修复

只修 P0 中纯前端项: M2, M4, M5。跳过所有需后端改动和视觉优化项。
工作量: ~2h。

### 方案 C: 完整还原

将列表页改为三栏布局，详情页改为右侧面板。
工作量: ~16h，风险高（重构路由和布局架构）。

### 推荐

**方案 A**。三批渐进式，第一批全部纯前端可完成（~4h），风险低，效果明显。
方案 C 不推荐 — mockup 是静态原型参考，桌面应用路由切换是正确选择，不必强求三栏。
