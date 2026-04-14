/*
  # user_notion テーブルの作成

  ## 概要
  ユーザーごとの Notion API キーおよびデータベース ID を管理するテーブルです。

  ## テーブル定義
  - `user_notion`
    - `id` (uuid, 主キー, 自動生成)
    - `email` (text, UNIQUE) - ユーザーのメールアドレス
    - `notion_api_key` (text) - Notion インテグレーションの API キー
    - `db_id_vocab` (text) - 語彙データベースの ID
    - `db_id_chunk` (text) - チャンク読みデータベースの ID
    - `db_id_jtoe` (text) - 日→英変換データベースの ID
    - `db_id_simul` (text) - 同時通訳データベースの ID
    - `created_at` (timestamptz) - 作成日時
    - `updated_at` (timestamptz) - 更新日時

  ## セキュリティ
  - RLS を有効化
  - 認証済みユーザーが自分のメールアドレスに一致するレコードのみ参照・挿入・更新・削除可能
*/

CREATE TABLE IF NOT EXISTS user_notion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  notion_api_key text DEFAULT '',
  db_id_vocab text DEFAULT '',
  db_id_chunk text DEFAULT '',
  db_id_jtoe text DEFAULT '',
  db_id_simul text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_notion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own notion settings"
  ON user_notion
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own notion settings"
  ON user_notion
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own notion settings"
  ON user_notion
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own notion settings"
  ON user_notion
  FOR DELETE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_notion_email ON user_notion (email);
