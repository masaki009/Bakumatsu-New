/*
  # vitalテーブルの作成

  1. 新規テーブル
    - `vital`
      - `id` (uuid, 主キー) - 自動生成されるユニークID
      - `user_id` (uuid, 外部キー, ユニーク) - auth.usersへの参照（1ユーザー1レコード）
      - `email` (text) - メールアドレス
      - `energy` (integer) - エネルギー値、デフォルト: 100
      - `toilet` (integer) - トイレ回数、デフォルト: 0
      - `sick` (integer) - 病気フラグ、デフォルト: 0
      - `last_updated_date` (date) - 最終更新日、デフォルト: CURRENT_DATE
      - `readbooks` (integer) - 読んだ本の数、デフォルト: 0

  2. セキュリティ
    - RLSを有効化
    - 認証されたユーザーが自分のデータを閲覧できるポリシーを追加
    - 認証されたユーザーが自分のデータを挿入できるポリシーを追加
    - 認証されたユーザーが自分のデータを更新できるポリシーを追加
    - 認証されたユーザーが自分のデータを削除できるポリシーを追加
*/

-- vitalテーブルを作成
CREATE TABLE IF NOT EXISTS vital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  energy integer DEFAULT 100,
  toilet integer DEFAULT 0,
  sick integer DEFAULT 0,
  last_updated_date date DEFAULT CURRENT_DATE,
  readbooks integer DEFAULT 0
);

-- RLSを有効化
ALTER TABLE vital ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー: ユーザーは自分のデータを閲覧可能
CREATE POLICY "Users can view own vital data"
  ON vital
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERTポリシー: ユーザーは自分のデータを挿入可能
CREATE POLICY "Users can insert own vital data"
  ON vital
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATEポリシー: ユーザーは自分のデータを更新可能
CREATE POLICY "Users can update own vital data"
  ON vital
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETEポリシー: ユーザーは自分のデータを削除可能
CREATE POLICY "Users can delete own vital data"
  ON vital
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
