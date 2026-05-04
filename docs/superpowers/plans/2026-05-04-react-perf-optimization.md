# Lettura 前端性能与架构优化方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 CRITICAL/HIGH 级别的 React 性能问题，拆分超大组件，提升代码可维护性。

**Architecture:** 按 Vercel React Best Practices 和 Composition Patterns 审查结论，分 3 个阶段执行：先修零成本 bug（Toaster 重复、无选择器 store 订阅），再拆分超大组件，最后处理 medium 级优化。每个 Task 独立可验证。

**Tech Stack:** React 18、Zustand、Radix UI、Vite、Tauri v2

**⚠️ 路径约定：** 所有文件路径相对于项目根目录 `lettura/`，前端代码在 `apps/desktop/src/` 下。执行时需注意完整路径前缀。

---

## 文件变更映射

| 操作 | 文件（相对于 `apps/desktop/`） | 职责 |
|---|---|---|
| 修改 | `src/App.tsx` | 删除重复 Toaster |
| 修改 | `src/components/LPodcast/PlayListPopover.tsx` | 添加 useShallow 选择器 |
| 修改 | `src/components/LPodcast/index.tsx` | 添加 useShallow 选择器 |
| 修改 | `src/layout/Intelligence/TodayHeader.tsx` | FeedbackHistoryPopover 添加 useShallow |
| 修改 | `src/components/ArticleView/adapter/Podcast.tsx` | 添加 useShallow + 删除 console.log |
| 拆分 | `src/layout/Search/index.tsx` (867行) | → 拆出 SearchSidebar、SearchFilters、SearchResults、SearchInsightPanel |
| 拆分 | `src/layout/Starred/index.tsx` (641行) | → 拆出 StarredSidebar、StarredStatsPanel、CollectionSuggestion |
| 拆分 | `src/layout/Intelligence/TodayPage.tsx` (307行) | → 拆出 TodayContent、TodayRightPanel |
| 修改 | `src/layout/Article/useArticle.ts` | lodash → 原生实现 |
| 修改 | `src/layout/Article/ArticleCol.tsx` | lodash throttle → 原生/lodash-es |

---

## Phase 1: CRITICAL Bug 修复（零风险，立即执行）

### Task 1: 删除重复 Toaster

**Files:**
- 修改: `src/App.tsx:10,138`
- 参考: `src/index.tsx:31`

- [ ] **Step 1: 删除 App.tsx 中的 Toaster**

`src/App.tsx` 第 10 行删除 `import { Toaster } from "sonner";`，第 138 行删除 `<Toaster />`。

`index.tsx:31` 的 `<Toaster />` 保留不动（它是唯一的实例）。

修改后 App.tsx return 部分变为：
```tsx
return (
  <Theme
    className="w-[100vw] h-[100vh] "
    accentColor={accentColor}
    panelBackground="translucent"
  >
    <ErrorBoundary>
      <div className="h-full max-h-full ">
        <LocalPage />
      </div>
      <DialogAboutApp />
      <OnboardingDialog />
    </ErrorBoundary>
  </Theme>
);
```

- [ ] **Step 2: 验证**

运行 `pnpm build`，确认无编译错误。在浏览器中触发一个 toast 通知（如添加/删除 feed），确认 toast 正常弹出。

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/App.tsx
git commit -m "fix: 移除 App.tsx 中重复的 Toaster 组件"
```

---

### Task 2: 修复 4 个文件 useBearStore() 无选择器问题

**Files:**
- 修改: `src/components/LPodcast/PlayListPopover.tsx:17`
- 修改: `src/components/LPodcast/index.tsx:38`
- 修改: `src/layout/Intelligence/TodayHeader.tsx:121`
- 修改: `src/components/ArticleView/adapter/Podcast.tsx:16`

**原则：** `useBearStore()` 订阅整个 store，任何字段变化都触发 re-render。改为 `useBearStore(useShallow(...))` 只订阅实际使用的字段。

- [ ] **Step 1: 修复 PlayListPopover.tsx**

当前代码 (line 17):
```tsx
const bearStore = useBearStore();
```

改为：
```tsx
import { useShallow } from "zustand/react/shallow";

