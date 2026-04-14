/*
  # ex_reading更新時にvitalテーブルを自動更新

  1. 概要
    - ex_readingテーブルが更新されたタイミングで、vitalテーブルのreadbooksを自動更新
    - ex_readingのwords総合計をvital.readbooksに反映

  2. 作成する関数
    - `sync_vital_readbooks_from_ex_reading()`: ex_reading更新時にvital.readbooksを同期する関数

  3. トリガー
    - ex_readingテーブルのINSERT/UPDATE/DELETE時に自動実行
*/

-- ex_reading更新時にvital.readbooksを同期する関数
CREATE OR REPLACE FUNCTION sync_vital_readbooks_from_ex_reading()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_readbooks INTEGER;
  v_user_email TEXT;
  v_target_user_id UUID;
BEGIN
  -- 処理対象のuser_idを取得（DELETE時はOLD、それ以外はNEW）
  IF TG_OP = 'DELETE' THEN
    v_target_user_id := OLD.user_id;
    v_user_email := OLD.email;
  ELSE
    v_target_user_id := NEW.user_id;
    v_user_email := NEW.email;
  END IF;
  
  -- emailが設定されていない場合はauth.usersから取得
  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_target_user_id;
  END IF;
  
  -- ex_readingテーブルからwords（readbooks）の総合計を計算
  SELECT COALESCE(SUM(words), 0)
  INTO v_total_readbooks
  FROM ex_reading
  WHERE user_id = v_target_user_id;
  
  -- vitalテーブルを更新（存在しない場合は挿入）
  INSERT INTO vital (email, user_id, readbooks, last_updated_date)
  VALUES (
    v_user_email,
    v_target_user_id,
    v_total_readbooks,
    CURRENT_DATE
  )
  ON CONFLICT (email)
  DO UPDATE SET
    readbooks = v_total_readbooks,
    last_updated_date = CURRENT_DATE;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS trigger_sync_vital_readbooks_on_ex_reading_change ON ex_reading;

-- ex_readingテーブルにトリガーを作成
CREATE TRIGGER trigger_sync_vital_readbooks_on_ex_reading_change
AFTER INSERT OR UPDATE OR DELETE ON ex_reading
FOR EACH ROW
EXECUTE FUNCTION sync_vital_readbooks_from_ex_reading();
