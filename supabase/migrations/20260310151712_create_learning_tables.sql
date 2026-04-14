/*
  # 学習関連テーブルの作成

  1. 新しいテーブル
    - `pre_vital`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `session_date` (date) - セッション日
      - `energy_level` (integer) - エネルギーレベル (1-5)
      - `mood` (text) - 気分
      - `notes` (text) - メモ
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

    - `vital`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `session_date` (date) - セッション日
      - `duration_minutes` (integer) - 学習時間（分）
      - `completion_status` (text) - 完了状態
      - `focus_level` (integer) - 集中レベル (1-5)
      - `notes` (text) - メモ
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

    - `notion_config`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `api_key` (text) - Notion APIキー
      - `database_id` (text) - NotionデータベースID
      - `is_active` (boolean) - 有効フラグ
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

    - `ex_reading`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `title` (text) - タイトル
      - `content` (text) - 内容
      - `difficulty_level` (integer) - 難易度 (1-5)
      - `completed` (boolean) - 完了フラグ
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

    - `learning_logs`
      - `id` (uuid, primary key) - 一意のID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `activity_type` (text) - アクティビティタイプ
      - `description` (text) - 説明
      - `duration_minutes` (integer) - 時間（分）
      - `log_date` (date) - ログ日
      - `created_at` (timestamptz) - 作成日時

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - ユーザーは自分のデータのみ読み書き可能
    - 管理者は全データにアクセス可能
*/

-- pre_vitalテーブルを作成
CREATE TABLE IF NOT EXISTS pre_vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date date DEFAULT CURRENT_DATE,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  mood text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- vitalテーブルを作成
CREATE TABLE IF NOT EXISTS vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date date DEFAULT CURRENT_DATE,
  duration_minutes integer DEFAULT 0,
  completion_status text DEFAULT 'in_progress',
  focus_level integer CHECK (focus_level >= 1 AND focus_level <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- notion_configテーブルを作成
CREATE TABLE IF NOT EXISTS notion_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key text,
  database_id text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ex_readingテーブルを作成
CREATE TABLE IF NOT EXISTS ex_reading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- learning_logsテーブルを作成
CREATE TABLE IF NOT EXISTS learning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 0,
  log_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE pre_vital ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_reading ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_logs ENABLE ROW LEVEL SECURITY;

-- pre_vitalのRLSポリシー
CREATE POLICY "Users can read own pre_vital"
  ON pre_vital FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pre_vital"
  ON pre_vital FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pre_vital"
  ON pre_vital FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own pre_vital"
  ON pre_vital FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- vitalのRLSポリシー
CREATE POLICY "Users can read own vital"
  ON vital FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vital"
  ON vital FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vital"
  ON vital FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vital"
  ON vital FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- notion_configのRLSポリシー
CREATE POLICY "Users can read own notion_config"
  ON notion_config FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notion_config"
  ON notion_config FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notion_config"
  ON notion_config FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notion_config"
  ON notion_config FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ex_readingのRLSポリシー
CREATE POLICY "Users can read own ex_reading"
  ON ex_reading FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ex_reading"
  ON ex_reading FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ex_reading"
  ON ex_reading FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ex_reading"
  ON ex_reading FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- learning_logsのRLSポリシー
CREATE POLICY "Users can read own learning_logs"
  ON learning_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own learning_logs"
  ON learning_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own learning_logs"
  ON learning_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 全テーブルのupdated_atを自動更新するトリガー
DROP TRIGGER IF EXISTS update_pre_vital_updated_at ON pre_vital;
CREATE TRIGGER update_pre_vital_updated_at
  BEFORE UPDATE ON pre_vital
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vital_updated_at ON vital;
CREATE TRIGGER update_vital_updated_at
  BEFORE UPDATE ON vital
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notion_config_updated_at ON notion_config;
CREATE TRIGGER update_notion_config_updated_at
  BEFORE UPDATE ON notion_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ex_reading_updated_at ON ex_reading;
CREATE TRIGGER update_ex_reading_updated_at
  BEFORE UPDATE ON ex_reading
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();