const { setCurrentTrack, updatePodcastPlayingStatus } = useBearStore(
  useShallow((state) => ({
    setCurrentTrack: state.setCurrentTrack,
    updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
  })),
);
```

同时更新 handleTrackSelect 中的引用：`bearStore.setCurrentTrack` → `setCurrentTrack`，`bearStore.updatePodcastPlayingStatus` → `updatePodcastPlayingStatus`。

- [ ] **Step 2: 修复 LPodcast/index.tsx**

当前代码 (line 38-40):
```tsx
const bearStore = useBearStore();
const { currentTrack, setCurrentTrack, setTracks, podcastPlayingStatus } =
  bearStore;
```

改为：
```tsx
import { useShallow } from "zustand/react/shallow";

const { currentTrack, setCurrentTrack, setTracks, podcastPlayingStatus } =
  useBearStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      setCurrentTrack: state.setCurrentTrack,
      setTracks: state.setTracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
    })),
  );
```

同时更新 line 69 `bearStore.currentTrack` → `currentTrack`。

- [ ] **Step 3: 修复 TodayHeader.tsx FeedbackHistoryPopover**

当前代码 (line 121):
```tsx
const store = useBearStore();
```

FeedbackHistoryPopover 只使用 `feedbackHistory` 和 `fetchFeedbackHistory`，改为：
```tsx
import { useShallow } from "zustand/react/shallow";

const { feedbackHistory, fetchFeedbackHistory } = useBearStore(
  useShallow((state) => ({
    feedbackHistory: state.feedbackHistory,
    fetchFeedbackHistory: state.fetchFeedbackHistory,
  })),
);
```

更新引用：`store.feedbackHistory` → `feedbackHistory`，`store.fetchFeedbackHistory` → `fetchFeedbackHistory`。

- [ ] **Step 4: 修复 Podcast.tsx adapter + 删除 console.log**

当前代码 (line 16):
```tsx
const { addToPlayListAndPlay } = useBearStore();
```

改为：
```tsx
import { useShallow } from "zustand/react/shallow";

const { addToPlayListAndPlay } = useBearStore(
  useShallow((state) => ({
    addToPlayListAndPlay: state.addToPlayListAndPlay,
  })),
);
```

同时删除 line 18-20 的 `console.log` 调试语句。

- [ ] **Step 5: 验证**

运行 `pnpm build`，确认无编译错误。

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/components/LPodcast/PlayListPopover.tsx apps/desktop/src/components/LPodcast/index.tsx apps/desktop/src/layout/Intelligence/TodayHeader.tsx apps/desktop/src/components/ArticleView/adapter/Podcast.tsx
git commit -m "fix: 4个组件的 useBearStore 添加 useShallow 选择器，减少不必要的 re-render"
```

---

## Phase 2: 超大组件拆分（HIGH 优先级）

### Task 3: 拆分 SearchPage (867行 → 5个文件)

**Files:**
- 创建: `src/layout/Search/SearchSidebar.tsx`
- 创建: `src/layout/Search/SearchFilters.tsx`
- 创建: `src/layout/Search/SearchResults.tsx`
- 创建: `src/layout/Search/SearchInsightPanel.tsx`
- 创建: `src/layout/Search/types.ts`
- 修改: `src/layout/Search/index.tsx`

**拆分策略：** SearchPage 当前包含 4 个 UI 区块（侧边栏、搜索栏+过滤、结果列表、右侧面板），每个区块自包含。提取共享类型到 `types.ts`。

- [ ] **Step 1: 创建 types.ts**

提取所有 interface 和常量：
```ts
// src/layout/Search/types.ts
import { ArticleResItem, FeedResItem } from "@/db";

export interface SignalSearchResult {
  signal_title: string;
  summary: string;
  confidence: number;
  source_count: number;
  article_count: number;
  topic_title: string | null;
  topic_uuid: string | null;
}

export interface TopicSearchResult {
  uuid: string;
  title: string;
  description: string;
  article_count: number;
  source_count: number;
  is_following: number;
}

export interface SavedSearch {
  label: string;
  count: number;
}

export const PAGE_SIZE = 20;
export const STORAGE_KEY_SAVED = "lettura_saved_searches";
export const STORAGE_KEY_RECENT = "lettura_recent_searches";
```

保留 `stripHtml`, `formatTime`, `loadFromStorage`, `saveToStorage`, `SearchChip`, `SearchResultCard` 等工具函数/小组件在各自的文件中或放在一个 `utils.ts` 中。

- [ ] **Step 2: 创建 SearchSidebar.tsx**

从 index.tsx line 456-520 提取侧边栏（saved searches + recent searches）。

