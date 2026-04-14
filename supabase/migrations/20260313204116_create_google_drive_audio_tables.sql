/*
  # Create Google Drive Audio File Management Tables

  1. New Tables
    - `google_drive_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, foreign key to auth.users)
      - `access_token` (text) - Encrypted OAuth access token
      - `refresh_token` (text) - Encrypted OAuth refresh token
      - `token_expiry` (timestamptz) - Token expiration timestamp
      - `folder_id` (text) - Google Drive folder ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_audio_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_name` (text) - Audio file name
      - `google_drive_file_id` (text) - Google Drive file ID
      - `file_url` (text) - Direct access URL
      - `file_size` (bigint) - File size in bytes
      - `mime_type` (text) - File MIME type
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data only
    - Users can read, insert, update, and delete their own records

  3. Important Notes
    - Tokens should be encrypted before storage (handled by Edge Functions)
    - Maximum 100 audio files per user (enforced by application logic)
    - Supported MIME types: audio/mpeg, audio/wav, audio/x-m4a, audio/ogg
*/

-- Create google_drive_tokens table
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  folder_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_audio_files table
CREATE TABLE IF NOT EXISTS user_audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  google_drive_file_id text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_audio_files_user_id ON user_audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_tokens_user_id ON google_drive_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_drive_tokens table
CREATE POLICY "Users can view own Google Drive tokens"
  ON google_drive_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Drive tokens"
  ON google_drive_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google Drive tokens"
  ON google_drive_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google Drive tokens"
  ON google_drive_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_audio_files table
CREATE POLICY "Users can view own audio files"
  ON user_audio_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio files"
  ON user_audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio files"
  ON user_audio_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio files"
  ON user_audio_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_google_drive_tokens_updated_at ON google_drive_tokens;
CREATE TRIGGER update_google_drive_tokens_updated_at
  BEFORE UPDATE ON google_drive_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_audio_files_updated_at ON user_audio_files;
CREATE TRIGGER update_user_audio_files_updated_at
  BEFORE UPDATE ON user_audio_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
