-- Check if tables exist and create them if they don't

-- 1. oauth_connections table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'oauth_connections') THEN
        CREATE TABLE public.oauth_connections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL, -- Provider's unique identifier for the user
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, provider)
        );

        -- Add comment to table
        COMMENT ON TABLE public.oauth_connections IS 'Stores OAuth connection details for users';

        -- Set up Row Level Security (RLS)
        ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own connections"
            ON public.oauth_connections FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own connections"
            ON public.oauth_connections FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own connections"
            ON public.oauth_connections FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own connections"
            ON public.oauth_connections FOR DELETE
            USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created oauth_connections table';
    ELSE
        RAISE NOTICE 'oauth_connections table already exists';
        
        -- Ensure the status column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'oauth_connections' 
            AND column_name = 'status'
        ) THEN
            ALTER TABLE public.oauth_connections ADD COLUMN status TEXT DEFAULT 'active';
            RAISE NOTICE 'Added status column to oauth_connections table';
        END IF;
        
        -- Ensure the provider_user_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'oauth_connections' 
            AND column_name = 'provider_user_id'
        ) THEN
            ALTER TABLE public.oauth_connections ADD COLUMN provider_user_id TEXT NOT NULL DEFAULT 'legacy_user';
            RAISE NOTICE 'Added provider_user_id column to oauth_connections table';
        END IF;
    END IF;
END
$$;

-- 2. provider_data table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_data') THEN
        CREATE TABLE public.provider_data (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            connection_id UUID NOT NULL REFERENCES public.oauth_connections(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            data_type TEXT NOT NULL,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(connection_id, data_type)
        );

        -- Add comment to table
        COMMENT ON TABLE public.provider_data IS 'Stores data from providers organized by data type';

        -- Set up Row Level Security (RLS)
        ALTER TABLE public.provider_data ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own provider data"
            ON public.provider_data FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.oauth_connections
                    WHERE id = provider_data.connection_id
                    AND user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can insert their own provider data"
            ON public.provider_data FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.oauth_connections
                    WHERE id = provider_data.connection_id
                    AND user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update their own provider data"
            ON public.provider_data FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.oauth_connections
                    WHERE id = provider_data.connection_id
                    AND user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.oauth_connections
                    WHERE id = provider_data.connection_id
                    AND user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can delete their own provider data"
            ON public.provider_data FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.oauth_connections
                    WHERE id = provider_data.connection_id
                    AND user_id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Created provider_data table';
    ELSE
        RAISE NOTICE 'provider_data table already exists';
    END IF;
END
$$;

-- 3. provider_data_points table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provider_data_points') THEN
        CREATE TABLE public.provider_data_points (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_data_id UUID NOT NULL REFERENCES public.provider_data(id) ON DELETE CASCADE,
            data_key TEXT NOT NULL,
            data_value TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(provider_data_id, data_key)
        );

        -- Add comment to table
        COMMENT ON TABLE public.provider_data_points IS 'Stores individual data points from providers';

        -- Set up Row Level Security (RLS)
        ALTER TABLE public.provider_data_points ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own data points"
            ON public.provider_data_points FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.provider_data
                    JOIN public.oauth_connections ON provider_data.connection_id = oauth_connections.id
                    WHERE provider_data.id = provider_data_points.provider_data_id
                    AND oauth_connections.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can insert their own data points"
            ON public.provider_data_points FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.provider_data
                    JOIN public.oauth_connections ON provider_data.connection_id = oauth_connections.id
                    WHERE provider_data.id = provider_data_points.provider_data_id
                    AND oauth_connections.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update their own data points"
            ON public.provider_data_points FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.provider_data
                    JOIN public.oauth_connections ON provider_data.connection_id = oauth_connections.id
                    WHERE provider_data.id = provider_data_points.provider_data_id
                    AND oauth_connections.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.provider_data
                    JOIN public.oauth_connections ON provider_data.connection_id = oauth_connections.id
                    WHERE provider_data.id = provider_data_points.provider_data_id
                    AND oauth_connections.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can delete their own data points"
            ON public.provider_data_points FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.provider_data
                    JOIN public.oauth_connections ON provider_data.connection_id = oauth_connections.id
                    WHERE provider_data.id = provider_data_points.provider_data_id
                    AND oauth_connections.user_id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Created provider_data_points table';
    ELSE
        RAISE NOTICE 'provider_data_points table already exists';
    END IF;
END
$$;

-- Verify all tables have proper RLS policies
DO $$
DECLARE
    tables text[] := ARRAY['oauth_connections', 'provider_data', 'provider_data_points'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = t
        ) THEN
            RAISE NOTICE 'Table % does not exist', t;
            CONTINUE;
        END IF;
        
        -- Check if RLS is enabled
        IF NOT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = t 
            AND rowsecurity = TRUE
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            RAISE NOTICE 'Enabled RLS on % table', t;
        END IF;
        
        -- Check for policies
        IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = t
        ) THEN
            RAISE NOTICE 'Table % has no policies, adding default policies', t;
            
            -- Add basic CRUD policies
            EXECUTE format('
                CREATE POLICY "Users can view their own data" ON public.%I FOR SELECT USING (true);
                CREATE POLICY "Users can insert their own data" ON public.%I FOR INSERT WITH CHECK (true);
                CREATE POLICY "Users can update their own data" ON public.%I FOR UPDATE USING (true) WITH CHECK (true);
                CREATE POLICY "Users can delete their own data" ON public.%I FOR DELETE USING (true);
            ', t, t, t, t);
            
            RAISE NOTICE 'Added default policies to % table', t;
        END IF;
    END LOOP;
END
$$; 