Props：
```ts
interface SearchSidebarProps {
  savedSearches: SavedSearch[];
  recentSearches: string[];
  onApplySearch: (text: string) => void;
  onRemoveSavedSearch: (label: string) => void;
}
```

骨架（直接搬 index.tsx:456-520 的 JSX，用 props 替换闭包变量）：
```tsx
// src/layout/Search/SearchSidebar.tsx
import { useTranslation } from "react-i18next";
import { Clock, X } from "lucide-react";
import type { SavedSearch } from "./types";

interface SearchSidebarProps {
  savedSearches: SavedSearch[];
  recentSearches: string[];
  onApplySearch: (text: string) => void;
  onRemoveSavedSearch: (label: string) => void;
}

export function SearchSidebar({
  savedSearches,
  recentSearches,
  onApplySearch,
  onRemoveSavedSearch,
}: SearchSidebarProps) {
  const { t } = useTranslation();
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
      {/* saved searches 区块 - 从 index.tsx:457-498 搬运 */}
      {/* recent searches 区块 - 从 index.tsx:499-518 搬运 */}
      {/* onClick 用 onApplySearch / onRemoveSavedSearch 替换闭包引用 */}
    </aside>
  );
}
```

> **实现指引：** 从 index.tsx:456-520 逐行搬运 JSX，将 `applySearch` → `onApplySearch`，`removeSavedSearch` → `onRemoveSavedSearch`。保持所有 className 和 t() 调用不变。

- [ ] **Step 3: 创建 SearchFilters.tsx**

从 index.tsx line 529-648 提取搜索栏 + 过滤 chips + 日期/source 选择器。

Props（17 个 — 全部必要，搜索栏是高频交互组件，每个 prop 对应一个独立交互点）：
```ts
interface SearchFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSaveSearch: () => void;
  isStarred: boolean;
  highSignal: boolean;
  onToggleStarred: () => void;
  onToggleHighSignal: () => void;
  startDate: string;
  endDate: string;
  feedUuid: string;
  feeds: FeedResItem[];
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onFeedChange: (v: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  currentArticle: ArticleResItem | null;
  onCloseArticle: () => void;
}
```

骨架（直接搬 index.tsx:529-648 的 JSX）：
```tsx
// src/layout/Search/SearchFilters.tsx
import { useTranslation } from "react-i18next";
import { Bookmark, Filter, Search, Sparkles, Star, X } from "lucide-react";
import { Button, IconButton, TextField } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import { SearchChip } from "./utils"; // 或保留在 index.tsx

interface SearchFiltersProps {
  // ... 如上 19 个 prop
}

export function SearchFilters({
  query, onQueryChange, onSearch, onSaveSearch,
  isStarred, highSignal, onToggleStarred, onToggleHighSignal,
  startDate, endDate, feedUuid, feeds,
  onStartDateChange, onEndDateChange, onFeedChange,
  hasActiveFilters, onClearFilters,
  currentArticle, onCloseArticle,
}: SearchFiltersProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* header 区块 - 从 index.tsx:530-548 搬运 */}
      {/* 搜索栏 - 从 index.tsx:549-592 搬运 */}
      {/* filter chips + date/source - 从 index.tsx:593-648 搬运 */}
      {/* setQuery/setIsStarred/setHighSignal 等用 props callback 替换 */}
    </>
  );
}
```

> **实现指引：** 从 index.tsx:529-648 搬运。`setQuery(v)` → `onQueryChange(v)`，`runSearch()` → `onSearch()`，`saveCurrentSearch()` → `onSaveSearch()`，`setIsStarred` → `onToggleStarred`，`setHighSignal` → `onToggleHighSignal`，`setStartDate` → `onStartDateChange`，`setEndDate` → `onEndDateChange`，`setFeedUuid` → `onFeedChange`，`setCurrentArticle(null)` → `onCloseArticle()`。`hasActiveFilters` 的清空逻辑（setStartDate("") + setEndDate("")）通过 `onClearFilters` 回调处理。

- [ ] **Step 4: 创建 SearchResults.tsx**

从 index.tsx line 650-765 提取结果列表（信号结果 + topic 结果 + 文章列表 + 加载更多）。

