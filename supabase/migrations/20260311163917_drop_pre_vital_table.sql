/*
  # pre_vitalテーブルの削除

  1. 削除対象
    - `pre_vital`テーブル

  2. 重要事項
    - このテーブルに保存されている全データが削除されます
    - 関連するRLSポリシーも自動的に削除されます
*/

-- pre_vitalテーブルを削除
DROP TABLE IF EXISTS pre_vital CASCADE;
