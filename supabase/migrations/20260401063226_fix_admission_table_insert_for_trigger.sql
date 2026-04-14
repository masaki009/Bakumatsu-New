/*
  # admissionテーブルのINSERT権限修正

  ## 概要
  トリガー関数がadmissionテーブルに新規レコードを作成できるようにします。

  ## 変更内容

  ### 1. トリガー関数の実行権限を修正
  - handle_new_user関数のsearch_pathを空文字列に設定してセキュリティを強化
  - トリガー関数がRLSをバイパスできるように設定

  ## セキュリティ
  - SECURITY DEFINERで関数を実行
  - search_pathを空文字列に設定してSQLインジェクションを防止
  - トリガー関数のみがadmissionテーブルにINSERT可能
*/

-- トリガー関数を修正してRLSをバイパス
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- usersテーブルにレコードを作成
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;

  -- admissionテーブルにレコードを作成（is_active = true で自動承認）
  INSERT INTO public.admission (email, is_active)
  VALUES (NEW.email, true)
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;
