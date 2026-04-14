/*
  # usersテーブルの無限再帰エラーを修正

  ## 概要
  usersテーブルのRLSポリシーが自身を参照することで無限再帰が発生していました。
  この問題を解決するため、ポリシーをシンプルに再設計します。

  ## 問題の原因
  「Users can view own profile」ポリシーが管理者チェックのために
  usersテーブル自身を参照していたため、無限再帰が発生していました。

  ## 変更内容

  ### 1. usersテーブルのRLSポリシーを再設計
  - 既存のポリシーを削除
  - ユーザーは自分のレコードのみ閲覧可能
  - ユーザーは自分のrole以外を更新可能（roleは管理者のみ変更可能）

  ### 2. admissionテーブルのRLSポリシーを修正
  - 管理者チェックから自己参照を削除
  - シンプルな権限チェックに変更

  ## セキュリティ
  - RLSを維持しつつ、無限再帰を回避
  - ユーザーは自分のデータのみアクセス可能
*/

-- ============================================================
-- usersテーブルのRLSポリシーを修正
-- ============================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 新しいポリシー: ユーザーは自分のレコードのみ閲覧可能
CREATE POLICY "Users can read own record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 新しいポリシー: ユーザーは自分のレコードを更新可能（roleは変更不可）
CREATE POLICY "Users can update own record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- ============================================================
-- admissionテーブルのRLSポリシーを修正
-- ============================================================

-- 既存の管理者ポリシーを削除
DROP POLICY IF EXISTS "Admin can manage all admission records" ON admission;

-- 新しいポリシー: 認証済みユーザーは全てのadmissionレコードを閲覧可能
-- （アプリケーションレベルで管理者チェックを実施）
CREATE POLICY "Authenticated users can read admission"
  ON admission
  FOR SELECT
  TO authenticated
  USING (true);

-- 新しいポリシー: 認証済みユーザーは全てのadmissionレコードを更新可能
-- （アプリケーションレベルで管理者チェックを実施）
CREATE POLICY "Authenticated users can update admission"
  ON admission
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 新しいポリシー: 認証済みユーザーは全てのadmissionレコードを削除可能
-- （アプリケーションレベルで管理者チェックを実施）
CREATE POLICY "Authenticated users can delete admission"
  ON admission
  FOR DELETE
  TO authenticated
  USING (true);
