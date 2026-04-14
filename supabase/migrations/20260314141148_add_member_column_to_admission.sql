/*
  # admissionテーブルにmemberカラムを追加

  1. 変更内容
    - admissionテーブルに`member`カラムを追加
    - `member` (text) - メンバー識別情報

  2. 注記
    - 既存データには影響なし（NULLを許可）
*/

-- admissionテーブルにmemberカラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admission' AND column_name = 'member'
  ) THEN
    ALTER TABLE admission ADD COLUMN member text;
  END IF;
END $$;