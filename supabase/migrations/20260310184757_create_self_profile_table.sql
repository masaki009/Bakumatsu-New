/*
  # Create Self Profile Table

  1. 新しいテーブル
    - `self_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text, user email - auto-populated)
      - `name` (text, 学習者名)
      - `line_user_id` (text, LINE の user id)
      - `current_level` (text, 学習レベル CEFR: A1, A2, B1, B2, C1, C2)
      - `by_when` (date, 目標日)
      - `target` (text, 目標・どうなりたい)
      - `problem` (text, 課題)
      - `study_type` (text, 学習ペース)
      - `total_train_number` (integer, 表現を増やす、苦手な音を克服する数)
      - `total_reading_number` (integer, 総音読数)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - `self_profiles`テーブルでRLSを有効化
    - ユーザーは自分のプロフィールのみ閲覧可能
    - ユーザーは自分のプロフィールのみ追加可能
    - ユーザーは自分のプロフィールのみ更新可能
    - ユーザーは自分のプロフィールのみ削除可能

  3. 重要な注意事項
    - 各ユーザーは1つのセルフプロフィールのみを持つ
    - 既存のプロフィールがある場合は更新（修正）
    - 新規の場合は追加
*/

CREATE TABLE IF NOT EXISTS self_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  line_user_id text,
  current_level text NOT NULL,
  by_when date,
  target text,
  problem text,
  study_type text,
  total_train_number integer DEFAULT 0,
  total_reading_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE self_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own self profile"
  ON self_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own self profile"
  ON self_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own self profile"
  ON self_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own self profile"
  ON self_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_self_profiles_user_id ON self_profiles(user_id);