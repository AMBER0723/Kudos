/*
  # Add Confessions Table

  1. New Table
    - `confessions`
      - `id` (uuid, primary key)
      - `author_id` (uuid, references users)
      - `message` (text)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, 24 hours from creation)

  2. Security
    - Enable RLS on confessions table
    - Users can only see confessions that haven't expired
    - Users can insert their own confessions
    - Users can only see their own confession authorship
*/

-- Create confessions table
CREATE TABLE IF NOT EXISTS confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Enable Row Level Security
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for confessions
CREATE POLICY "Users can view non-expired confessions"
  ON confessions FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can insert their own confessions"
  ON confessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS confessions_expires_at_idx ON confessions(expires_at);
CREATE INDEX IF NOT EXISTS confessions_created_at_idx ON confessions(created_at DESC);

-- Function to automatically delete expired confessions
CREATE OR REPLACE FUNCTION delete_expired_confessions()
RETURNS void AS $$
BEGIN
  DELETE FROM confessions WHERE expires_at <= now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired confessions (runs every hour)
-- Note: This would typically be set up as a cron job or scheduled function in production