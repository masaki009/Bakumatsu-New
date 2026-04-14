/*
  # Admission管理者ポリシーの修正

  1. 変更内容
    - 管理者用のポリシーを修正
    - usersテーブルへの参照を削除し、auth.jwt()を使用するように変更
    - これにより、usersテーブルへの権限エラーを回避

  2. セキュリティ
    - 管理者のみがadmissionレコードを挿入・更新・削除可能
    - roleはauth.jwt()のapp_metadataから取得
*/

-- 既存の管理者ポリシーを削除
DROP POLICY IF EXISTS "Admins can insert admission records" ON admission;
DROP POLICY IF EXISTS "Admins can update admission records" ON admission;
DROP POLICY IF EXISTS "Admins can delete admission records" ON admission;

-- 新しいポリシーを作成（auth.jwt()を使用）
CREATE POLICY "Admins can insert admission records"
  ON admission
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role') = 'admin'
  );

CREATE POLICY "Admins can update admission records"
  ON admission
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'role') = 'admin'
  );

CREATE POLICY "Admins can delete admission records"
  ON admission
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'admin'
  );

-- 管理者が全てのadmissionレコードを読み取れるポリシーを追加
CREATE POLICY "Admins can read all admission records"
  ON admission
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'admin'
  );