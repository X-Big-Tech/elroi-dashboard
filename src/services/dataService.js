import { supabase } from '../lib/supabaseClient';

// This is a simple data service stub that provides mock data
// In a real app, you would fetch this data from Supabase or another API

const dataService = {
  // Get user data overview
  getUserData: async (userId) => {
    console.log('Fetching data for user:', userId);
    
    // Return mock data for demonstration
    return {
      totalConnections: 4,
      activeConnections: 3,
      dataPoints: 1250,
      lastUpdated: new Date().toISOString()
    };
  },
  
  // Get analytics data
  getAnalyticsData: async (userId) => {
    console.log('Fetching analytics for user:', userId);
    
    // Return mock data for charts
    return [
      { name: 'Jan', value: 400 },
      { name: 'Feb', value: 300 },
      { name: 'Mar', value: 600 },
      { name: 'Apr', value: 800 },
      { name: 'May', value: 500 },
      { name: 'Jun', value: 900 },
      { name: 'Jul', value: 1100 }
    ];
  },
  
  // Get connected services data
  getConnectedServices: async (userId) => {
    console.log('Fetching connected services for user:', userId);
    
    // Return mock data for connected services
    return [
      { id: 1, name: 'Google', status: 'active', connectedAt: '2023-01-15' },
      { id: 2, name: 'Spotify', status: 'active', connectedAt: '2023-02-20' },
      { id: 3, name: 'Discord', status: 'active', connectedAt: '2023-03-05' },
      { id: 4, name: 'Twitch', status: 'inactive', connectedAt: '2023-01-10' }
    ];
  },
  
  // Get user's connected accounts
  getConnectedAccounts: async (userId) => {
    try {
      console.log('Getting connected accounts for user:', userId);
      
      // First, try with basic fields only
      const { data, error } = await supabase
        .from('oauth_connections')
        .select(`
          id,
          provider,
          created_at,
          status
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching connected accounts:', error);
        throw error;
      }
      
      console.log('Successfully fetched connections:', data);
      
      // Add a default status for any connections where status is missing
      return (data || []).map(conn => ({
        ...conn,
        status: conn.status || 'active' // Default to 'active' if status is missing
      }));
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      // Return an empty array as fallback
      return [];
    }
  },
  
  // Get provider data for a user
  getProviderData: async (userId, provider) => {
    try {
      // Get the connection
      const { data: connection, error: connectionError } = await supabase
        .from('oauth_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (connectionError || !connection) {
        throw new Error('Connection not found');
      }

      // Get the provider data
      const { data, error } = await supabase
        .from('provider_data')
        .select(`
          id,
          data_type,
          last_updated,
          provider_data_points (
            data_key,
            data_value
          )
        `)
        .eq('connection_id', connection.id);
    
      if (error) throw error;

      // Organize data by data_type
      const organizedData = {};
      for (const item of data || []) {
        const dataPoints = {};
        
        // Convert data points array to object
        for (const point of item.provider_data_points || []) {
          dataPoints[point.data_key] = point.data_value;
        }
        
        organizedData[item.data_type] = {
          id: item.id,
          last_updated: item.last_updated,
          data: dataPoints
        };
      }

      return organizedData;
    } catch (error) {
      console.error('Error fetching provider data:', error);
      throw error;
    }
  },
  
  // Exchange authorization code for access tokens
  async exchangeCodeForTokens(provider, code) {
    console.log(`Exchanging auth code for ${provider} tokens...`);
    console.log(`Auth code length: ${code ? code.length : 0}`);
    
    try {
      const redirectUri = `${window.location.origin}/oauth-callback.html`;
      console.log(`Using redirect URI: ${redirectUri}`);
      
      if (provider === 'google') {
        // For Google, we need to exchange the code for tokens
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          throw new Error('Google OAuth credentials are missing from environment variables');
        }
        
        console.log(`Sending request to Google's token endpoint: https://oauth2.googleapis.com/token`);
        
        // Build token request parameters
        const tokenParams = {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        };
        
        console.log('Google token request parameters:', {
          ...tokenParams,
          client_secret: '******', // Don't log the actual secret
          code: code ? `${code.substring(0, 10)}...` : null,
        });
        
        // In a production app, this token exchange should be done server-side for security
        // We're doing it client-side here for simplicity, but it's not recommended
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(tokenParams),
        });
        
        console.log('Google token response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error(`Google token exchange error (${tokenResponse.status}): ${errorText}`);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('Parsed Google error data:', errorData);
            throw new Error(`Failed to exchange code for Google tokens: ${errorData.error} - ${errorData.error_description || 'No error description'}`);
          } catch (parseError) {
            throw new Error(`Failed to exchange code for Google tokens: ${tokenResponse.statusText} (${tokenResponse.status})`);
          }
        }
        
        const tokenData = await tokenResponse.json();
        console.log('Google token exchange successful:', {
          access_token_length: tokenData.access_token?.length || 0,
          refresh_token_length: tokenData.refresh_token?.length || 0,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope
        });
        
        return {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        };
      } else if (provider === 'spotify') {
        // For Spotify, exchange the authorization code for tokens
        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          throw new Error('Spotify OAuth credentials are missing from environment variables');
        }
        
        console.log(`Using Spotify credentials - Client ID: ${clientId.substring(0, 5)}...`);
        console.log(`Sending request to Spotify's token endpoint: https://accounts.spotify.com/api/token`);
        
        // Spotify requires Basic Authentication for token requests
        const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
        
        // Build token request parameters
        const tokenParams = {
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        };
        
        console.log('Spotify token request parameters:', {
          ...tokenParams,
          code: code ? `${code.substring(0, 10)}...` : null,
        });
        
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          },
          body: new URLSearchParams(tokenParams),
        });
        
        console.log('Spotify token response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error(`Spotify token exchange error (${tokenResponse.status}): ${errorText}`);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('Parsed Spotify error data:', errorData);
            throw new Error(`Failed to exchange Spotify code for tokens: ${errorData.error} - ${errorData.error_description || 'No error description'}`);
          } catch (parseError) {
            throw new Error(`Failed to exchange Spotify code for tokens: ${tokenResponse.statusText} (${tokenResponse.status})`);
          }
        }
        
        const tokenData = await tokenResponse.json();
        console.log('Spotify token exchange successful:', {
          access_token_length: tokenData.access_token?.length || 0,
          refresh_token_length: tokenData.refresh_token?.length || 0,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope
        });
        
        return {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        };
      }
    } catch (error) {
      console.error(`Error exchanging code for ${provider} tokens:`, error);
      throw error;
    }
  }
};

export default dataService; 