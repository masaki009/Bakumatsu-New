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
  INSERT INTO ex_reading (user_id, email, reading_total, is_reading_aloud)
  VALUES (p_user_id, p_email, p_words, p_is_reading_aloud)
  ON CONFLICT (user_id)
  DO UPDATE SET
    reading_total = ex_reading.reading_total + EXCLUDED.reading_total,
    is_reading_aloud = EXCLUDED.is_reading_aloud
  RETURNING id, reading_total INTO v_record_id, v_new_total;
  -- vital.readbooksはex_reading.reading_totalの最新値をそのまま代入する（増分ではなく同期）
  UPDATE vital SET readbooks = v_new_total WHERE user_id = p_user_id;
  INSERT INTO s_diaries (user_id, email, date, ex_reading)
  VALUES (p_user_id, p_email, p_reading_date::date, p_words)
  ON CONFLICT (user_id, date)
  DO UPDATE SET ex_reading = s_diaries.ex_reading + p_words;
  RETURN v_record_id;
END;
$function$;
