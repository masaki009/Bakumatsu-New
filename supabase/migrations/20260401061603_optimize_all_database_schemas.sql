/*
  # データベーススキーマ最適化 - 全テーブル

  ## 概要
  実際のコード使用状況に基づき、全テーブルのスキーマを最適化します。
  - 使用されていないフィールドを削除
  - 必要なフィールドを追加
  - フィールド名とテーブル名の不一致を修正
  - 未使用テーブルを削除

  ## 変更内容

  ### 1. users テーブル
  - created_at カラムを削除（未使用）

  ### 2. admission テーブル
  - id, member, created_at カラムを削除（未使用）
  - email を主キーに変更

  ### 3. coach_profiles テーブル - 完全再設計
  - 旧カラム削除: id, name, bio, specialties, created_at
  - 新カラム追加: email, type, character, target, speaking, updated_at

  ### 4. self_profiles テーブル - 再設計
  - 旧カラム削除: id, bio, goals
  - 新カラム追加: email, line_user_id, current_level, by_when, target, problem, study_type, total_train_number, total_reading_number

  ### 5. s_diaries テーブル - 完全再設計
  - 旧カラム削除: id, content, created_at, updated_at
  - 新カラム追加: email, s_reading, o_speaking, listening, words, ex_reading, time, self_judge, self_topic, one_word

  ### 6. pre_vital テーブル - 完全再設計
  - 旧カラム削除: id, date, biorhythm_*, four_pillars, blood_type_fortune, created_at
  - 新カラム追加: email, energy, updated_at

  ### 7. vital テーブル - 完全再設計
  - 旧カラム削除: id, listening_practice, grammar_consultation, general_consultation, extensive_reading, pet_*, created_at, updated_at
  - 新カラム追加: email, energy, readbooks, toilet, sick, last_updated_date

  ### 8. ex_reading テーブル - 再設計
  - 旧カラム削除: id, book_title, word_count, created_at, read_date
  - 新カラム追加: email, reading_date, words, wpm

  ### 9. learning_insights → learning_insight テーブル - 完全再設計
  - テーブル名変更: learning_insights → learning_insight
  - 全カラムを新スキーマに置き換え

  ### 10. four_pillars_advice テーブル - 再設計
  - 旧カラム削除: id, advice, created_at, date
  - 新カラム追加: advice_date, birth_time, year_pillar, month_pillar, day_pillar, today_pillar, element_balance, today_energy, learning_advice, cautions, lucky_activities

  ### 11. blood_type_advice テーブル - 再設計
  - 旧カラム削除: id, advice, created_at, date
  - 新カラム追加: advice_date, blood_type, week_of_month, week_name, encouragement, learning_tips, lucky_activity

  ### 12. pdf_documents テーブル - 最適化
  - 旧カラム削除: id, uploaded_at
  - 新カラム追加: description, display_order, created_at

  ### 13. 未使用テーブルの削除
  - policy_history
  - consultation_conversations
  - consultation_messages
  - user_audio_files

  ## セキュリティ
  - すべてのテーブルでRLSを有効化
  - 適切なポリシーを設定
*/

-- ============================================================
-- 1. users テーブルの最適化
-- ============================================================

-- created_at カラムを削除
ALTER TABLE users DROP COLUMN IF EXISTS created_at;

-- ============================================================
-- 2. admission テーブルの最適化
-- ============================================================

-- 既存テーブルを削除して再作成
DROP TABLE IF EXISTS admission CASCADE;

CREATE TABLE admission (
  email text PRIMARY KEY,
  is_active boolean DEFAULT false
);

ALTER TABLE admission ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 管理者のみが全てのデータにアクセス可能
CREATE POLICY "Admin can manage all admission records"
  ON admission
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLSポリシー: ユーザーは自分のメールのレコードのみ参照可能
CREATE POLICY "Users can read own admission status"
  ON admission
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- ============================================================
-- 3. coach_profiles テーブルの完全再設計
-- ============================================================

DROP TABLE IF EXISTS coach_profiles CASCADE;

