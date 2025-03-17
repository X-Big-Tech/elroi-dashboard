-- Create a table to store OAuth connections
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create a table to store provider data
CREATE TABLE IF NOT EXISTS provider_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create a table to store individual data points for analytics
CREATE TABLE IF NOT EXISTS provider_data_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Create a table for analytics data
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a table for data sharing preferences
CREATE TABLE IF NOT EXISTS data_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_overview BOOLEAN DEFAULT true,
  share_connections BOOLEAN DEFAULT false,
  share_with_partners BOOLEAN DEFAULT false,
  anonymize_data BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to only access their own data
CREATE POLICY oauth_connections_policy ON oauth_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY provider_data_policy ON provider_data
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY provider_data_points_policy ON provider_data_points
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY analytics_data_policy ON analytics_data
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY data_sharing_preferences_policy ON data_sharing_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS oauth_connections_user_id_idx ON oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS provider_data_user_id_idx ON provider_data(user_id);
CREATE INDEX IF NOT EXISTS provider_data_points_user_id_idx ON provider_data_points(user_id);
CREATE INDEX IF NOT EXISTS provider_data_points_type_idx ON provider_data_points(type);
CREATE INDEX IF NOT EXISTS analytics_data_user_id_idx ON analytics_data(user_id); 