Props：
```ts
interface SearchResultsProps {
  resultList: ArticleResItem[];
  signalResults: SignalSearchResult[];
  topicResults: TopicSearchResult[];
  isFetching: boolean;
  hasMore: boolean;
  query: string;
  selectedFeed?: FeedResItem;
  onLoadMore: () => void;
  onOpenArticle: (article: ArticleResItem) => void;
  onNavigateToToday: () => void;
  onNavigateToTopic: (uuid: string) => void;
}
```

骨架（搬 index.tsx:650-765）：
```tsx
// src/layout/Search/SearchResults.tsx
import { useTranslation } from "react-i18next";
import { FileSearch } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { ArticleResItem, FeedResItem } from "@/db";
import type { SignalSearchResult, TopicSearchResult } from "./types";
import { SearchResultCard } from "./utils"; // 或保留在 index.tsx

interface SearchResultsProps {
  // ... 如上
}

export function SearchResults({
  resultList, signalResults, topicResults,
  isFetching, hasMore, query, selectedFeed,
  onLoadMore, onOpenArticle, onNavigateToToday, onNavigateToTopic,
}: SearchResultsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-auto p-5">
      {/* 结果计数 - 从 index.tsx:651-660 */}
      {/* signal results 区块 - 从 index.tsx:662-690，onClick 用 onNavigateToToday */}
      {/* topic results 区块 - 从 index.tsx:692-715，onClick 用 onNavigateToTopic */}
      {/* loading/empty/result 列表 - 从 index.tsx:717-765 */}
    </div>
  );
}
```

> **实现指引：** 从 index.tsx:650-765 搬运。`navigate(RouteConfig.LOCAL_TODAY)` → `onNavigateToToday()`，`navigate(/local/topics/${uuid})` → `onNavigateToTopic(uuid)`，`setCurrentArticle` → `onOpenArticle`，`() => getList(cursor)` → `onLoadMore`。`SearchResultCard` 如果在 `utils.ts` 就从那 import，否则保留在 index.tsx 从那里 import。

- [ ] **Step 5: 创建 SearchInsightPanel.tsx**

从 index.tsx line 776-862 提取右侧面板（insight + quick filter + related topics）。

Props：
```ts
interface SearchInsightPanelProps {
  searchInsight: { summary: string; details: string[] } | null;
  relatedTopics: TopicItem[];
  isStarred: boolean;
  hasActiveFilters: boolean;
  onToggleStarred: () => void;
  onSetDateRange: (start: string, end: string) => void;
  onClearFilters: () => void;
}
```

骨架（搬 index.tsx:776-862）：
```tsx
// src/layout/Search/SearchInsightPanel.tsx
import { useTranslation } from "react-i18next";
import { Bookmark, Calendar, Rss } from "lucide-react";
import type { TopicItem } from "@/stores/topicSlice";
import { SearchChip } from "./utils";

interface SearchInsightPanelProps {
  // ... 如上
}

export function SearchInsightPanel({
  searchInsight, relatedTopics,
  isStarred, hasActiveFilters,
  onToggleStarred, onSetDateRange, onClearFilters,
}: SearchInsightPanelProps) {
  const { t } = useTranslation();
  return (
    <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
      {/* insight 区块 - 从 index.tsx:777-804 */}
      {/* quick filter 区块 - 从 index.tsx:805-841，date range 逻辑用 onSetDateRange / onClearFilters */}
      {/* related topics 区块 - 从 index.tsx:842-861 */}
    </aside>
  );
}
```

> **实现指引：** 从 index.tsx:776-862 搬运。quick filter 中的日期逻辑（计算 30 天前 → setStartDate/setEndDate）提取到父组件通过 `onSetDateRange` 回调。`setIsStarred` → `onToggleStarred`。`hasActiveFilters` 的清空 → `onClearFilters`。

- [ ] **Step 6: 瘦身 index.tsx**

保留主组件 SearchPage，整合 state + hooks，只做布局编排。目标：~200 行。

- [ ] **Step 7: 验证**

运行 `pnpm build`。手动测试搜索功能：输入关键词 → 过滤 → 查看结果 → 打开文章 → 保存搜索。

- [ ] **Step 8: Commit**

```bash
git add apps/desktop/src/layout/Search/
git commit -m "refactor: 拆分 SearchPage 从 867 行到 5 个模块"
```

---

### Task 4: 拆分 StarredPage (641行 → 4个文件)

