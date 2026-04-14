/*
  # Pre_vitalとVitalテーブルの削除

  1. テーブル削除
    - `pre_vital` テーブルを削除
    - `vital` テーブルを削除
  
  2. 注意事項
    - これらのテーブルはBK digital petで使用されているため削除します
    - CASCADE を使用して関連する外部キー制約も削除します
*/

-- pre_vitalテーブルを削除
DROP TABLE IF EXISTS pre_vital CASCADE;

-- vitalテーブルを削除
DROP TABLE IF EXISTS vital CASCADE;
