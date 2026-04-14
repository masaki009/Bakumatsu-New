/*
  # Create PDF Documents Management System

  1. New Tables
    - `pdf_documents`
      - `id` (uuid, primary key) - Unique identifier for each PDF document
      - `title` (text) - PDF document title
      - `file_path` (text) - Path to the PDF file in the public directory
      - `description` (text) - Brief description of the PDF content
      - `category` (text) - Category for organizing PDFs (e.g., 'manual', 'error_report', 'tutorial')
      - `display_order` (integer) - Order for displaying PDFs in the list
      - `created_at` (timestamptz) - Timestamp when the document was added
      - `updated_at` (timestamptz) - Timestamp when the document was last updated

  2. Security
    - Enable RLS on `pdf_documents` table
    - Allow all authenticated users to read PDF documents
    - Admin users (member = 'admin') can insert, update, or delete PDF documents

  3. Initial Data
    - Insert existing "エラー.pdf" as the first document
*/

CREATE TABLE IF NOT EXISTS pdf_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PDF documents"
  ON pdf_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert PDF documents"
  ON pdf_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admission
      WHERE admission.email = auth.jwt()->>'email'
      AND admission.member = 'admin'
    )
  );

CREATE POLICY "Admin users can update PDF documents"
  ON pdf_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admission
      WHERE admission.email = auth.jwt()->>'email'
      AND admission.member = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admission
      WHERE admission.email = auth.jwt()->>'email'
      AND admission.member = 'admin'
    )
  );

CREATE POLICY "Admin users can delete PDF documents"
  ON pdf_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admission
      WHERE admission.email = auth.jwt()->>'email'
      AND admission.member = 'admin'
    )
  );

-- Insert initial PDF document
INSERT INTO pdf_documents (title, file_path, description, category, display_order)
VALUES ('エラー報告書', '/エラー.pdf', 'システムエラーの詳細報告書', 'error_report', 1)
ON CONFLICT DO NOTHING;