**Files:**
- 创建: `src/layout/Starred/StarredSidebar.tsx`
- 创建: `src/layout/Starred/StarredStatsPanel.tsx`
- 创建: `src/layout/Starred/CollectionSuggestion.tsx`
- 修改: `src/layout/Starred/index.tsx`

**拆分策略：** 与 SearchPage 类似的三栏布局。侧边栏（collections + tags）、统计面板（右侧面板的统计+建议+队列）、主组件保留 state + hooks + 布局。

- [ ] **Step 1: 创建 StarredSidebar.tsx**

从 index.tsx line 284-365 提取。

Props：
```ts
interface StarredSidebarProps {
  collections: CollectionItem[];
  tags: TagItem[];
  activeCollection: string | null;
  activeTag: string | null;
  onSelectCollection: (uuid: string | null) => void;
  onSelectTag: (uuid: string | null) => void;
  onSelectAll: () => void;
  totalArticles: number;
}
```

骨架（搬 index.tsx:284-365）：
```tsx
// src/layout/Starred/StarredSidebar.tsx
import { useTranslation } from "react-i18next";
import { Tags } from "lucide-react";
import type { CollectionItem, TagItem } from "@/helpers/starredApi";

interface StarredSidebarProps {
  // ... 如上
}

export function StarredSidebar({
  collections, tags, activeCollection, activeTag,
  onSelectCollection, onSelectTag, onSelectAll, totalArticles,
}: StarredSidebarProps) {
  const { t } = useTranslation();
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
      {/* header - 从 index.tsx:285-292 */}
      {/* collections 列表 - 从 index.tsx:293-340 */}
      {/* tags 列表 - 从 index.tsx:342-363 */}
      {/* onClick: setActiveCollection → onSelectCollection */}
      {/* onClick: setActiveTag → onSelectTag */}
      {/* "全部"按钮 onClick → onSelectAll */}
    </aside>
  );
}
```

> **实现指引：** 从 index.tsx:284-365 搬运。原代码中 `setActiveCollection(uuid)` + `setActiveTag(null)` + `setActiveFilter("all")` 的组合逻辑提取到父组件的 `onSelectCollection` 回调中。`setActiveTag(uuid)` + `setActiveCollection(null)` + `setActiveFilter("all")` 提取到 `onSelectTag`。"全部" 按钮的三个 set 调用提取到 `onSelectAll`。`articles.length` → `totalArticles`。

- [ ] **Step 2: 创建 StarredStatsPanel.tsx**

从 index.tsx line 478-635 提取右侧面板（stats + suggestion + queue）。

Props：
```ts
interface StarredStatsPanelProps {
  articles: ArticleResItem[];
  feedCount: number;
  withNotesCount: number;
  suggestion: { collectionName: string; articleCount: number } | null;
  onOpenArticle: (article: ArticleResItem) => void;
  onCreateCollection: (name: string) => Promise<void>;
}
```

骨架（搬 index.tsx:478-635）：
```tsx
// src/layout/Starred/StarredStatsPanel.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, Bookmark, FolderPlus } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { ArticleResItem } from "@/db";
import { CollectionSuggestion } from "./CollectionSuggestion";

interface StarredStatsPanelProps {
  // ... 如上
}

export function StarredStatsPanel({
  articles, feedCount, withNotesCount,
  suggestion, onOpenArticle, onCreateCollection,
}: StarredStatsPanelProps) {
  const { t } = useTranslation();
  return (
    <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
      {/* stats 区块 - 从 index.tsx:479-501，grid-cols-2 展示文章数和来源数 */}
      {/* suggestion 区块 - 用 CollectionSuggestion 组件（Step 3） */}
      {/* queue 区块 - 从 index.tsx:614-635，展示最近 3 篇文章 */}
    </aside>
  );
}
```

> **实现指引：** 从 index.tsx:478-635 搬运。stats 区块直接展示 `articles.length` 和 `feedCount`。suggestion 区块委托给 `CollectionSuggestion` 子组件。queue 区块 `setSelectedArticle` → `onOpenArticle`。

- [ ] **Step 3: 提取 CollectionSuggestion.tsx**

从 StarredStatsPanel 中进一步提取创建 collection 的 UI 逻辑（含输入框和按钮），约 80 行。

Props：
```ts
interface CollectionSuggestionProps {
  suggestion: { collectionName: string; articleCount: number } | null;
  withNotesCount: number;
  onCreateCollection: (name: string) => Promise<void>;
}
```

