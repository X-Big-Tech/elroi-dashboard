-- Migration to add provider_user_id column to oauth_connections table

-- Check if the provider_user_id column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'oauth_connections' 
        AND column_name = 'provider_user_id'
    ) THEN
        -- Add the column initially as nullable
        ALTER TABLE public.oauth_connections 
        ADD COLUMN provider_user_id TEXT;
        
        -- Set a default value for existing records
        UPDATE public.oauth_connections 
        SET provider_user_id = 'legacy_user_' || id::text;
        
        -- Now make it NOT NULL
        ALTER TABLE public.oauth_connections 
        ALTER COLUMN provider_user_id SET NOT NULL;
        
        RAISE NOTICE 'Added provider_user_id column to oauth_connections table';
    ELSE
        RAISE NOTICE 'provider_user_id column already exists in oauth_connections table';
    END IF;
END
$$; 