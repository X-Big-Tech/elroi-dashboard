-- Create oauth_connections table if it doesn't exist
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

-- Create provider_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS provider_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES oauth_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  data_type TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create provider_data_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS provider_data_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_data_id UUID NOT NULL REFERENCES provider_data(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  data_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS policies
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data_points ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to WRITE their own data
CREATE POLICY IF NOT EXISTS oauth_connections_insert_policy ON oauth_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS provider_data_insert_policy ON provider_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM oauth_connections
      WHERE oauth_connections.id = provider_data.connection_id
      AND oauth_connections.user_id = auth.uid()
    )
  );
  
CREATE POLICY IF NOT EXISTS provider_data_points_insert_policy ON provider_data_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_data
      JOIN oauth_connections ON oauth_connections.id = provider_data.connection_id
      WHERE provider_data.id = provider_data_points.provider_data_id
      AND oauth_connections.user_id = auth.uid()
    )
  ); 