骨架（搬 index.tsx:503-611）：
```tsx
// src/layout/Starred/CollectionSuggestion.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus } from "lucide-react";
import { Button } from "@radix-ui/themes";

interface CollectionSuggestionProps {
  // ... 如上
}

export function CollectionSuggestion({
  suggestion, withNotesCount, onCreateCollection,
}: CollectionSuggestionProps) {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateCollection(newName.trim());
      setShowInput(false);
      setNewName("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
      {/* suggestion ? 有建议内容 : 无建议 */}
      {/* 从 index.tsx:507-611 搬运 */}
      {/* showCollectionInput 状态自管理 */}
      {/* handleCreateCollection → onCreateCollection prop */}
    </div>
  );
}
```

> **实现指引：** 将 index.tsx:503-611 中的 `showCollectionInput`/`newCollectionName`/`isCreatingCollection` 状态和 `handleCreateCollection` 逻辑全部内聚到此组件。原组件通过 `suggestion` prop 区分有建议/无建议两种 UI。

- [ ] **Step 4: 瘦身 index.tsx**

保留 StarredPage 主组件 + state + hooks。目标：~200 行。

- [ ] **Step 5: 验证**

`pnpm build`。测试收藏页：浏览文章 → 按收藏过滤 → 创建 collection → 查看 tag。

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/layout/Starred/
git commit -m "refactor: 拆分 StarredPage 从 641 行到 4 个模块"
```

---

### Task 5: 拆分 TodayPage (307行 → 3个文件)

**Files:**
- 创建: `src/layout/Intelligence/TodayContent.tsx`
- 创建: `src/layout/Intelligence/TodayRightPanel.tsx`
- 修改: `src/layout/Intelligence/TodayPage.tsx`

**拆分策略：** TodayPage 订阅 38 个 store 字段，原因是把 pipeline、signals、overview、inline reading 全混在一个组件。按 UI 区块拆分，每个子组件只订阅自己需要的字段。

- [ ] **Step 1: 创建 TodayRightPanel.tsx**

提取 `renderRightPanelContent()` 逻辑 (line 221-249) 和相关的 inline reading state。

该组件自己用 `useBearStore(useShallow(...))` 订阅：
- `isInlineReading`, `rightPanelExpanded`
- `activeReadingSignalId`, `activeReadingSourceIndex`
- `signalDetails`, `sourceArticleDetail`, `sourceArticleLoading`, `sourceArticleError`
- `activeSourceArticleUuid`
- `startInlineReading`, `closeInlineReading`, `navigateReadingSource`
- `openSourceArticle`, `closeSourceArticle`, `retrySourceArticle`
- `signals`（用于找 activeReadingSignal）
- `overview`, `overviewLoading`, `pipelineStatus`, `pipelineProgress`

骨架（搬 index.tsx:221-249 + 相关事件处理函数）：
```tsx
// src/layout/Intelligence/TodayRightPanel.tsx
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores/index";
import { InlineReader } from "@/components/InlineReader"; // 假设路径
import { EvidencePanel } from "./EvidencePanel"; // 确认实际路径
import { DailyStatus } from "./DailyStatus";
import { NextSteps } from "./NextSteps";
import { RightPanel } from "@/components/RightPanel"; // 确认实际路径

