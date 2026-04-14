/*
  # ex_readingトリガーを差分更新に修正

  1. 概要
    - ex_readingトリガーを総合計計算から差分更新に変更
    - より効率的で正確なデータ更新を実現

  2. 修正内容
    - INSERT時: NEW.wordsをs_diaries.ex_readingに加算
    - UPDATE時: (NEW.words - OLD.words)をs_diaries.ex_readingに加算
    - DELETE時: OLD.wordsをs_diaries.ex_readingから減算

  3. セキュリティ
    - SECURITY DEFINER関数として実行
    - search_pathを明示的に設定
*/

-- 既存の関数とトリガーを削除
DROP TRIGGER IF EXISTS trigger_sync_s_diaries_on_ex_reading_change ON ex_reading;
DROP FUNCTION IF EXISTS sync_s_diaries_from_ex_reading();

-- ex_reading更新時にs_diaries.ex_readingを差分更新する関数
CREATE OR REPLACE FUNCTION sync_s_diaries_from_ex_reading()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_delta INTEGER;
  v_today_date DATE;
  v_target_user_id UUID;
BEGIN
  -- 今日の日付を取得
  v_today_date := CURRENT_DATE;
  
  -- 処理タイプに応じて差分を計算
  IF (TG_OP = 'INSERT') THEN
    v_delta := NEW.words;
    v_target_user_id := NEW.user_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_delta := NEW.words - OLD.words;
    v_target_user_id := NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    v_delta := -OLD.words;
    v_target_user_id := OLD.user_id;
  END IF;
  
  -- s_diariesテーブルの本日のex_readingカラムを更新
  UPDATE s_diaries
  SET ex_reading = COALESCE(ex_reading, 0) + v_delta
  WHERE user_id = v_target_user_id
    AND date = v_today_date;
  
  -- 戻り値を適切に設定
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ex_readingテーブルにトリガーを作成
CREATE TRIGGER trigger_sync_s_diaries_on_ex_reading_change
AFTER INSERT OR UPDATE OR DELETE ON ex_reading
FOR EACH ROW
EXECUTE FUNCTION sync_s_diaries_from_ex_reading();
