# Topic 三栏布局重构 — 方案 C 实施设计

> 基于 `docs/superpowers/specs/2026-05-04-topic-mockup-gap-audit.md` 审计结果。
> 目标：将两页路由系统合并为同页面三栏布局，还原 Mockup 设计。

---

## 1. 架构决策

### 1.1 路由策略：保留双路由，URL 驱动选中

```
/local/topics          → TopicWorkspace（新组件，三栏容器）
/local/topics/:uuid    → TopicWorkspace（同组件，URL 参数驱动选中）
```

**理由**：
- 保留 URL 可分享性（`/local/topics/abc-123` 直接打开选中状态）
- 浏览器前进/后退天然支持
- TopicDetailDirectUrl 测试只需微调，不需重写

### 1.2 布局策略：TopicWorkspace 内部自建三栏

```
AppLayout (Rail + Sidebar:hidden + Outlet)
  └─ TopicWorkspace (三栏 Grid)
       ├─ TopicSidebar   (236px, 自建)
       ├─ TopicMain      (minmax(360px, 1fr), 卡片列表)
       └─ TopicDetail    (420px, 详情面板)
```

**理由**：
- 不修改全局 AppLayout 的 Sidebar 机制（影响其他页面）
- `getSidebarContext` 对 `/local/topics*` 保持 `"hidden"`
- TopicWorkspace 内部完全自治

### 1.3 选中状态：URL + Store 双驱动

```
点击 TopicCard → navigate("/local/topics/:uuid")  // URL 变化
                 → store.selectTopic(uuid)         // Store 更新（新增 action）
直接访问 URL     → useParams 获取 uuid → store.selectTopic(uuid)
```

---

## 2. 组件拆解

### 2.1 新组件

| 组件 | 文件 | 职责 |
|------|------|------|
| `TopicWorkspace` | `layout/Intelligence/Topics/TopicWorkspace.tsx` | 三栏 Grid 容器，URL→Store 桥梁 |
| `TopicSidebar` | `layout/Intelligence/Topics/TopicSidebar.tsx` | 左侧面板：状态过滤+重点主题+Footer |
| `TopicDetailPanel` | `layout/Intelligence/Topics/TopicDetailPanel.tsx` | 右侧面板：从 TopicDetailPage 重构而来 |

### 2.2 修改组件

| 组件 | 文件 | 变更 |
|------|------|------|
| `TopicListPage` → 合并进 `TopicMain` | `layout/Intelligence/Topics/TopicMain.tsx` | 去掉页面壳，只保留列表渲染+过滤+排序 |
| `TopicDetailPage` → 合并进 `TopicDetailPanel` | `layout/Intelligence/Topics/TopicDetailPanel.tsx` | 去掉路由导航，改为 props 驱动 |
| `TopicCard` | `layout/Intelligence/Topics/TopicCard.tsx` | onClick 改为 `navigate()` + 选中高亮样式 |
| `topicSlice` | `stores/topicSlice.ts` | 新增 `selectTopic(uuid)` action |

### 2.3 废弃路由

| 路由 | 处理 |
|------|------|
| `/local/topics` | 指向 TopicWorkspace |
| `/local/topics/:uuid` | 指向 TopicWorkspace（不再是独立页面） |

---

## 3. 详细设计

### 3.1 TopicWorkspace（三栏容器）

```tsx
// layout/Intelligence/Topics/TopicWorkspace.tsx

export function TopicWorkspace() {
  const { uuid } = useParams<{ uuid?: string }>();
  const store = useBearStore(useShallow(s => ({
    topics: s.topics,
    selectedTopic: s.selectedTopic,
    fetchTopics: s.fetchTopics,
    fetchTopicDetail: s.fetchTopicDetail,
    selectTopic: s.selectTopic,     // 新增 action
    clearSelectedTopic: s.clearSelectedTopic,
    pipelineStatus: s.pipelineStatus,
    // ... 其他字段
  })));

  // URL → Store 同步
  useEffect(() => {
    if (uuid) {
      store.selectTopic(uuid);
    } else {
      store.clearSelectedTopic();
    }
  }, [uuid]);

  // 初始加载
  useEffect(() => {
    store.fetchTopics("active", store.sortMode);
  }, []);

  // Pipeline 事件监听（从 TopicListPage 迁移）
  useEffect(() => {
    // ... pipeline:started/progress/completed/failed 监听
  }, []);

  const hasSelection = !!store.selectedTopic;

  return (
    <div className="grid h-full" style={{
      gridTemplateColumns: "236px minmax(360px, 1fr) 420px"
    }}>
      <TopicSidebar
        filterMode={store.filterMode}
        setFilterMode={store.setFilterMode}
        sortMode={store.sortMode}
        setSortMode={store.setSortMode}
        topics={store.topics}
        selectedUuid={uuid}
      />
      <TopicMain
        topics={store.topics}
        selectedUuid={uuid}
        sortMode={store.sortMode}
        filterMode={store.filterMode}
        pipelineStatus={store.pipelineStatus}
        // ...
      />
      {hasSelection ? (
        <TopicDetailPanel
          topic={store.selectedTopic}
          loading={store.detailLoading}
          onBack={() => navigate(RouteConfig.LOCAL_TOPICS)}
          // ...
        />
      ) : (
        <aside className="flex items-center justify-center text-[var(--gray-8)]">
          {t("topics.detail.select_prompt")}
        </aside>
      )}
    </div>
  );
}
```

