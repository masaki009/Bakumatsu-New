/*
  # vitalテーブルのPRIMARY KEYをemailに変更

  ## 概要
  vitalテーブルのPRIMARY KEYをuser_idからemailに変更します。

  ## 変更内容

  ### 1. vitalテーブル
  - PRIMARY KEYをuser_idからemailに変更
  - user_idはFOREIGN KEYとして維持
  - emailをPRIMARY KEYに設定

  ### 2. RLS policies
  - 既存のポリシーを維持
*/

-- vitalテーブルを再作成
DROP TABLE IF EXISTS vital CASCADE;

CREATE TABLE vital (
  email text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time integer DEFAULT 0,
  energy integer DEFAULT 0,
  readbooks integer DEFAULT 0,
  toilet integer DEFAULT 0,
  sick integer DEFAULT 0,
  last_updated_date date
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_vital_user_id ON vital(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_email ON vital(email);
CREATE INDEX IF NOT EXISTS idx_vital_last_updated_date ON vital(last_updated_date);

-- RLSを有効化
ALTER TABLE vital ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can read own vital"
  ON vital
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vital"
  ON vital
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vital"
  ON vital
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vital"
  ON vital
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());