/*
  # ex_readingトリガーの修正

  1. 概要
    - 誤って作成したex_reading→vital直接更新トリガーを削除
    - 正しいex_reading→s_diaries.ex_reading更新トリガーを作成

  2. 正しい仕様
    - ex_readingが更新されたとき → s_diariesのex_readingカラムにwordsを加算
    - s_diariesが更新されたとき → ex_readingの総合計をvital.readbooksに反映（既存のトリガー）

  3. 変更内容
    - sync_vital_readbooks_from_ex_reading関数とトリガーを削除
    - sync_s_diaries_from_ex_reading関数とトリガーを作成
*/

-- 誤って作成したトリガーと関数を削除
DROP TRIGGER IF EXISTS trigger_sync_vital_readbooks_on_ex_reading_change ON ex_reading;
DROP FUNCTION IF EXISTS sync_vital_readbooks_from_ex_reading();

-- ex_reading更新時にs_diaries.ex_readingを更新する関数
CREATE OR REPLACE FUNCTION sync_s_diaries_from_ex_reading()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_words INTEGER;
  v_today_date DATE;
BEGIN
  -- 今日の日付を取得
  v_today_date := CURRENT_DATE;
  
  -- ex_readingテーブルから本日のwords総合計を計算
  SELECT COALESCE(SUM(words), 0)
  INTO v_total_words
  FROM ex_reading
  WHERE user_id = NEW.user_id
    AND DATE(created_at) = v_today_date;
  
  -- s_diariesテーブルの本日のex_readingカラムを更新
  UPDATE s_diaries
  SET ex_reading = v_total_words
  WHERE user_id = NEW.user_id
    AND date = v_today_date;
  
  RETURN NEW;
END;
$$;

-- ex_readingテーブルにトリガーを作成
CREATE TRIGGER trigger_sync_s_diaries_on_ex_reading_change
AFTER INSERT OR UPDATE ON ex_reading
FOR EACH ROW
EXECUTE FUNCTION sync_s_diaries_from_ex_reading();
