/*
  # 認証とユーザー管理の初期設定

  1. 新しいテーブル
    - `users`
      - `id` (uuid, primary key) - auth.users.idと紐づけ
      - `email` (text, unique) - ユーザーのメールアドレス
      - `role` (text) - ユーザーの役割（user/admin）
      - `created_at` (timestamptz) - 作成日時

  2. セキュリティ
    - usersテーブルでRLSを有効化
    - 認証済みユーザーが自分のデータを読み取れるポリシー
    - 認証済みユーザーが自分のデータを更新できるポリシー
    - サービスロールのみが新規ユーザーを挿入できるポリシー

  3. 重要事項
    - ユーザー登録時にauth.usersとusersテーブルを同期する必要があります
    - デフォルトのroleは'user'です
*/

-- usersテーブルを作成
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが自分のデータを読み取れるポリシー
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 認証済みユーザーが自分のデータを更新できるポリシー
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 新規ユーザー挿入はトリガー経由で行うため、認証済みユーザーが自分のレコードを作成できるポリシー
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ユーザー登録時に自動的にusersテーブルにレコードを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersに新しいユーザーが追加されたときにトリガーを実行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();