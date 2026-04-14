/*
  # Fix Admission RLS Policies to Use Email Instead of JWT Role

  1. Problem
    - Current policies check `auth.jwt()->>'role'` which is not populated by default in Supabase
    - This causes all queries to fail with permission denied errors

  2. Changes
    - Drop existing SELECT policies
    - Create new policies that check email from JWT (which IS available by default)
    - Check users table for role when admin access is needed

  3. Security
    - Users can read their own admission records based on email
    - Admins are identified by checking the users table role column
*/

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can read all admission records" ON admission;
DROP POLICY IF EXISTS "Users can read own admission status" ON admission;

-- Create new SELECT policy for users to read their own data
CREATE POLICY "Users can read own admission status"
  ON admission FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Create new SELECT policy for admins (check users table for role)
CREATE POLICY "Admins can read all admission records"
  ON admission FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Update other policies to use users table for role checking
DROP POLICY IF EXISTS "Admins can update admission records" ON admission;
DROP POLICY IF EXISTS "Admins can delete admission records" ON admission;

CREATE POLICY "Admins can update admission records"
  ON admission FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete admission records"
  ON admission FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
