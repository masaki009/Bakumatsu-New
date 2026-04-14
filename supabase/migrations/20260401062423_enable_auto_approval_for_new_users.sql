/*
  # 新規ユーザーの自動承認を有効化

  ## 概要
  新規ユーザー登録時に自動的にis_activeをtrueに設定し、即座にログイン可能にします。

  ## 変更内容

  ### 1. トリガー関数の更新
  - `handle_new_user()` 関数を更新
  - admissionテーブルのis_activeをtrueに設定

  ## セキュリティ
  - SECURITY DEFINERで関数を実行し、権限を適切に管理
  - 管理者が後からis_activeをfalseに変更することも可能
*/

-- トリガー関数を更新: 新規ユーザーを自動承認
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

  -- admissionテーブルにレコードを作成（is_active = true で自動承認）
  INSERT INTO public.admission (email, is_active)
  VALUES (NEW.email, true)
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;
