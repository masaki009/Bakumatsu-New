/*
  # セキュリティ問題の修正

  ## 1. 外部キーインデックスの追加
    - `learning_logs.user_id`にインデックスを追加
    - `pre_vital.user_id`にインデックスを追加
  
  ## 2. RLSポリシーの最適化
    すべてのテーブルのRLSポリシーで`auth.uid()`を`(select auth.uid())`に変更
    これにより、行ごとに関数を再評価せず、クエリパフォーマンスが向上します
    
    対象テーブル:
    - users
    - notion_config
    - learning_logs
    - google_drive_tokens
    - coach_profiles
    - self_profiles
    - s_diaries
    - ex_reading
    - pre_vital
    - vital
    - user_audio_files
    - admission
    - policy_history
    - learning_insight
    - four_pillars_advice
    - blood_type_advice
    - consultation_conversations
    - consultation_messages
    - pdf_documents
  
  ## 3. 重複ポリシーの削除
    - four_pillars_adviceテーブルの重複したINSERTとSELECTポリシーを削除
  
  ## 4. 関数の検索パス修正
    - すべての関数にセキュアな検索パスを設定
*/

-- ============================================================
-- 1. 外部キーインデックスの追加
-- ============================================================

-- learning_logsテーブルのuser_idにインデックスを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'learning_logs' 
    AND indexname = 'idx_learning_logs_user_id'
  ) THEN
    CREATE INDEX idx_learning_logs_user_id ON learning_logs(user_id);
  END IF;
END $$;

-- pre_vitalテーブルのuser_idにインデックスを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pre_vital' 
    AND indexname = 'idx_pre_vital_user_id'
  ) THEN
    CREATE INDEX idx_pre_vital_user_id ON pre_vital(user_id);
  END IF;
END $$;

-- ============================================================
-- 2. RLSポリシーの最適化（auth.uid()を(select auth.uid())に変更）
-- ============================================================

-- users テーブル
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- notion_config テーブル
DROP POLICY IF EXISTS "Users can read own notion_config" ON notion_config;
DROP POLICY IF EXISTS "Users can insert own notion_config" ON notion_config;
DROP POLICY IF EXISTS "Users can update own notion_config" ON notion_config;
DROP POLICY IF EXISTS "Users can delete own notion_config" ON notion_config;

CREATE POLICY "Users can read own notion_config"
  ON notion_config FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own notion_config"
  ON notion_config FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notion_config"
  ON notion_config FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own notion_config"
  ON notion_config FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- learning_logs テーブル
DROP POLICY IF EXISTS "Users can read own learning_logs" ON learning_logs;
DROP POLICY IF EXISTS "Users can insert own learning_logs" ON learning_logs;
DROP POLICY IF EXISTS "Users can delete own learning_logs" ON learning_logs;

CREATE POLICY "Users can read own learning_logs"
  ON learning_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own learning_logs"
  ON learning_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own learning_logs"
  ON learning_logs FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- google_drive_tokens テーブル
DROP POLICY IF EXISTS "Users can view own Google Drive tokens" ON google_drive_tokens;
DROP POLICY IF EXISTS "Users can insert own Google Drive tokens" ON google_drive_tokens;
DROP POLICY IF EXISTS "Users can update own Google Drive tokens" ON google_drive_tokens;
DROP POLICY IF EXISTS "Users can delete own Google Drive tokens" ON google_drive_tokens;

CREATE POLICY "Users can view own Google Drive tokens"
  ON google_drive_tokens FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own Google Drive tokens"
  ON google_drive_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own Google Drive tokens"
  ON google_drive_tokens FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own Google Drive tokens"
  ON google_drive_tokens FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- coach_profiles テーブル
DROP POLICY IF EXISTS "Users can view own coach profile" ON coach_profiles;
DROP POLICY IF EXISTS "Users can insert own coach profile" ON coach_profiles;
DROP POLICY IF EXISTS "Users can update own coach profile" ON coach_profiles;
DROP POLICY IF EXISTS "Users can delete own coach profile" ON coach_profiles;

