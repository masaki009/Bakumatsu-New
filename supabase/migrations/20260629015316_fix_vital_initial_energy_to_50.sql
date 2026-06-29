CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
SET row_security = off
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.pre_vital (user_id, email, energy)
  VALUES (NEW.id, NEW.email, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.vital (user_id, email, energy, toilet, sick, readbooks, last_updated_date, time, vocab_total)
  VALUES (NEW.id, NEW.email, 50, 0, 0, 0, CURRENT_DATE, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.admission (email, member, is_active)
  VALUES (NEW.email, NEW.email, true)
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;
