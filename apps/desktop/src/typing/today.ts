export interface SignalSource {
  article_id: number;
  article_uuid: string;
  title: string;
  link: string;
  feed_title: string;
  feed_uuid: string;
  pub_date: string;
  excerpt: string | null;
}

export interface Signal {
  id: number;
  title: string;
  summary: string;
  why_it_matters: string;
  relevance_score: number;
  source_count: number;
  sources: SignalSource[];
  topic_id: number | null;
  topic_title: string | null;
  topic_uuid: string | null;
  created_at: string;
}

export interface SignalDetail {
  signal: Signal;
  all_sources: SignalSource[];
}

export interface AIConfigPublic {
  has_api_key: boolean;
  model: string;
  embedding_model: string;
  base_url: string;
  pipeline_interval_hours: number;
  enable_embedding: boolean;
  enable_auto_pipeline: boolean;
}

export interface TodayOverview {
  summary: string;
  signal_count: number;
  article_count: number;
  generated_at: string;
  is_stale: boolean;
}

export type PipelineStatus = "idle" | "running" | "done" | "error";

export interface FeedbackEntry {
  id: number;
  signal_id: number;
  feedback_type: string;
  comment: string | null;
  create_date: string;
}

export interface ValidateAIConfigResult {
  valid: boolean;
  message: string;
}

export interface PipelineResult {
  run_id: number;
  started: boolean;
}
