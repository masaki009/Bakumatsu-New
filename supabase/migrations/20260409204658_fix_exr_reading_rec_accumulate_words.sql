/*
  # exr_reading_rec 修正：語数の正しい加算

  ## 概要
  exr_reading_rec 関数（dateパラメータ版）において、
  s_diaries.ex_reading に加算する値が +1（回数）になっていたのを
  +p_words（語数）に修正します。

  ## 修正内容
  1. `exr_reading_rec(uuid, text, date, integer, integer, boolean)` を修正
     - ex_reading テーブル：ON CONFLICT 時に words を加算（上書きではなく）
     - s_diaries テーブル：ex_reading += p_words（語数加算）
     - vital 直接更新は不要（trigger_sync_vital_readbooks_on_ex_reading_change が担当）
*/

CREATE OR REPLACE FUNCTION public.exr_reading_rec(
  p_user_id uuid,
  p_email text,
  p_reading_date date,
  p_words integer,
  p_wpm integer,
  p_is_reading_aloud boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ex_reading (user_id, email, reading_date, words, wpm, is_reading_aloud)
  VALUES (p_user_id, p_email, p_reading_date, p_words, p_wpm, p_is_reading_aloud)
  ON CONFLICT (user_id, reading_date)
  DO UPDATE SET
    words = ex_reading.words + EXCLUDED.words,
    wpm = EXCLUDED.wpm,
    is_reading_aloud = EXCLUDED.is_reading_aloud;

  INSERT INTO s_diaries (user_id, email, date, ex_reading)
  VALUES (p_user_id, p_email, p_reading_date, p_words)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    ex_reading = s_diaries.ex_reading + p_words;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exr_reading_rec(uuid, text, date, integer, integer, boolean) TO authenticated;
