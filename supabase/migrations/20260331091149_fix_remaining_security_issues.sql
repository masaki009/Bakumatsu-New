/*
  # 残りのセキュリティ問題の修正

  ## 1. 外部キーインデックスの追加
    以下のテーブルの外部キーにインデックスを追加してクエリパフォーマンスを向上：
    - `consultation_conversations.user_id`
    - `consultation_messages.conversation_id`
    - `ex_reading.user_id`
    - `policy_history.email`
    - `user_audio_files.user_id`

  ## 2. 未使用インデックスの削除
    以下のインデックスは実際には使われていないため削除：
    - `idx_learning_logs_user_id`
    - `idx_pre_vital_user_id`

  ## 3. 複数の許可ポリシーの統合
    以下のテーブルで複数のpermissive policiesを1つのrestrictive policyに統合：
    - `admission` テーブル（SELECT）
    - `s_diaries` テーブル（SELECT, UPDATE）

  ## 4. 関数検索パスの修正
    - `exr_reading_rec` 関数に `SET search_path = ''` を設定
*/

-- ============================================================
-- 1. 外部キーインデックスの追加
-- ============================================================

-- consultation_conversations.user_id にインデックスを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'consultation_conversations' 
    AND indexname = 'idx_consultation_conversations_user_id'
  ) THEN
    CREATE INDEX idx_consultation_conversations_user_id ON consultation_conversations(user_id);
  END IF;
END $$;

-- consultation_messages.conversation_id にインデックスを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'consultation_messages' 
    AND indexname = 'idx_consultation_messages_conversation_id'
  ) THEN
    CREATE INDEX idx_consultation_messages_conversation_id ON consultation_messages(conversation_id);
  END IF;
END $$;

-- ex_reading.user_id にインデックスを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ex_reading' 
    AND indexname = 'idx_ex_reading_user_id'
  ) THEN
    CREATE INDEX idx_ex_reading_user_id ON ex_reading(user_id);
  END IF;
END $$;

-- policy_history.email にインデックスを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'policy_history' 
    AND indexname = 'idx_policy_history_email'
  ) THEN
    CREATE INDEX idx_policy_history_email ON policy_history(email);
  END IF;
END $$;

-- user_audio_files.user_id にインデックスを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_audio_files' 
    AND indexname = 'idx_user_audio_files_user_id'
  ) THEN
    CREATE INDEX idx_user_audio_files_user_id ON user_audio_files(user_id);
  END IF;
END $$;

-- ============================================================
-- 2. 未使用インデックスの削除
-- ============================================================

-- learning_logs.user_id のインデックスを削除（実際には使われていない）
DROP INDEX IF EXISTS idx_learning_logs_user_id;

-- pre_vital.user_id のインデックスを削除（実際には使われていない）
DROP INDEX IF EXISTS idx_pre_vital_user_id;

-- ============================================================
-- 3. 複数の許可ポリシーの統合（restrictive policyを使用）
-- ============================================================

-- admissionテーブル: 複数のSELECTポリシーを統合
-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read own admission status" ON admission;
DROP POLICY IF EXISTS "Admins can read all admission records" ON admission;

-- 統合されたポリシーを作成
CREATE POLICY "Users and admins can read admission records"
  ON admission FOR SELECT
  TO authenticated
  USING (
    email = (select auth.jwt()->>'email')
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- s_diariesテーブル: 複数のSELECTポリシーを統合
DROP POLICY IF EXISTS "Users can view own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Admins can view all diary entries" ON s_diaries;

CREATE POLICY "Users and admins can view diary entries"
  ON s_diaries FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- s_diariesテーブル: 複数のUPDATEポリシーを統合
DROP POLICY IF EXISTS "Users can update own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Admins can update all diary entries" ON s_diaries;

CREATE POLICY "Users and admins can update diary entries"
  ON s_diaries FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- 4. 関数検索パスの修正
-- ============================================================

-- exr_reading_rec関数を再作成してセキュアな検索パスを設定
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
SET search_path = ''
AS $$
DECLARE
  v_vital_record RECORD;
BEGIN
  INSERT INTO public.ex_reading (user_id, read_date, book_title, word_count, is_reading_aloud)
  VALUES (p_user_id, p_read_date, p_book_title, p_word_count, p_is_reading_aloud);

  SELECT * INTO v_vital_record
  FROM public.vital
  WHERE user_id = p_user_id AND date = p_read_date;

  IF FOUND THEN
    UPDATE public.vital
    SET 
      extensive_reading = true,
      pet_exp = pet_exp + 10,
      pet_affection = LEAST(pet_affection + 5, 100)
    WHERE user_id = p_user_id AND date = p_read_date;
  ELSE
    INSERT INTO public.vital (
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