CREATE TABLE coach_profiles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  type text,
  character text,
  target text,
  speaking text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coach profile"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own coach profile"
  ON coach_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own coach profile"
  ON coach_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 4. self_profiles テーブルの再設計
-- ============================================================

DROP TABLE IF EXISTS self_profiles CASCADE;

CREATE TABLE self_profiles (
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email text,
  line_user_id text,
  name text,
  birth date,
  current_level text,
  by_when date,
  target text,
  problem text,
  study_type text,
  total_train_number integer DEFAULT 0,
  total_reading_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE self_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own self profile"
  ON self_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own self profile"
  ON self_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own self profile"
  ON self_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own self profile"
  ON self_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. s_diaries テーブルの完全再設計
-- ============================================================

DROP TABLE IF EXISTS s_diaries CASCADE;

CREATE TABLE s_diaries (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  date date NOT NULL,
  s_reading integer DEFAULT 0,
  o_speaking integer DEFAULT 0,
  listening integer DEFAULT 0,
  words integer DEFAULT 0,
  ex_reading integer DEFAULT 0,
  time integer DEFAULT 0,
  self_judge integer,
  self_topic text,
  one_word text,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE s_diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diaries"
  ON s_diaries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own diaries"
  ON s_diaries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diaries"
  ON s_diaries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own diaries"
  ON s_diaries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_s_diaries_user_date ON s_diaries(user_id, date DESC);

-- ============================================================
-- 6. pre_vital テーブルの完全再設計
-- ============================================================

DROP TABLE IF EXISTS pre_vital CASCADE;

CREATE TABLE pre_vital (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text,
  energy integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pre_vital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pre_vital"
  ON pre_vital
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pre_vital"
  ON pre_vital
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pre_vital"
  ON pre_vital
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own pre_vital"
  ON pre_vital
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 7. vital テーブルの完全再設計
-- ============================================================

DROP TABLE IF EXISTS vital CASCADE;

CREATE TABLE vital (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  date date NOT NULL,
  time timestamptz,
  energy integer DEFAULT 0,
  readbooks integer DEFAULT 0,
  toilet integer DEFAULT 0,
  sick integer DEFAULT 0,
  last_updated_date date,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE vital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vital"
  ON vital
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vital"
  ON vital
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vital"
  ON vital
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vital"
  ON vital
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_vital_user_date ON vital(user_id, date DESC);

-- ============================================================
-- 8. ex_reading テーブルの再設計
-- ============================================================

DROP TABLE IF EXISTS ex_reading CASCADE;

CREATE TABLE ex_reading (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  reading_date date NOT NULL,
  words integer DEFAULT 0,
  wpm integer DEFAULT 0,
  is_reading_aloud boolean DEFAULT false,
  PRIMARY KEY (user_id, reading_date)
);

ALTER TABLE ex_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ex_reading"
  ON ex_reading
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ex_reading"
  ON ex_reading
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ex_reading"
  ON ex_reading
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ex_reading"
  ON ex_reading
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ex_reading_user_date ON ex_reading(user_id, reading_date DESC);

-- ============================================================
-- 9. learning_insights → learning_insight テーブルの完全再設計
-- ============================================================

DROP TABLE IF EXISTS learning_insights CASCADE;

CREATE TABLE learning_insight (
  insightid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  diarydate date NOT NULL,
  sentimentscore numeric,
  topictag text,
  topicrepeatcount integer DEFAULT 0,
  readinggapscore numeric,
  readingcumulative integer DEFAULT 0,
  readingpacestatus text,
  advicetext text,
  advicetype text,
  userread boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_insight ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learning insights"
  ON learning_insight
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own learning insights"
  ON learning_insight
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own learning insights"
  ON learning_insight
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own learning insights"
  ON learning_insight
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_learning_insight_user_date ON learning_insight(user_id, diarydate DESC);
CREATE INDEX IF NOT EXISTS idx_learning_insight_userread ON learning_insight(user_id, userread) WHERE userread = false;

-- ============================================================
-- 10. four_pillars_advice テーブルの再設計
-- ============================================================

DROP TABLE IF EXISTS four_pillars_advice CASCADE;

CREATE TABLE four_pillars_advice (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  advice_date date NOT NULL,
  birth_time text,
  year_pillar text,
  month_pillar text,
  day_pillar text,
  today_pillar text,
  element_balance jsonb,
  today_energy text,
  learning_advice jsonb,
  cautions text,
  lucky_activities jsonb,
  PRIMARY KEY (user_id, advice_date)
);

ALTER TABLE four_pillars_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own four pillars advice"
  ON four_pillars_advice
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own four pillars advice"
  ON four_pillars_advice
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own four pillars advice"
  ON four_pillars_advice
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own four pillars advice"
  ON four_pillars_advice
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_four_pillars_user_date ON four_pillars_advice(user_id, advice_date DESC);

-- ============================================================
-- 11. blood_type_advice テーブルの再設計
-- ============================================================

DROP TABLE IF EXISTS blood_type_advice CASCADE;

CREATE TABLE blood_type_advice (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  advice_date date NOT NULL,
  blood_type text,
  week_of_month integer,
  week_name text,
  encouragement text,
  learning_tips jsonb,
  lucky_activity text,
  PRIMARY KEY (user_id, advice_date)
);

ALTER TABLE blood_type_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own blood type advice"
  ON blood_type_advice
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own blood type advice"
  ON blood_type_advice
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own blood type advice"
  ON blood_type_advice
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own blood type advice"
  ON blood_type_advice
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_blood_type_user_date ON blood_type_advice(user_id, advice_date DESC);

-- ============================================================
-- 12. pdf_documents テーブルの最適化
-- ============================================================

-- 一時テーブルにデータをバックアップ
CREATE TEMP TABLE pdf_documents_backup AS
SELECT title, file_path, category FROM pdf_documents;

DROP TABLE IF EXISTS pdf_documents CASCADE;

CREATE TABLE pdf_documents (
  title text PRIMARY KEY,
  file_path text NOT NULL,
  category text,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- データを復元
INSERT INTO pdf_documents (title, file_path, category, display_order)
SELECT title, file_path, category, 0 FROM pdf_documents_backup;

DROP TABLE pdf_documents_backup;

ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能
CREATE POLICY "All authenticated users can read pdf documents"
  ON pdf_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- 管理者のみが管理可能
CREATE POLICY "Admin can manage pdf documents"
  ON pdf_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pdf_documents_category_order ON pdf_documents(category, display_order);

-- ============================================================
-- 13. 未使用テーブルの削除
-- ============================================================

DROP TABLE IF EXISTS policy_history CASCADE;
DROP TABLE IF EXISTS consultation_messages CASCADE;
DROP TABLE IF EXISTS consultation_conversations CASCADE;
DROP TABLE IF EXISTS user_audio_files CASCADE;

-- ============================================================
-- ストアドプロシージャの更新
-- ============================================================

-- exr_reading_rec プロシージャを新しいスキーマに合わせて更新
CREATE OR REPLACE FUNCTION exr_reading_rec(
  p_user_id uuid,
  p_email text,
  p_reading_date date,
  p_words integer,
  p_wpm integer,
  p_is_reading_aloud boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ex_reading テーブルに挿入または更新
  INSERT INTO ex_reading (user_id, email, reading_date, words, wpm, is_reading_aloud)
  VALUES (p_user_id, p_email, p_reading_date, p_words, p_wpm, p_is_reading_aloud)
  ON CONFLICT (user_id, reading_date)
  DO UPDATE SET
    words = EXCLUDED.words,
    wpm = EXCLUDED.wpm,
    is_reading_aloud = EXCLUDED.is_reading_aloud;

  -- vital テーブルの readbooks を更新
  INSERT INTO vital (user_id, email, date, readbooks, last_updated_date)
  VALUES (p_user_id, p_email, p_reading_date, 1, p_reading_date)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    readbooks = vital.readbooks + 1,
    last_updated_date = p_reading_date;

  -- s_diaries テーブルの ex_reading を更新
  INSERT INTO s_diaries (user_id, email, date, ex_reading)
  VALUES (p_user_id, p_email, p_reading_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    ex_reading = s_diaries.ex_reading + 1;
END;
$$;
