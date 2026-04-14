/*
  # Create Coach Profile Table

  1. 新しいテーブル
    - `coach_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text, user email - auto-populated)
      - `type` (text, チューターの人格スタイル)
      - `character` (text, フィードバックの詳細度)
      - `target` (text, 間違いの指摘方法)
      - `speaking` (text, チューターの話し方スタイル)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - `coach_profiles`テーブルでRLSを有効化
    - ユーザーは自分のプロフィールのみ閲覧可能
    - ユーザーは自分のプロフィールのみ追加可能
    - ユーザーは自分のプロフィールのみ更新可能
    - ユーザーは自分のプロフィールのみ削除可能

  3. 重要な注意事項
    - 各ユーザーは1つのチュータープロフィールのみを持つ
    - 既存のプロフィールがある場合は更新（修正）
    - 新規の場合は追加
*/

CREATE TABLE IF NOT EXISTS coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  type text NOT NULL,
  character text NOT NULL,
  target text NOT NULL,
  speaking text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach profile"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach profile"
  ON coach_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach profile"
  ON coach_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);