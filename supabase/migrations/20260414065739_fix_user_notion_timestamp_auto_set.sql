/*
  # user_notion テーブルの timestamp 自動設定トリガー追加

  ## 概要
  user_notion テーブルへの INSERT/UPDATE 時に created_at / updated_at が
  空文字列 "" や NULL で渡された場合、自動的に now() をセットするトリガーを追加します。

  ## 変更内容
  1. set_user_notion_timestamps() トリガー関数を作成
     - INSERT 時: created_at が NULL → now() をセット
     - INSERT/UPDATE 時: updated_at を常に now() で上書き
  2. user_notion テーブルに BEFORE INSERT OR UPDATE トリガーを設定

  ## 背景
  Supabase Dashboard のテーブルエディタなどから空文字列 "" が
  timestamptz 型カラムに渡されると PostgreSQL がキャスト失敗エラー
  (ERROR: 22007) を返す問題を防ぐためのトリガーです。
*/

CREATE OR REPLACE FUNCTION set_user_notion_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN
      NEW.created_at := now();
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_user_notion_timestamps ON user_notion;

CREATE TRIGGER trg_set_user_notion_timestamps
  BEFORE INSERT OR UPDATE ON user_notion
  FOR EACH ROW
  EXECUTE FUNCTION set_user_notion_timestamps();
