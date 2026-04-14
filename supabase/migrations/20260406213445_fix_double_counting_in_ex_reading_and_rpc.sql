/*
  # ex_reading二重加算バグの修正

  ## 概要
  多読記録（exr_reading_rec）実行時にs_diaries.ex_readingが二重に加算されるバグを修正します。

  ## 問題の原因
  exr_reading_recプロシージャが実行されると以下の順序で処理が走っていました：
  1. ex_readingにINSERT → trigger_sync_s_diaries_on_ex_reading_changeが発火 → s_diaries.ex_reading += delta
  2. RPCが直接 vital.readbooks += p_words を更新（既にトリガーで正しく更新済み）
  3. RPCが直接 s_diaries.ex_reading += p_words をUPSERT → 1と合わせて二重加算

  ## 修正内容

  ### 1. trigger_sync_s_diaries_on_ex_reading_change の削除
  - ex_reading → s_diaries の差分更新トリガーを削除
  - RPCのUPSERTが正確にs_diaries更新を担当するため不要

  ### 2. exr_reading_rec の修正
  - vital.readbooks の直接UPDATE行を削除
  - trigger_sync_vital_readbooks_on_ex_reading_change が INSERT後に自動で正確な合計値を計算・更新するため不要
  - s_diariesへのUPSERT（加算処理）は維持：新規作成・既存更新の両方を正しく処理

  ## 修正後のデータフロー
  1. exr_reading_rec 呼び出し
  2. ex_readingにINSERT
     → trigger_sync_vital_readbooks_on_ex_reading_change 発火 → vital.readbooks = 全ex_reading合計（正確）
  3. RPCがs_diariesにUPSERT（ex_reading += p_words, レコードなければ新規作成）
     → trigger_sync_vital_on_s_diaries_change 発火 → vital.readbooks, vital.time を再計算（整合性確保）
*/

-- 二重加算の原因となっていたトリガーとその関数を削除
DROP TRIGGER IF EXISTS trigger_sync_s_diaries_on_ex_reading_change ON ex_reading;
DROP FUNCTION IF EXISTS sync_s_diaries_from_ex_reading();

-- exr_reading_recプロシージャを修正（vital直接更新を除去）
CREATE OR REPLACE FUNCTION exr_reading_rec(
  p_user_id uuid,
  p_email text,
  p_reading_date timestamptz,
  p_words integer,
  p_wpm integer,
  p_is_reading_aloud boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
  v_date date;
BEGIN
  v_date := p_reading_date::date;

  INSERT INTO ex_reading (
    user_id,
    email,
    reading_date,
    words,
    wpm,
    is_reading_aloud,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_reading_date,
    p_words,
    p_wpm,
    p_is_reading_aloud,
    now(),
    now()
  )
  RETURNING id INTO v_record_id;

  INSERT INTO s_diaries (
    user_id,
    email,
    date,
    ex_reading,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    v_date,
    p_words,
    now(),
    now()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    ex_reading = s_diaries.ex_reading + p_words,
    updated_at = now();

  RETURN v_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION exr_reading_rec(uuid, text, timestamptz, integer, integer, boolean) TO authenticated;
