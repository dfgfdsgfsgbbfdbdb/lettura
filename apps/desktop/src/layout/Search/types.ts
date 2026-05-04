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
