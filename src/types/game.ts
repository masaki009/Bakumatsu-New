export interface PreVital {
  id: string;
  user_id: string;
  email: string;
  energy: number;
  created_at: string;
  updated_at: string;
}

export interface Vital {
  id: string;
  user_id: string;
  email: string;
  energy: number;
  toilet: number;
  sick: number;
  readbooks: number;
  time?: number;
  last_updated_date: string;
}

export interface NotionConfig {
  id: string;
  user_id: string;
  api_key?: string;
  notion_api_key?: string;
  database_id?: string;
  is_active: boolean;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningLog {
  id: string;
  user_id: string;
  activity_type?: string;
  description?: string;
  duration_minutes?: number;
  notion_page_id?: string;
  log_date: string;
  study_hours?: number;
  topics?: string;
  energy_earned?: number;
  books_read?: number;
  synced_at?: string;
  created_at: string;
}

export interface ExReading {
  id: string;
  user_id: string;
  email: string;
  reading_date: string;
  words: number;
  wpm: number;
  created_at: string;
  updated_at: string;
}
