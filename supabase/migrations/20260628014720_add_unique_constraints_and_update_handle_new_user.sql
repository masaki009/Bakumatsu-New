-- 1. UNIQUE制約を安全に追加（既存の場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pre_vital_user_id_key'
  ) THEN
    ALTER TABLE pre_vital ADD CONSTRAINT pre_vital_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vital_user_id_key'
  ) THEN
    ALTER TABLE vital ADD CONSTRAINT vital_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2. handle_new_user に vital・pre_vital の初期行作成を追加
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  INSERT INTO public.admission (email, member, created_at)
  VALUES (NEW.email, false, NEW.created_at)
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO public.ex_reading (user_id, email, reading_total)
  VALUES (NEW.id, NEW.email, 0)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.vital (user_id, email, energy, toilet, sick, readbooks, time, last_updated_date)
  VALUES (NEW.id, NEW.email, 100, 0, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.pre_vital (user_id, email, energy)
  VALUES (NEW.id, NEW.email, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
