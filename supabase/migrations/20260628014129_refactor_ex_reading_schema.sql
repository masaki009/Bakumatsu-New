-- 1. ex_readingを1ユーザー1行に（重複なし確認済みなので即時追加可能）
ALTER TABLE ex_reading ADD CONSTRAINT ex_reading_user_id_key UNIQUE (user_id);
ALTER TABLE ex_reading DROP COLUMN reading_date;
ALTER TABLE ex_reading DROP COLUMN wpm;
ALTER TABLE ex_reading RENAME COLUMN words TO reading_total;

-- 2. 旧バージョンのexr_reading_rec（book_title/read_dateを使う方）を削除
DROP FUNCTION IF EXISTS public.exr_reading_rec(uuid, date, text, integer, boolean);

-- 3. exr_reading_rec（実際に使われている方）を新スキーマに対応させる
CREATE OR REPLACE FUNCTION public.exr_reading_rec(
  p_user_id uuid,
  p_email text,
  p_reading_date timestamp with time zone,
  p_words integer,
  p_wpm integer,
  p_is_reading_aloud boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record_id uuid;
BEGIN
  INSERT INTO ex_reading (user_id, email, reading_total, is_reading_aloud)
  VALUES (p_user_id, p_email, p_words, p_is_reading_aloud)
  ON CONFLICT (user_id)
  DO UPDATE SET
    reading_total = ex_reading.reading_total + EXCLUDED.reading_total,
    is_reading_aloud = EXCLUDED.is_reading_aloud
  RETURNING id INTO v_record_id;
  UPDATE vital SET readbooks = COALESCE(readbooks, 0) + p_words WHERE user_id = p_user_id;
  INSERT INTO s_diaries (user_id, email, date, ex_reading)
  VALUES (p_user_id, p_email, p_reading_date::date, p_words)
  ON CONFLICT (user_id, date)
  DO UPDATE SET ex_reading = s_diaries.ex_reading + p_words;
  RETURN v_record_id;
END;
$function$;

-- 4. サインアップ時にex_readingの初期行も作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  INSERT INTO public.admission (email, member, created_at)
  VALUES (NEW.email, false, NEW.created_at)
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO public.ex_reading (user_id, email, reading_total)
  VALUES (NEW.id, NEW.email, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
