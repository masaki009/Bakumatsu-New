/*
  # User Signup Auto-initialization Trigger

  1. Purpose
    - Automatically create records in `pre_vital`, `vital`, and `admission` tables when a new user signs up
    - Ensures data consistency and reduces client-side complexity

  2. Changes
    - Creates a trigger function `handle_new_user_signup` that:
      - Inserts a record into `pre_vital` with initial energy of 0
      - Inserts a record into `vital` with initial values (energy: 100, toilet: 0, sick: 0, readbooks: 0)
      - Inserts a record into `admission` with the user's email in the `member` column and sets `is_active` to true
    - Creates a trigger that executes this function after a new user is inserted into `auth.users`

  3. Security
    - This trigger runs with elevated privileges to insert into protected tables
    - Uses SECURITY DEFINER to ensure it has permission to write to all necessary tables
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into pre_vital table
  INSERT INTO public.pre_vital (user_id, email, energy)
  VALUES (
    NEW.id,
    NEW.email,
    0
  );

  -- Insert into vital table
  INSERT INTO public.vital (user_id, email, energy, toilet, sick, readbooks, last_updated_date)
  VALUES (
    NEW.id,
    NEW.email,
    100,
    0,
    0,
    0,
    CURRENT_DATE
  );

  -- Insert into admission table with member field set to email
  INSERT INTO public.admission (email, member, is_active)
  VALUES (
    NEW.email,
    NEW.email,
    true
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();