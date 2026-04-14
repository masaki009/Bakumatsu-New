/*
  # Fix User Signup Trigger - Add users table insertion

  1. Purpose
    - Update the signup trigger to also create a record in the `users` table
    - This ensures that user role information is properly stored

  2. Changes
    - Modify `handle_new_user_signup` function to insert into `users` table with default role 'user'
    - This allows RLS policies that check `auth.jwt()->>'role'` to work correctly

  3. Security
    - Maintains SECURITY DEFINER to ensure proper permissions
    - Sets default role as 'user' for security
*/

-- Drop and recreate the trigger function with users table insertion
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table with default role
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  );

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
