/*
  # 新規登録トリガーの修正

  ## 概要
  新規ユーザー登録時に必要なテーブルレコードを自動作成するトリガー関数を再作成します。

  ## 変更内容

  ### 1. トリガー関数の作成
  - `handle_new_user()` 関数を作成
  - 新規ユーザー登録時にusersテーブルとadmissionテーブルにレコードを自動作成

  ### 2. トリガーの設定
  - auth.usersテーブルに新規レコードが追加されたときにトリガーを実行

  ## セキュリティ
  - SECURITY DEFINERで関数を実行し、権限を適切に管理
  - search_pathを明示的に設定してSQLインジェクションを防止
*/

-- トリガー関数: 新規ユーザー登録時にusersテーブルとadmissionテーブルに追加
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- usersテーブルにレコードを作成
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;

  -- admissionテーブルにレコードを作成（デフォルトでis_active = false）
  INSERT INTO public.admission (email, is_active)
  VALUES (NEW.email, false)
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