CREATE POLICY "Users can view own coach profile"
  ON coach_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own coach profile"
  ON coach_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own coach profile"
  ON coach_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- self_profiles テーブル
DROP POLICY IF EXISTS "Users can view own self profile" ON self_profiles;
DROP POLICY IF EXISTS "Users can insert own self profile" ON self_profiles;
DROP POLICY IF EXISTS "Users can update own self profile" ON self_profiles;
DROP POLICY IF EXISTS "Users can delete own self profile" ON self_profiles;

CREATE POLICY "Users can view own self profile"
  ON self_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own self profile"
  ON self_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own self profile"
  ON self_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own self profile"
  ON self_profiles FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- s_diaries テーブル
DROP POLICY IF EXISTS "Users can view own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Users can insert own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Users can update own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Users can delete own diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Admins can view all diary entries" ON s_diaries;
DROP POLICY IF EXISTS "Admins can update all diary entries" ON s_diaries;

CREATE POLICY "Users can view own diary entries"
  ON s_diaries FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own diary entries"
  ON s_diaries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own diary entries"
  ON s_diaries FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own diary entries"
  ON s_diaries FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all diary entries"
  ON s_diaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all diary entries"
  ON s_diaries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ex_reading テーブル
DROP POLICY IF EXISTS "Users can view own reading records" ON ex_reading;
DROP POLICY IF EXISTS "Users can insert own reading records" ON ex_reading;
DROP POLICY IF EXISTS "Users can update own reading records" ON ex_reading;
DROP POLICY IF EXISTS "Users can delete own reading records" ON ex_reading;

CREATE POLICY "Users can view own reading records"
  ON ex_reading FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own reading records"
  ON ex_reading FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own reading records"
  ON ex_reading FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own reading records"
  ON ex_reading FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- pre_vital テーブル
DROP POLICY IF EXISTS "Users can view own pre_vital data" ON pre_vital;
DROP POLICY IF EXISTS "Users can insert own pre_vital data" ON pre_vital;
DROP POLICY IF EXISTS "Users can update own pre_vital data" ON pre_vital;
DROP POLICY IF EXISTS "Users can delete own pre_vital data" ON pre_vital;

CREATE POLICY "Users can view own pre_vital data"
  ON pre_vital FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own pre_vital data"
  ON pre_vital FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own pre_vital data"
  ON pre_vital FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own pre_vital data"
  ON pre_vital FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- vital テーブル
DROP POLICY IF EXISTS "Users can view own vital data" ON vital;
DROP POLICY IF EXISTS "Users can insert own vital data" ON vital;
DROP POLICY IF EXISTS "Users can update own vital data" ON vital;
DROP POLICY IF EXISTS "Users can delete own vital data" ON vital;

CREATE POLICY "Users can view own vital data"
  ON vital FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own vital data"
  ON vital FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own vital data"
  ON vital FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own vital data"
  ON vital FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- user_audio_files テーブル
DROP POLICY IF EXISTS "Users can view own audio files" ON user_audio_files;
DROP POLICY IF EXISTS "Users can insert own audio files" ON user_audio_files;
DROP POLICY IF EXISTS "Users can update own audio files" ON user_audio_files;
DROP POLICY IF EXISTS "Users can delete own audio files" ON user_audio_files;

CREATE POLICY "Users can view own audio files"
  ON user_audio_files FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own audio files"
  ON user_audio_files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own audio files"
  ON user_audio_files FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own audio files"
  ON user_audio_files FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- admission テーブル
DROP POLICY IF EXISTS "Users can insert own admission record" ON admission;
DROP POLICY IF EXISTS "Users can read own admission status" ON admission;
DROP POLICY IF EXISTS "Admins can read all admission records" ON admission;
DROP POLICY IF EXISTS "Admins can insert admission records" ON admission;
DROP POLICY IF EXISTS "Admins can update admission records" ON admission;
DROP POLICY IF EXISTS "Admins can delete admission records" ON admission;

CREATE POLICY "Users can insert own admission record"
  ON admission FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can read own admission status"
  ON admission FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

CREATE POLICY "Admins can read all admission records"
  ON admission FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update admission records"
  ON admission FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete admission records"
  ON admission FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- policy_history テーブル
