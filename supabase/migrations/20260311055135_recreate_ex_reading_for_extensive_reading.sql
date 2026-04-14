/*
  # 多読記録用exReadingテーブルの再作成

  1. 変更内容
    - 既存の`ex_reading`テーブルを削除
    - 多読記録用の新しい`ex_reading`テーブルを作成
  
  2. 新しいテーブル構造
    - `ex_reading` (多読記録)
      - `id` (uuid, primary key)
      - `user_id` (uuid, auth.usersへの参照)
      - `email` (text)
      - `reading_date` (timestamptz, 日付時間)
      - `words` (integer, 語数、毎回の数)
      - `wpm` (integer, words per minute)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. セキュリティ
    - RLSを有効化
    - 認証済みユーザーが自分のデータを読み取り可能
    - 認証済みユーザーが自分のデータを挿入可能
    - 認証済みユーザーが自分のデータを更新可能
    - 認証済みユーザーが自分のデータを削除可能
*/

-- 既存のex_readingテーブルを削除
DROP TABLE IF EXISTS ex_reading CASCADE;

-- 多読記録用の新しいex_readingテーブルを作成
CREATE TABLE IF NOT EXISTS ex_reading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  reading_date timestamptz DEFAULT now(),
  words integer DEFAULT 0,
  wpm integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE ex_reading ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータを読み取り可能
CREATE POLICY "Users can view own reading records"
  ON ex_reading
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータを挿入可能
CREATE POLICY "Users can insert own reading records"
  ON ex_reading
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータを更新可能
CREATE POLICY "Users can update own reading records"
  ON ex_reading
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のデータを削除可能
CREATE POLICY "Users can delete own reading records"
  ON ex_reading
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_ex_reading_user_id ON ex_reading(user_id);
CREATE INDEX IF NOT EXISTS idx_ex_reading_date ON ex_reading(reading_date DESC);