### 3.2 TopicSidebar（左侧面板）

从 Mockup 还原：
- **Header**: "Topics" 标题 + 描述文字
- **状态过滤**: 全部(N) / 追踪中(N) / 新发现(N) / 今天有变化(N) / 已静音(N)
- **重点主题**: 已关注 topics，显示 title + "N 个新变化"
- **Footer**: "上次分析 HH:mm · 覆盖 N 篇文章"

```
数据来源：
- 状态 count → 从 topics 数组实时计算
- new_count → 后端暂不返回，用 last_updated_at 在24h 内判断
- Footer → pipelineStatus.lastUpdated + overview.article_count
```

### 3.3 TopicMain（中间卡片列表）

从 TopicListPage 提取：
- 去掉 `<div className="flex h-full">` 页面壳
- 去掉 PipelineIndicator（移到 TopicSidebar Footer）
- 保留: Header(title+subtitle+hero note+toolbar) + TopicList(Tracked+Discovered)
- TopicCard onClick 改为 `navigate(/local/topics/${uuid})`

### 3.4 TopicDetailPanel（右侧详情面板）

从 TopicDetailPage 重构：
- 去掉返回按钮（不需要路由返回）
- 去掉 `useParams` + `useEffect` fetch（改 props 驱动）
- 去掉 `clearSelectedTopic` cleanup（由 Workspace 管理）
- 保留: 所有详情区（Summary/RecentChanges/Sources/StartHere/Stats）

### 3.5 topicSlice 新增 action

```ts
selectTopic: (uuidOrId: string | number) => {
  // 从 topics 列表中找到 topic → 获取 id → fetchTopicDetail(id || uuid)
  const topic = get().topics.find(t =>
    t.uuid === uuidOrId || t.id === Number(uuidOrId)
  );
  if (topic) {
    get().fetchTopicDetail(topic.id);
  } else {
    // UUID 直达（不在列表中）
    get().fetchTopicDetail(uuidOrId);
  }
}
```

---

## 4. 文件变更清单

### 新建文件（3）

| 文件 | 行数估算 |
|------|----------|
| `layout/Intelligence/Topics/TopicWorkspace.tsx` | ~150 行 |
| `layout/Intelligence/Topics/TopicSidebar.tsx` | ~200 行 |
| `layout/Intelligence/Topics/TopicDetailPanel.tsx` | ~250 行（从 TopicDetailPage 重构） |

### 修改文件（7）

| 文件 | 变更 |
|------|------|
| `config.ts` | 无需改（路由路径不变） |
| `index.tsx` | 两路由都指向 TopicWorkspace |
| `layout/Intelligence/Topics/TopicMain.tsx`（从 TopicListPage 重命名） | 去掉页面壳，改为中间栏组件 |
| `layout/Intelligence/Topics/TopicCard.tsx` | 增加 selected 高亮，onClick 改为 URL 导航 |
| `stores/topicSlice.ts` | 新增 selectTopic action |
| `locales/en.json` + `locales/zh.json` | 新增 i18n keys |

### 废弃文件（2，可选保留用于向后兼容）

| 文件 | 处理 |
|------|------|
| `TopicListPage.tsx` | 重命名为 `TopicMain.tsx` 并重构 |
| `TopicDetailPage.tsx` | 重构为 `TopicDetailPanel.tsx` |

### 测试文件

| 文件 | 变更 |
|------|------|
| `Topics/__tests__/TopicDetailDirectUrl.test.tsx` | 改为测试 TopicWorkspace 的 URL 驱动选中 |

---

## 5. 同时修复的 Mockup 差距

在重构过程中，顺带修复以下差距（不额外增加工作量）：

