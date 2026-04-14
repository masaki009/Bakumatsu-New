/*
  # ExrReading_rec プロシージャの作成

  1. 新しいプロシージャ
    - `exr_reading_rec` 関数
      - 多読記録を追加
      - s_diariesのex_readingカウントを加算（該当日のレコードが存在する場合）
  
  2. パラメータ
    - p_user_id (uuid) - ユーザーID
    - p_email (text) - メールアドレス
    - p_reading_date (timestamptz) - 読書日時
    - p_words (integer) - 語数
    - p_wpm (integer) - WPM
  
  3. 処理内容
    - ex_readingテーブルに新しいレコードを挿入
    - 該当日のs_diariesレコードが存在すれば、ex_readingカウントを1加算
    - 新しく作成されたex_readingレコードのIDを返す
*/

-- ExrReading_recプロシージャを作成
CREATE OR REPLACE FUNCTION exr_reading_rec(
  p_user_id uuid,
  p_email text,
  p_reading_date timestamptz,
  p_words integer,
  p_wpm integer
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
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_reading_date,
    p_words,
    p_wpm,
    now(),
    now()
  )
  RETURNING id INTO v_record_id;
  
  -- s_diariesの該当日のレコードが存在すれば、ex_readingカウントを加算
  UPDATE s_diaries
  SET 
    ex_reading = COALESCE(ex_reading, 0) + 1,
    updated_at = now()
  WHERE 
    user_id = p_user_id 
    AND date = v_date;
  
  -- 作成されたレコードのIDを返す
  RETURN v_record_id;
END;
$$;

-- プロシージャの実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION exr_reading_rec(uuid, text, timestamptz, integer, integer) TO authenticated;
