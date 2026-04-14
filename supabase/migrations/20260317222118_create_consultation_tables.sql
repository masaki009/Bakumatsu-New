/*
  # Create Consultation Tables

  1. New Tables
    - `consultation_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - 'general' or 'grammar'
      - `title` (text) - auto-generated from first message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `consultation_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references consultation_conversations)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view and manage their own conversations and messages
*/

-- Create consultation_conversations table
CREATE TABLE IF NOT EXISTS consultation_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('general', 'grammar')),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation_messages table
CREATE TABLE IF NOT EXISTS consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES consultation_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consultation_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for consultation_conversations
CREATE POLICY "Users can view own conversations"
  ON consultation_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON consultation_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON consultation_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON consultation_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for consultation_messages
CREATE POLICY "Users can view messages from own conversations"
  ON consultation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE consultation_conversations.id = consultation_messages.conversation_id
      AND consultation_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON consultation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE consultation_conversations.id = consultation_messages.conversation_id
      AND consultation_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON consultation_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE consultation_conversations.id = consultation_messages.conversation_id
      AND consultation_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE consultation_conversations.id = consultation_messages.conversation_id
      AND consultation_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON consultation_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultation_conversations
      WHERE consultation_conversations.id = consultation_messages.conversation_id
      AND consultation_conversations.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consultation_conversations_user_id ON consultation_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_conversation_id ON consultation_messages(conversation_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_consultation_conversations_updated_at ON consultation_conversations;
CREATE TRIGGER update_consultation_conversations_updated_at
  BEFORE UPDATE ON consultation_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_updated_at();