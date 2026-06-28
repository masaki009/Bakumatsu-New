-- 1. vocab_total カラムを追加
ALTER TABLE ex_reading
  ADD COLUMN vocab_total integer NOT NULL DEFAULT 0;

-- 2. is_reading_aloud カラムを削除
ALTER TABLE ex_reading
  DROP COLUMN is_reading_aloud;

-- 3. exr_reading_rec 関数を修正
--    引数 p_is_reading_aloud は互換性のため残し、
--    内部の is_reading_aloud カラム参照のみ削除する
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
  v_new_total integer;
BEGIN
  INSERT INTO ex_reading (user_id, email, reading_total)
  VALUES (p_user_id, p_email, p_words)
  ON CONFLICT (user_id)
  DO UPDATE SET
    reading_total = ex_reading.reading_total + EXCLUDED.reading_total
  RETURNING id, reading_total INTO v_record_id, v_new_total;

  UPDATE vital SET readbooks = v_new_total WHERE user_id = p_user_id;

  INSERT INTO s_diaries (user_id, email, date, ex_reading)
  VALUES (p_user_id, p_email, p_reading_date::date, p_words)
  ON CONFLICT (user_id, date)
  DO UPDATE SET ex_reading = s_diaries.ex_reading + p_words;

  RETURN v_record_id;
END;
$function$;