| ID | 差距 | 在重构中如何修复 |
|----|------|------------------|
| M1 | 无 Topic Sidebar | ✅ 新建 TopicSidebar 组件 |
| M2 | 无 "今天有变化" 过滤 | ✅ TopicSidebar 状态过滤中增加 |
| M4 | 详情页无状态 Tag | ✅ TopicDetailPanel header 中增加 |
| M5 | 无 "查看证据" 按钮 | ✅ Recent Changes 每条增加 |
| M9 | 无 Hero Note | ✅ TopicMain header 中增加 |
| M10 | 无 "重算" 按钮 | ✅ TopicDetailPanel header 中增加 |
| M12 | 工具栏 active 样式 | ✅ TopicSidebar 中统一样式 |
| M13 | 卡片选中高亮 | ✅ TopicCard selected prop |
| M14 | Tag 颜色不完整 | ✅ TopicCard/TopicDetailPanel 统一 |

### 需要后端支持（后续 batch）

| ID | 差距 | 需要的后端改动 |
|----|------|----------------|
| M3 | newCount badge | topics 查询增加 `new_count` 字段 |
| M6 | 置信度 | 复用 `relevance_score`，前端格式化为百分比 |
| M7 | 来源可信度 | source_groups 增加 `quality_label` |
| M8 | Start Here 推荐理由 | 前端根据 relevance_score 生成理由文案 |
| M11 | 来源 "查看" 按钮 | 纯前端，SourceGroup 展开文章列表 |

---

## 6. 实施分批

### Batch 1: 骨架搭建（核心三栏 + 路由合并）

1. 创建 `TopicWorkspace.tsx`（三栏 Grid + URL→Store 桥梁）
2. 创建 `TopicSidebar.tsx`（状态过滤+重点主题+Footer）
3. 重构 `TopicListPage` → `TopicMain`（去页面壳，中间栏组件）
4. 重构 `TopicDetailPage` → `TopicDetailPanel`（去路由，props 驱动）
5. 更新 `index.tsx` 路由指向 TopicWorkspace
6. 更新 `topicSlice.ts` 新增 `selectTopic` action
7. 更新 `TopicCard.tsx` onClick + selected 高亮
8. 验证: tsc + vitest

**预计**: ~4h（委派给 deep + visual-engineering 并行）

### Batch 2: Mockup 对齐（M2, M4, M5, M9, M10, M12, M14）

1. TopicMain header: Hero Note + 重新分析按钮
2. TopicDetailPanel: 状态 Tag + 重算按钮
3. Recent Changes: "查看证据" 按钮
4. TopicSidebar: "今天有变化" 过滤
5. Tag 颜色统一
6. 工具栏 active 样式
7. i18n keys 补全
8. 验证: tsc + vitest

**预计**: ~2h

### Batch 3: 后端增强（M3, M6, M7, M8, M11）

1. 后端 topics 查询增加 `new_count` + `confidence`
2. 后端 source_groups 增加 `quality_label`
3. 前端 newCount badge + 置信度显示 + 可信度标签
4. Start Here 推荐理由（前端根据 relevance_score 生成）
5. 来源 "查看" 按钮
6. 验证: tsc + cargo check + vitest

**预计**: ~3h

---

## 7. 验证 Checklist

### Batch 1 完成

- [ ] `/local/topics` 渲染三栏布局
- [ ] `/local/topics/:uuid` 同组件，右侧显示详情
- [ ] TopicCard 点击 → URL 变化 + 详情面板更新
- [ ] 浏览器前进/后退正常工作
- [ ] 直接访问 `/local/topics/:uuid` 自动选中+加载详情
- [ ] 无选中时右侧显示占位提示
- [ ] `tsc --noEmit` 0 errors
- [ ] `vitest run` 全部通过

### Batch 2 完成

- [ ] Hero Note 显示
- [ ] 状态过滤全部5种可切换
- [ ] 详情面板显示状态 Tag
- [ ] Recent Changes 有 "查看证据" 按钮
- [ ] 详情面板有 "重算" 按钮
- [ ] Tag 颜色: tracked=accent, discovered=amber, muted=gray
- [ ] 选中卡片 accent border 高亮
- [ ] i18n 中英文 key 完整

### Batch 3 完成

- [ ] 卡片显示 "N 个新变化" badge
- [ ] 卡片显示 "置信度 X%"
- [ ] 来源显示可信度标签
- [ ] Start Here 显示推荐理由
- [ ] 来源有 "查看" 按钮
- [ ] `cargo check` 0 errors
