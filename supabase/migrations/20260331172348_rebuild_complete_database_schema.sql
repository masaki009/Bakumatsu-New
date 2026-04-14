/*
  # データベース完全再構築

  ## 新規テーブル
  1. users - ユーザー情報
  2. admission - 入会管理
  3. coach_profiles - コーチプロフィール
  4. self_profiles - 自己プロフィール
  5. s_diaries - 学習日記
  6. pre_vital - 事前バイタル
  7. vital - バイタル記録
  8. ex_reading - 多読記録
  9. policy_history - ポリシー履歴
  10. learning_insights - 学習インサイト
  11. four_pillars_advice - 四柱推命アドバイス
  12. blood_type_advice - 血液型アドバイス
  13. consultation_conversations - 相談会話
  14. consultation_messages - 相談メッセージ
  15. pdf_documents - PDFドキュメント
  16. user_audio_files - ユーザー音声ファイル

  ## セキュリティ
  - 全テーブルにRLS有効化
  - 適切なポリシー設定
  - インデックス追加
*/

-- usersテーブル
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- admissionテーブル
CREATE TABLE IF NOT EXISTS public.admission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT false,
  member text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own admission record" ON public.admission
  FOR INSERT TO authenticated
  WITH CHECK (email = (auth.jwt()->>'email'));

CREATE POLICY "Users and admins can read admission records" ON public.admission
  FOR SELECT TO authenticated
  USING (
    email = (auth.jwt()->>'email') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update admission records" ON public.admission
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete admission records" ON public.admission
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- coach_profilesテーブル
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  specialties text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coach profiles" ON public.coach_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage coach profiles" ON public.coach_profiles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- self_profilesテーブル
CREATE TABLE IF NOT EXISTS public.self_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name text,
  birth date,
  bio text,
  goals text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.self_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own self profile" ON public.self_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert own self profile" ON public.self_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own self profile" ON public.self_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- s_diariesテーブル
CREATE TABLE IF NOT EXISTS public.s_diaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.s_diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and admins can view diary entries" ON public.s_diaries
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own diary entries" ON public.s_diaries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and admins can update diary entries" ON public.s_diaries
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own diary entries" ON public.s_diaries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- pre_vitalテーブル
CREATE TABLE IF NOT EXISTS public.pre_vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  biorhythm_physical integer,
  biorhythm_emotional integer,
  biorhythm_intellectual integer,
  four_pillars jsonb,
  blood_type_fortune text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.pre_vital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pre vital" ON public.pre_vital
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pre vital" ON public.pre_vital
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pre vital" ON public.pre_vital
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- vitalテーブル
CREATE TABLE IF NOT EXISTS public.vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time timestamptz,
  listening_practice boolean DEFAULT false,
  grammar_consultation boolean DEFAULT false,
  general_consultation boolean DEFAULT false,
  extensive_reading boolean DEFAULT false,
  pet_name text,
  pet_type text,
  pet_level integer DEFAULT 1,
  pet_exp integer DEFAULT 0,
  pet_health integer DEFAULT 100,
  pet_happiness integer DEFAULT 100,
  pet_affection integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.vital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vital" ON public.vital
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vital" ON public.vital
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vital" ON public.vital
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ex_readingテーブル
CREATE TABLE IF NOT EXISTS public.ex_reading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  read_date date NOT NULL,
  book_title text NOT NULL,
  word_count integer,
  is_reading_aloud boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ex_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading records" ON public.ex_reading
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reading records" ON public.ex_reading
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ex_reading_user_id ON public.ex_reading(user_id);

-- policy_historyテーブル
CREATE TABLE IF NOT EXISTS public.policy_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  policy_content text NOT NULL,
  agreed_at timestamptz DEFAULT now()
);

ALTER TABLE public.policy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policy history" ON public.policy_history
  FOR SELECT TO authenticated
  USING (email = (auth.jwt()->>'email'));

CREATE POLICY "Users can insert own policy history" ON public.policy_history
  FOR INSERT TO authenticated
  WITH CHECK (email = (auth.jwt()->>'email'));

CREATE INDEX IF NOT EXISTS idx_policy_history_email ON public.policy_history(email);

-- learning_insightsテーブル
CREATE TABLE IF NOT EXISTS public.learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  insight_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning insights" ON public.learning_insights
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert learning insights" ON public.learning_insights
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- four_pillars_adviceテーブル
CREATE TABLE IF NOT EXISTS public.four_pillars_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  advice text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.four_pillars_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own four pillars advice" ON public.four_pillars_advice
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert four pillars advice" ON public.four_pillars_advice
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- blood_type_adviceテーブル
CREATE TABLE IF NOT EXISTS public.blood_type_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  advice text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.blood_type_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blood type advice" ON public.blood_type_advice
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert blood type advice" ON public.blood_type_advice
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- consultation_conversationsテーブル
CREATE TABLE IF NOT EXISTS public.consultation_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_type text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.consultation_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.consultation_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON public.consultation_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON public.consultation_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_consultation_conversations_user_id ON public.consultation_conversations(user_id);

-- consultation_messagesテーブル
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.consultation_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.consultation_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON public.consultation_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultation_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_consultation_messages_conversation_id ON public.consultation_messages(conversation_id);

-- pdf_documentsテーブル
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  category text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pdf documents" ON public.pdf_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pdf documents" ON public.pdf_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- user_audio_filesテーブル
CREATE TABLE IF NOT EXISTS public.user_audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  file_id text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audio files" ON public.user_audio_files
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own audio files" ON public.user_audio_files
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own audio files" ON public.user_audio_files
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_audio_files_user_id ON public.user_audio_files(user_id);

-- トリガー関数: 新規ユーザー登録時にusersテーブルに追加
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- exr_reading_rec関数
CREATE OR REPLACE FUNCTION public.exr_reading_rec(
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