export function TodayRightPanel() {
  const {
    isInlineReading, rightPanelExpanded,
    activeReadingSignalId, activeReadingSourceIndex,
    signalDetails, sourceArticleDetail, sourceArticleLoading, sourceArticleError,
    startInlineReading, closeInlineReading, navigateReadingSource,
    openSourceArticle, retrySourceArticle,
    signals, overview, overviewLoading, pipelineStatus, pipelineProgress,
  } = useBearStore(
    useShallow((state) => ({
      isInlineReading: state.isInlineReading,
      rightPanelExpanded: state.rightPanelExpanded,
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      signalDetails: state.signalDetails,
      sourceArticleDetail: state.sourceArticleDetail,
      sourceArticleLoading: state.sourceArticleLoading,
      sourceArticleError: state.sourceArticleError,
      startInlineReading: state.startInlineReading,
      closeInlineReading: state.closeInlineReading,
      navigateReadingSource: state.navigateReadingSource,
      openSourceArticle: state.openSourceArticle,
      retrySourceArticle: state.retrySourceArticle,
      signals: state.signals,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      pipelineStatus: state.pipelineStatus,
      pipelineProgress: state.pipelineProgress,
    })),
  );

  // 搬运 handleReadingBack, handleReadingNavigate 逻辑
  // 搬运 renderRightPanelContent 逻辑 (原 line 221-249)
  // inline reading 分支: InlineReader
  // 默认分支: EvidencePanel + DailyStatus + NextSteps

  return (
    <RightPanel expanded={rightPanelExpanded}>
      {/* 从 index.tsx:222-249 搬运 */}
    </RightPanel>
  );
}
```

> **实现指引：** 将 index.tsx:130-176 的 `handleReadingBack`、`handleReadingNavigate` 和 line 221-249 的 `renderRightPanelContent` 全部搬入此组件。所有 `store.xxx` 引用改为解构后的局部变量。`currentReadingSource` 和 `activeSources` 的计算逻辑也搬过来（从 `signalDetails` + `activeReadingSignalId` 计算）。

- [ ] **Step 2: 创建 TodayContent.tsx**

提取 `renderEmptyState()` 逻辑 (line 178-219) 和主内容区域渲染。

该组件自己用 `useBearStore(useShallow(...))` 订阅：
- `signals`, `signalsLoading`, `signalsError`
- `aiConfig`, `subscribes`
- `fetchSignals`, `triggerPipeline`
- `updateSettingDialogStatus`
- `overview`, `overviewLoading`, `overviewError`
- `expandedSignalId`, `activeReadingSignalId`, `activeReadingSourceIndex`

骨架（搬 index.tsx:178-296 的主内容区域）：
```tsx
// src/layout/Intelligence/TodayContent.tsx
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores/index";
import { TodayHeader } from "./TodayHeader";
import { PipelineIndicator } from "./PipelineIndicator";
import { TodayOverview } from "./TodayOverview";
import { SignalList } from "./SignalList";
import { TodayEmptyState } from "./TodayEmptyState";
import { Loader2 } from "lucide-react";
import { Flex } from "@radix-ui/themes";

export function TodayContent() {
  const {
    signals, signalsLoading, signalsError,
    aiConfig, subscribes,
    fetchSignals, triggerPipeline,
    updateSettingDialogStatus,
    overview, overviewLoading, overviewError,
    activeReadingSignalId, activeReadingSourceIndex,
    pipelineStatus, pipelineStage, pipelineProgress, pipelineError, lastUpdated,
    startInlineReading,
  } = useBearStore(
    useShallow((state) => ({
      signals: state.signals,
      signalsLoading: state.signalsLoading,
      signalsError: state.signalsError,
      aiConfig: state.aiConfig,
      subscribes: state.subscribes,
      fetchSignals: state.fetchSignals,
      triggerPipeline: state.triggerPipeline,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      overviewError: state.overviewError,
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      pipelineStatus: state.pipelineStatus,
      pipelineStage: state.pipelineStage,
      pipelineProgress: state.pipelineProgress,
      pipelineError: state.pipelineError,
      lastUpdated: state.lastUpdated,
      startInlineReading: state.startInlineReading,
    })),
  );

  const hasApiKey = aiConfig?.api_key !== undefined && aiConfig?.api_key !== "";
  const hasSubscriptions = subscribes && subscribes.length > 0;
  const hasSignals = signals && signals.length > 0;

  // 搬运 renderEmptyState 逻辑 (原 line 178-219)
  // 搬运 handleInlineRead 逻辑

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <TodayHeader pipelineStatus={pipelineStatus} lastUpdated={lastUpdated} ... />
      <PipelineIndicator status={pipelineStatus} ... />
      {/* 从 index.tsx:273-296 搬运条件渲染 */}
      {/* signalsError → TodayEmptyState type="load_error" */}
      {/* signalsLoading && !hasSignals → Loader spinner */}
      {/* !hasApiKey || !hasSignals → renderEmptyState() */}
      {/* else → TodayOverview + SignalList */}
    </div>
  );
}
```

> **⚠️ Store 字段重叠说明：** `TodayContent` 和 `TodayRightPanel` 都订阅了 `signals`、`activeReadingSignalId`、`activeReadingSourceIndex` 等字段。这是安全的 — Zustand `useShallow` 对同一 store 实例的去重是自动的，两个组件共享同一个 subscription，不会产生双重渲染。`overview`/`overviewLoading` 也类似。只有 `pipelineStatus`/`pipelineProgress` 等高频变化字段会按需触发各自组件。

- [ ] **Step 3: 瘦身 TodayPage.tsx**

只保留 pipeline event listeners（Tauri IPC）、初始化 fetch、和布局骨架。

目标：~80 行。只订阅 pipeline 相关字段 + fetch actions。

骨架：
```tsx
// src/layout/Intelligence/TodayPage.tsx（瘦身后）
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores/index";
import { TodayContent } from "./TodayContent";
import { TodayRightPanel } from "./TodayRightPanel";

