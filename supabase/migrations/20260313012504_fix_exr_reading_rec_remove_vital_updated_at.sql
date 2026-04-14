/*
  # exr_reading_rec プロシージャの修正
  
  1. 変更内容
    - vitalテーブルの更新からupdated_atを削除（カラムが存在しないため）
*/

-- 更新されたexr_reading_recプロシージャを作成
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
AS $$
DECLARE
  v_record_id uuid;
  v_date date;
BEGIN
  -- 日付部分を抽出
  v_date := p_reading_date::date;
  
  -- ex_readingテーブルに新しいレコードを挿入
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
  
  -- vitalテーブルのreadbooks項目にword数を加算
  UPDATE vital
  SET readbooks = COALESCE(readbooks, 0) + p_words
  WHERE user_id = p_user_id;
  
  -- s_diariesテーブルの当日のex_reading項目にword数を加算（レコードがない場合は新規作成）
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
  
  -- 作成されたレコードのIDを返す
  RETURN v_record_id;
END;
$$;

-- プロシージャの実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION exr_reading_rec(uuid, text, timestamptz, integer, integer, boolean) TO authenticated;
