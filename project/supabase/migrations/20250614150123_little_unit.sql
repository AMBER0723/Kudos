/*
  # TowerKudos Database Schema

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text, organization name)
      - `short_code` (text, A/B/C)
      - `color` (text, brand color)
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `organization_id` (uuid, references organizations)
      - `position` (text, job title)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
    
    - `compliments`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, references users)
      - `to_user_id` (uuid, references users)
      - `message` (text)
      - `is_anonymous` (boolean, default false)
      - `is_moderated` (boolean, default false)
      - `created_at` (timestamp)
    
    - `badges`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
    
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `badge_id` (uuid, references badges)
      - `earned_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Organization-based access control
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text UNIQUE NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  position text DEFAULT 'Team Member',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create compliments table
CREATE TABLE IF NOT EXISTS compliments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_moderated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'award',
  color text DEFAULT '#F59E0B'
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliments ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;


--  Prevent Self-Compliments (Business Rule)
ALTER TABLE compliments
ADD CONSTRAINT no_self_compliments CHECK (from_user_id <> to_user_id);

-- RLS Policies for organizations
CREATE POLICY "Organizations are viewable by authenticated users"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for users
CREATE POLICY "Users can view all users in the tower"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for compliments
CREATE POLICY "Compliments are viewable by all authenticated users"
  ON compliments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert compliments"
  ON compliments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies for badges
CREATE POLICY "Badges are viewable by authenticated users"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "User badges are viewable by authenticated users"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample organizations
INSERT INTO organizations (name, short_code, color) VALUES
  ('Alpha Corporation', 'A', '#1E40AF'),
  ('Beta Industries', 'B', '#0D9488'),
  ('Gamma Enterprises', 'C', '#F59E0B')
ON CONFLICT (short_code) DO NOTHING;

-- Insert sample badges
INSERT INTO badges (name, description, icon, color) VALUES
  ('Team Hero', 'Received 10+ compliments this month', 'shield', '#F59E0B'),
  ('Rising Star', 'Received first 5 compliments', 'star', '#3B82F6'),
  ('Motivator', 'Given 25+ compliments', 'heart', '#EF4444'),
  ('Collaborator', 'Received compliments from all organizations', 'users', '#8B5CF6'),
  ('Consistent Performer', 'Received compliments 5 weeks in a row', 'trending-up', '#10B981')
ON CONFLICT DO NOTHING;