/*
  # user_notion テーブルへの管理者ポリシー追加

  ## 概要
  role = 'admin' のユーザーが user_notion テーブルの全行を
  参照・挿入・更新・削除できるポリシーを追加します。

  ## 変更内容
  - 管理者向け SELECT ポリシー
  - 管理者向け INSERT ポリシー
  - 管理者向け UPDATE ポリシー
  - 管理者向け DELETE ポリシー

  ## セキュリティ
  - users テーブルの role = 'admin' を確認してから許可
  - 一般ユーザーへの影響なし
*/

CREATE POLICY "Admins can select all notion settings"
  ON user_notion
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert all notion settings"
  ON user_notion
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all notion settings"
  ON user_notion
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all notion settings"
  ON user_notion
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
