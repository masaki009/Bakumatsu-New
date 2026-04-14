/*
  # Fix admin RLS policies on user_notion using SECURITY DEFINER function

  ## Problem
  The admin policies on user_notion use:
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  
  This subquery is also subject to RLS on the users table, which causes
  "permission denied for table users" errors during policy evaluation.

  ## Solution
  1. Create a SECURITY DEFINER helper function `is_admin()` that bypasses RLS
     when checking if the current user is an admin.
  2. Drop the existing broken admin policies on user_notion.
  3. Recreate them using is_admin(auth.uid()).

  ## Changes
  - New function: public.is_admin(uuid) RETURNS boolean SECURITY DEFINER
  - Dropped & recreated: 4 admin policies on user_notion table
*/

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

DROP POLICY IF EXISTS "Admins can select all notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Admins can insert all notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Admins can update all notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Admins can delete all notion settings" ON public.user_notion;

CREATE POLICY "Admins can select all notion settings"
  ON public.user_notion
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert all notion settings"
  ON public.user_notion
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all notion settings"
  ON public.user_notion
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all notion settings"
  ON public.user_notion
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
