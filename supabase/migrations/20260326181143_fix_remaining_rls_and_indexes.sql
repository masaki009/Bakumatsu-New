/*
  # 残りのセキュリティ問題の修正

  ## 1. RLSポリシーの最適化（auth.jwt()の最適化）
    以下のテーブルで`auth.jwt()->>'email'`を`(select auth.jwt())->>'email'`に変更:
    - admission (2ポリシー)
    - policy_history (4ポリシー)
    - learning_insight (4ポリシー)

  ## 2. 未使用インデックスの削除
    以下のインデックスはクエリで使用されていないため削除:
    - idx_ex_reading_user_id
    - idx_ex_reading_date
    - idx_user_audio_files_user_id
    - idx_coach_profiles_user_id
    - idx_learning_logs_notion_page
    - idx_policy_history_email
    - idx_self_profiles_user_id
    - idx_learning_insight_email
    - idx_learning_insight_diarydate
    - idx_policy_history_createdat
    - idx_policy_history_isactive
    - idx_learning_insight_userread
    - idx_consultation_conversations_user_id
    - idx_consultation_messages_conversation_id
    
    注: idx_learning_logs_user_id と idx_pre_vital_user_id は外部キー用なので保持

  ## 3. 複数の許可ポリシーについて
    admission、s_diariesテーブルの複数ポリシーは意図的（管理者と一般ユーザーの異なるアクセス）なので変更なし

  ## 注意事項
    - Auth DB接続戦略の変更はSupabaseダッシュボードで実施が必要
    - パスワード漏洩保護の有効化もSupabaseダッシュボードで実施が必要
*/

-- ============================================================
-- 1. RLSポリシーの最適化
-- ============================================================

-- admission テーブル
DROP POLICY IF EXISTS "Users can insert own admission record" ON admission;
DROP POLICY IF EXISTS "Users can read own admission status" ON admission;

CREATE POLICY "Users can insert own admission record"
  ON admission FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can read own admission status"
  ON admission FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt())->>'email');

-- policy_history テーブル
DROP POLICY IF EXISTS "Users can read own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can insert own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can update own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can delete own policy history" ON policy_history;

CREATE POLICY "Users can read own policy history"
  ON policy_history FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can insert own policy history"
  ON policy_history FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can update own policy history"
  ON policy_history FOR UPDATE
  TO authenticated
  USING (email = (select auth.jwt())->>'email')
  WITH CHECK (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can delete own policy history"
  ON policy_history FOR DELETE
  TO authenticated
  USING (email = (select auth.jwt())->>'email');

-- learning_insight テーブル
DROP POLICY IF EXISTS "Users can read own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can insert own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can update own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can delete own learning insights" ON learning_insight;

CREATE POLICY "Users can read own learning insights"
  ON learning_insight FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can insert own learning insights"
  ON learning_insight FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can update own learning insights"
  ON learning_insight FOR UPDATE
  TO authenticated
  USING (email = (select auth.jwt())->>'email')
  WITH CHECK (email = (select auth.jwt())->>'email');

CREATE POLICY "Users can delete own learning insights"
  ON learning_insight FOR DELETE
  TO authenticated
  USING (email = (select auth.jwt())->>'email');

-- ============================================================
-- 2. 未使用インデックスの削除
-- ============================================================

-- ex_reading テーブルのインデックス
DROP INDEX IF EXISTS idx_ex_reading_user_id;
DROP INDEX IF EXISTS idx_ex_reading_date;

-- user_audio_files テーブルのインデックス
DROP INDEX IF EXISTS idx_user_audio_files_user_id;

-- coach_profiles テーブルのインデックス
DROP INDEX IF EXISTS idx_coach_profiles_user_id;

-- learning_logs テーブルのインデックス（notion_page用のみ削除、user_id用は保持）
DROP INDEX IF EXISTS idx_learning_logs_notion_page;

-- policy_history テーブルのインデックス
DROP INDEX IF EXISTS idx_policy_history_email;
DROP INDEX IF EXISTS idx_policy_history_createdat;
DROP INDEX IF EXISTS idx_policy_history_isactive;

-- self_profiles テーブルのインデックス
DROP INDEX IF EXISTS idx_self_profiles_user_id;

-- learning_insight テーブルのインデックス
DROP INDEX IF EXISTS idx_learning_insight_email;
DROP INDEX IF EXISTS idx_learning_insight_diarydate;
DROP INDEX IF EXISTS idx_learning_insight_userread;

-- consultation_conversations テーブルのインデックス
DROP INDEX IF EXISTS idx_consultation_conversations_user_id;

-- consultation_messages テーブルのインデックス
DROP INDEX IF EXISTS idx_consultation_messages_conversation_id;

-- ============================================================
-- 3. 関数の検索パス修正（再確認）
-- ============================================================

-- exr_reading_rec関数の再作成（検索パスを確実に設定）
DROP FUNCTION IF EXISTS exr_reading_rec(uuid, date, text, integer, boolean);

CREATE OR REPLACE FUNCTION exr_reading_rec(
  p_user_id uuid,
  p_read_date date,
  p_book_title text,
  p_word_count integer DEFAULT NULL,
  p_is_reading_aloud boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_vital_record RECORD;
BEGIN
  INSERT INTO ex_reading (user_id, read_date, book_title, word_count, is_reading_aloud)
  VALUES (p_user_id, p_read_date, p_book_title, p_word_count, p_is_reading_aloud);

  SELECT * INTO v_vital_record
  FROM vital
  WHERE user_id = p_user_id AND date = p_read_date;

  IF FOUND THEN
    UPDATE vital
    SET 
      extensive_reading = true,
      pet_exp = pet_exp + 10,
      pet_affection = LEAST(pet_affection + 5, 100)
    WHERE user_id = p_user_id AND date = p_read_date;
  ELSE
    INSERT INTO vital (
      user_id,
      date,
      extensive_reading,
      pet_exp,
      pet_affection
    ) VALUES (
      p_user_id,
      p_read_date,
      true,
      10,
      5
    );
  END IF;
END;
$$;
