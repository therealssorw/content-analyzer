-- ContentLens.ai Supabase Schema
-- Run this in the Supabase SQL editor after creating the project

-- Subscriptions table (linked to Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive', -- active, canceled, past_due
  price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Analysis history table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_preview TEXT, -- first 500 chars
  content_type TEXT, -- tweet, article, auto
  overall_score INTEGER,
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_date ON analyses(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own analyses
CREATE POLICY "Users read own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (used by API routes)
CREATE POLICY "Service insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update subscriptions" ON subscriptions
  FOR UPDATE USING (true);
CREATE POLICY "Service insert analyses" ON analyses
  FOR INSERT WITH CHECK (true);
