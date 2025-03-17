-- Update the provider_data table structure
DROP TABLE IF EXISTS provider_data CASCADE;
CREATE TABLE IF NOT EXISTS provider_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES oauth_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  data_type TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update the provider_data_points table structure
DROP TABLE IF EXISTS provider_data_points CASCADE;
CREATE TABLE IF NOT EXISTS provider_data_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_data_id UUID NOT NULL REFERENCES provider_data(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  data_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) policies for new tables
ALTER TABLE provider_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_data_points ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to only access their own data through relations
CREATE POLICY provider_data_policy ON provider_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM oauth_connections
      WHERE oauth_connections.id = provider_data.connection_id
      AND oauth_connections.user_id = auth.uid()
    )
  );
  
CREATE POLICY provider_data_points_policy ON provider_data_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM provider_data
      JOIN oauth_connections ON oauth_connections.id = provider_data.connection_id
      WHERE provider_data.id = provider_data_points.provider_data_id
      AND oauth_connections.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS provider_data_connection_id_idx ON provider_data(connection_id);
CREATE INDEX IF NOT EXISTS provider_data_points_provider_data_id_idx ON provider_data_points(provider_data_id); 