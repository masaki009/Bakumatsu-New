/*
  # デジタルペット用カラムの追加

  1. learning_logsテーブルへの追加カラム
    - `notion_page_id` (text) - NotionページID
    - `study_hours` (numeric) - 学習時間（小数対応）
    - `topics` (text) - 学習トピック
    - `energy_earned` (integer) - 獲得エネルギー
    - `books_read` (integer) - 読んだ本の数
    - `synced_at` (timestamptz) - 同期日時

  2. notion_configテーブルへの追加カラム
    - `last_sync` (timestamptz) - 最終同期日時
    - `notion_api_key` (text) - Notion APIキー（既存のapi_keyと統合）

  3. 注意事項
    - 既存データに影響を与えないようNULLABLE設定
    - インデックスはパフォーマンス向上のため追加
*/

-- learning_logsテーブルにカラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'notion_page_id'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN notion_page_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'study_hours'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN study_hours numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'topics'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN topics text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'energy_earned'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN energy_earned integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'books_read'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN books_read integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_logs' AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE learning_logs ADD COLUMN synced_at timestamptz DEFAULT now();
  END IF;
END $$;

-- notion_configテーブルにカラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notion_config' AND column_name = 'last_sync'
  ) THEN
    ALTER TABLE notion_config ADD COLUMN last_sync timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notion_config' AND column_name = 'notion_api_key'
  ) THEN
    ALTER TABLE notion_config ADD COLUMN notion_api_key text;
  END IF;
END $$;

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_learning_logs_notion_page ON learning_logs(notion_page_id);