export function TodayPage() {
  const {
    fetchSignals, fetchOverview, fetchAiConfig,
    pipelineStatus, signals,
  } = useBearStore(
    useShallow((state) => ({
      fetchSignals: state.fetchSignals,
      fetchOverview: state.fetchOverview,
      fetchAiConfig: state.fetchAiConfig,
      pipelineStatus: state.pipelineStatus,
      signals: state.signals,
    })),
  );

  useEffect(() => {
    // 搬运 pipeline event listeners（原 line 64-125）
    // listen("pipeline-progress", ...)
    // listen("pipeline-complete", ...)
    // listen("pipeline-error", ...)
    // 初始化 fetch 调用
    fetchAiConfig();
    fetchOverview();
    fetchSignals();
    return () => { /* unlisten 清理 */ };
  }, []);

  const hasSignals = signals && signals.length > 0;

  return (
    <div className="flex h-full w-full bg-[var(--app-canvas)]">
      <TodayContent />
      {(hasSignals /* || isInlineReading */) && <TodayRightPanel />}
    </div>
  );
}
```

> **⚠️ import 检查说明：** `useShallow` 必须从 `zustand/react/shallow` 导入（不是 `zustand/shallow`）。项目中已有 32+ 个文件使用此 import 路径，保持一致。所有从 `@tauri-apps/api/event` 导入的 `listen` 不变。

- [ ] **Step 4: 验证**

`pnpm build`。测试 Today 页：加载 → 查看信号列表 → 展开 inline reading → 触发 pipeline。

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/TodayPage.tsx apps/desktop/src/layout/Intelligence/TodayContent.tsx apps/desktop/src/layout/Intelligence/TodayRightPanel.tsx
git commit -m "refactor: 拆分 TodayPage，按职责分离 store 订阅"
```

---

## Phase 3: MEDIUM 优化（可选排期）

### Task 6: lodash 替换

**Files:**
- 修改: `src/layout/Article/useArticle.ts:6`
- 修改: `src/layout/Article/ArticleCol.tsx:16`

- [ ] **Step 1: useArticle.ts**

当前：
```ts
import { omitBy, isUndefined } from "lodash";
```

改为原生实现：
```ts
function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
```

然后在代码中将 `omitBy(params, isUndefined)` 替换为 `omitUndefined(params)`。

- [ ] **Step 2: ArticleCol.tsx**

当前：
```ts
import { throttle } from "lodash";
```

`lodash-es` 未安装，且方案原则"不新增依赖"，因此保留 `lodash` 的 throttle 不动。Vite + Rollup 对 `import { throttle } from "lodash"` 的 tree-shaking 效果足够好，无需改动。

> ⚠️ 此文件跳过，不做修改。本 Task 只改 useArticle.ts。

- [ ] **Step 3: 验证**

`pnpm build`。测试文章列表页面正常加载。

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/layout/Article/useArticle.ts
git commit -m "refactor: useArticle.ts 移除 lodash omitBy，改用原生实现"
```

---

## 风险与注意事项

1. **不要改变外部行为**：所有修改都是内部重构，功能必须完全不变
2. **保持现有样式**：不改动 className、不调整 UI
3. **不新增依赖**：Phase 3 的 lodash 替换是减依赖
4. **每个 Task 独立提交**：出问题可单独 revert
5. **TopicListPage (424行)** 暂不拆分：结构尚可，优先级低于 Search/Starred/TodayPage

---

## 验收标准

- [ ] `pnpm build` 无错误
- [ ] 所有页面路由正常加载
- [ ] Toaster 只有一个实例，toast 正常弹出
- [ ] 播客播放器正常工作（PlayListPopover、LPodcast）
- [ ] Today 页 pipeline、signals、inline reading 正常
- [ ] Search 搜索、过滤、保存搜索正常
- [ ] Starred 收藏、collection、tag 筛选正常
- [ ] 无 console.log 遗留在 Podcast.tsx
