/*
  # s_diaries更新時にvitalテーブルを自動更新

  1. 概要
    - s_diariesテーブルが更新されたタイミングで、vitalテーブルを自動的に更新
    - ex_readingのwords総合計をvital.readbooksに反映
    - s_diariesのtime総合計をvital.timeに反映

  2. 作成する関数
    - `sync_vital_from_s_diaries()`: s_diaries更新時にvitalを同期する関数

  3. トリガー
    - s_diariesテーブルのINSERT/UPDATE時に自動実行
*/

-- s_diaries更新時にvitalを同期する関数
CREATE OR REPLACE FUNCTION sync_vital_from_s_diaries()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_readbooks INTEGER;
  v_total_time INTEGER;
  v_user_email TEXT;
BEGIN
  -- 処理対象のemailを取得
  v_user_email := COALESCE(NEW.email, (SELECT email FROM auth.users WHERE id = NEW.user_id));
  
  -- ex_readingテーブルからwords（readbooks）の総合計を計算
  SELECT COALESCE(SUM(words), 0)
  INTO v_total_readbooks
  FROM ex_reading
  WHERE user_id = NEW.user_id;
  
  -- s_diariesテーブルからtimeの総合計を計算
  SELECT COALESCE(SUM(time), 0)
  INTO v_total_time
  FROM s_diaries
  WHERE user_id = NEW.user_id;
  
  -- vitalテーブルを更新（存在しない場合は挿入）
  INSERT INTO vital (email, user_id, readbooks, time, last_updated_date)
  VALUES (
    v_user_email,
    NEW.user_id,
    v_total_readbooks,
    v_total_time,
    CURRENT_DATE
  )
  ON CONFLICT (email)
  DO UPDATE SET
    readbooks = v_total_readbooks,
    time = v_total_time,
    last_updated_date = CURRENT_DATE;
  
  RETURN NEW;
END;
$$;

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS trigger_sync_vital_on_s_diaries_change ON s_diaries;

-- s_diariesテーブルにトリガーを作成
CREATE TRIGGER trigger_sync_vital_on_s_diaries_change
AFTER INSERT OR UPDATE ON s_diaries
FOR EACH ROW
EXECUTE FUNCTION sync_vital_from_s_diaries();
