/*
  # Create Token System Tables

  1. New Tables
    - `model_token_settings`
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key to ai_models)
      - `tokens_required` (integer, required)
      - `description` (text, optional)
      - `created_at` (timestamp)
    
    - `user_tokens`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `balance` (integer, default 0)
      - `updated_at` (timestamp)
    
    - `token_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `model_id` (uuid, foreign key to ai_models)
      - `tokens_deducted` (integer)
      - `type` (text, check constraint)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for full access
*/

-- Token settings per AI model
CREATE TABLE IF NOT EXISTS model_token_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id) ON DELETE CASCADE,
  tokens_required integer NOT NULL,
  description text,
  created_at timestamp DEFAULT now()
);

-- Token balance per user
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT now()
);

-- Optional: track all token events
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  model_id uuid REFERENCES ai_models(id),
  tokens_deducted integer,
  type text CHECK (type IN ('deduction', 'refund', 'manual')),
  created_at timestamp DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE model_token_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for model_token_settings
CREATE POLICY "Admins can manage token settings"
  ON model_token_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read token settings"
  ON model_token_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_tokens
CREATE POLICY "Users can view own token balance"
  ON user_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own token balance"
  ON user_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert user tokens"
  ON user_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all user tokens"
  ON user_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Policies for token_transactions
CREATE POLICY "Users can view own transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON token_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_model_token_settings_model_id ON model_token_settings(model_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_model_id ON token_transactions(model_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

-- Function to automatically create user_tokens record when user signs up
CREATE OR REPLACE FUNCTION handle_new_user_tokens()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (new.id, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_tokens record for new users
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user_tokens();

-- Function to update user_tokens updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tokens_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_tokens
CREATE TRIGGER update_user_tokens_updated_at_trigger
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tokens_updated_at();