DROP POLICY IF EXISTS "Users can read own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can insert own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can update own policy history" ON policy_history;
DROP POLICY IF EXISTS "Users can delete own policy history" ON policy_history;

CREATE POLICY "Users can read own policy history"
  ON policy_history FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can insert own policy history"
  ON policy_history FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can update own policy history"
  ON policy_history FOR UPDATE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'))
  WITH CHECK (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can delete own policy history"
  ON policy_history FOR DELETE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

-- learning_insight テーブル
DROP POLICY IF EXISTS "Users can read own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can insert own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can update own learning insights" ON learning_insight;
DROP POLICY IF EXISTS "Users can delete own learning insights" ON learning_insight;

CREATE POLICY "Users can read own learning insights"
  ON learning_insight FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can insert own learning insights"
  ON learning_insight FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can update own learning insights"
  ON learning_insight FOR UPDATE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'))
  WITH CHECK (email = (select auth.jwt()->>'email'));

CREATE POLICY "Users can delete own learning insights"
  ON learning_insight FOR DELETE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

-- four_pillars_advice テーブル（重複ポリシーの削除）
DROP POLICY IF EXISTS "Users can read own advice" ON four_pillars_advice;
DROP POLICY IF EXISTS "Users can insert own advice" ON four_pillars_advice;
DROP POLICY IF EXISTS "Users can update own advice" ON four_pillars_advice;
DROP POLICY IF EXISTS "Users can view own four pillars advice" ON four_pillars_advice;
DROP POLICY IF EXISTS "Users can insert own four pillars advice" ON four_pillars_advice;

CREATE POLICY "Users can view own four pillars advice"
  ON four_pillars_advice FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own four pillars advice"
  ON four_pillars_advice FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own four pillars advice"
  ON four_pillars_advice FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- blood_type_advice テーブル
DROP POLICY IF EXISTS "Users can view own blood type advice" ON blood_type_advice;
DROP POLICY IF EXISTS "Users can insert own blood type advice" ON blood_type_advice;
DROP POLICY IF EXISTS "Users can update own blood type advice" ON blood_type_advice;

CREATE POLICY "Users can view own blood type advice"
  ON blood_type_advice FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own blood type advice"
  ON blood_type_advice FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own blood type advice"
  ON blood_type_advice FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- consultation_conversations テーブル
DROP POLICY IF EXISTS "Users can view own conversations" ON consultation_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON consultation_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON consultation_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON consultation_conversations;

CREATE POLICY "Users can view own conversations"
  ON consultation_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own conversations"
  ON consultation_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversations"
  ON consultation_conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own conversations"
  ON consultation_conversations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- consultation_messages テーブル
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON consultation_messages;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON consultation_messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON consultation_messages;
DROP POLICY IF EXISTS "Users can delete messages from own conversations" ON consultation_messages;

CREATE POLICY "Users can view messages from own conversations"
  ON consultation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE id = consultation_messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON consultation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE id = consultation_messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON consultation_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE id = consultation_messages.conversation_id
      AND user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE id = consultation_messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON consultation_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE id = consultation_messages.conversation_id
      AND user_id = (select auth.uid())
    )
  );

-- pdf_documents テーブル
DROP POLICY IF EXISTS "Admin users can insert PDF documents" ON pdf_documents;
DROP POLICY IF EXISTS "Admin users can update PDF documents" ON pdf_documents;
DROP POLICY IF EXISTS "Admin users can delete PDF documents" ON pdf_documents;

CREATE POLICY "Admin users can insert PDF documents"
  ON pdf_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update PDF documents"
  ON pdf_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete PDF documents"
  ON pdf_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- 4. 関数の検索パス修正
-- ============================================================

-- update_consultation_updated_at関数
CREATE OR REPLACE FUNCTION update_consultation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- handle_new_user関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  
  INSERT INTO public.admission (email, member, created_at)
  VALUES (NEW.email, false, NEW.created_at)
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- update_updated_at_column関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- exr_reading_rec関数
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
SET search_path = public
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
