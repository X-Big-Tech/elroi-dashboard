import React, { useState, useEffect } from 'react';
import { FaGoogle, FaSpotify, FaSpinner, FaExclamationCircle, FaCheckCircle, FaTrash, FaTwitch, FaLink, FaFacebook } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import dataService from '../services/dataService';

const ConnectedAccounts = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [error, setError] = useState(null);
  const [oauthPopup, setOauthPopup] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, [user]);

  // Listen for messages from the OAuth popup window
  useEffect(() => {
    const handleOAuthCallback = async (event) => {
      // Make sure the message is from our OAuth popup
      if (event.origin !== window.location.origin) {
        console.log(`Ignoring message from different origin: ${event.origin}`);
        return;
      }
      
      console.log('Received postMessage event:', event.data);
      
      if (event.data.type === 'oauth_callback' && event.data.provider && event.data.code) {
        console.log('OAuth callback received:', {
          provider: event.data.provider,
          codeLength: event.data.code?.length || 0,
          state: event.data.state
        });
        
        try {
          // Exchange the code for tokens directly without using Supabase auth
          console.log(`Exchanging code for ${event.data.provider} tokens...`);
          
          // Retrieve the stored provider from session storage to verify
          const storedProvider = sessionStorage.getItem('oauth_provider');
          const storedProviderInfo = sessionStorage.getItem('oauth_provider_info');
          
          console.log('Stored provider in session storage:', storedProvider);
          console.log('Stored provider info:', storedProviderInfo);
          
          if (storedProvider && storedProvider !== event.data.provider) {
            console.warn(`Provider mismatch: expected ${storedProvider}, got ${event.data.provider}`);
            // Continue but with the stored provider which should be correct
            console.log(`Using stored provider (${storedProvider}) instead of callback provider (${event.data.provider})`);
            event.data.provider = storedProvider;
          }
          
          const tokens = await dataService.exchangeCodeForTokens(event.data.provider, event.data.code);
          
          console.log('Tokens received:', {
            access_token_length: tokens.access_token?.length || 0,
            refresh_token_length: tokens.refresh_token?.length || 0,
            expires_in: tokens.expires_in
          });
          
          // Save connection to database
          await saveConnection(event.data.provider, tokens);
          
          // Clean up session storage
          sessionStorage.removeItem('oauth_provider');
          sessionStorage.removeItem('oauth_provider_info');
          
          // Close the popup
          if (oauthPopup && !oauthPopup.closed) {
            oauthPopup.close();
          }
          
          setConnecting(false);
          
          // Refresh the connections list
          await fetchConnections();
      } catch (error) {
          console.error('Error processing OAuth callback:', error);
          setError(`Failed to connect: ${error.message}`);
          setConnecting(false);
        }
      } else {
        console.log('Received message is not a valid OAuth callback', event.data);
      }
    };
    
    window.addEventListener('message', handleOAuthCallback);
    
    return () => {
      window.removeEventListener('message', handleOAuthCallback);
    };
  }, [oauthPopup]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !user.id) {
        console.error('No user found or user has no ID');
        setError('User not found');
        setLoading(false);
        return;
      }
      
      console.log('Fetching connections for user:', user.id);
      const accounts = await dataService.getConnectedAccounts(user.id);
      console.log('Connections fetched:', accounts);
      setConnections(accounts);
      
      // If we have a selected connection and it's still in the list, update its data
      if (selectedConnection) {
        const stillExists = accounts.find(conn => conn.id === selectedConnection.id);
        if (stillExists) {
          loadProviderData(stillExists);
        } else {
          setSelectedConnection(null);
          setProviderData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load your connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const connectProvider = async (provider) => {
    try {
      setConnecting(true);
      setError(null);
      
      console.log(`Starting custom OAuth flow for ${provider}...`);
      
      // Get the client ID for the selected provider
      let clientId;
      let scopes;
      
      if (provider === 'google') {
        clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        scopes = 'https://www.googleapis.com/auth/userinfo.profile ' + 
                'https://www.googleapis.com/auth/userinfo.email ' +
                'https://www.googleapis.com/auth/calendar.readonly ' + 
                'https://www.googleapis.com/auth/youtube.readonly ' +
                'https://www.googleapis.com/auth/gmail.metadata ' +
                'https://www.googleapis.com/auth/drive.metadata.readonly';
      } else if (provider === 'spotify') {
        clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        scopes = 'user-read-email user-read-private user-top-read user-read-recently-played user-library-read';
      } else if (provider === 'twitch') {
        clientId = import.meta.env.VITE_TWITCH_CLIENT_ID;
        scopes = 'user:read:email analytics:read:games';
      } else if (provider === 'facebook') {
        clientId = import.meta.env.VITE_FACEBOOK_APP_ID;
        scopes = 'email,public_profile,user_posts,user_photos';
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
      
      const redirectUri = `${window.location.origin}/oauth-callback.html`;
      
      if (!clientId) {
        throw new Error(`${provider} Client ID is missing from environment variables`);
      }
      
      // Store the provider in session storage so the callback page can retrieve it
      const providerInfo = {
        name: provider,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_provider_info', JSON.stringify(providerInfo));
      console.log(`Stored provider in session storage:`, providerInfo);
      
      // Build the OAuth URL
      let oauthUrl;
      const state = `${provider}_${Math.random().toString(36).substring(2)}`;
      
      if (provider === 'google') {
        oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&state=${state}` +
          `&access_type=offline` +
          `&prompt=consent`;
      } else if (provider === 'spotify') {
        oauthUrl = `https://accounts.spotify.com/authorize?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&state=${state}` +
          `&show_dialog=true`;
      } else if (provider === 'twitch') {
        oauthUrl = `https://id.twitch.tv/oauth2/authorize?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&state=${state}` +
          `&force_verify=true`;
      } else if (provider === 'facebook') {
        oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes)}` +
          `&state=${state}`;
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
      
      console.log(`Opening OAuth URL for ${provider}:`, oauthUrl);
      
      // Open the OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        oauthUrl,
        `Connect ${provider}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
      
      setOauthPopup(popup);
      
      // The popup will redirect to oauth-callback.html, which will post a message back to this window
      // The message is handled in the useEffect above
      
    } catch (error) {
      console.error(`Error connecting to ${provider}:`, error);
      setError(`Failed to connect to ${provider}: ${error.message}`);
      setConnecting(false);
    }
  };

  const saveConnection = async (provider, tokens) => {
    try {
      console.log(`Saving ${provider} connection to database...`);
      console.log('User ID:', user.id);
      console.log('Have access token?', !!tokens.access_token);
      console.log('Have refresh token?', !!tokens.refresh_token);
      
      // First fetch the provider user ID from the API
      let providerUserId;
      
      if (provider === 'google') {
        try {
          // Fetch Google profile to get user ID
          console.log('Fetching Google profile with token...');
          const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          
          console.log('Google profile API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch Google profile: ${response.statusText} (${response.status})`);
          }
          
          const profileData = await response.json();
          console.log('Google profile data:', profileData);
          
          // Get the Google user ID
          providerUserId = profileData.id;
          console.log('Retrieved provider user ID:', providerUserId);
          
          if (!providerUserId) {
            throw new Error('Could not retrieve Google user ID from profile data');
          }
        } catch (profileError) {
          console.error('Error fetching Google profile:', profileError);
          throw profileError;
        }
      } else if (provider === 'spotify') {
        try {
          // Fetch Spotify profile to get user ID
          console.log('Fetching Spotify profile with token...');
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          
          console.log('Spotify profile API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch Spotify profile: ${response.statusText} (${response.status})`);
          }
          
          const profileData = await response.json();
          console.log('Spotify profile data:', profileData);
          
          // Get the Spotify user ID
          providerUserId = profileData.id;
          console.log('Retrieved Spotify user ID:', providerUserId);
          
          if (!providerUserId) {
            throw new Error('Could not retrieve Spotify user ID from profile data');
          }
        } catch (profileError) {
          console.error('Error fetching Spotify profile:', profileError);
          throw profileError;
        }
      } else if (provider === 'twitch') {
        try {
          // Fetch Twitch profile to get user ID
          console.log('Fetching Twitch profile with token...');
          const response = await fetch('https://api.twitch.tv/helix/users', {
            headers: { 
              'Authorization': `Bearer ${tokens.access_token}`,
              'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID
            }
          });
          
          console.log('Twitch profile API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch Twitch profile: ${response.statusText} (${response.status})`);
          }
          
          const userData = await response.json();
          console.log('Twitch user data:', userData);
          
          if (!userData.data || userData.data.length === 0) {
            throw new Error('No user data returned from Twitch API');
          }
          
          // Get the Twitch user ID
          const profileData = userData.data[0];
          providerUserId = profileData.id;
          console.log('Retrieved Twitch user ID:', providerUserId);
          
          if (!providerUserId) {
            throw new Error('Could not retrieve Twitch user ID from profile data');
          }
        } catch (profileError) {
          console.error('Error fetching Twitch profile:', profileError);
          throw profileError;
        }
      } else if (provider === 'facebook') {
        try {
          // Fetch Facebook profile to get user ID
          console.log('Fetching Facebook profile with token...');
          const response = await fetch('https://graph.facebook.com/v18.0/me?fields=id,name,email,picture', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          
          console.log('Facebook profile API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch Facebook profile: ${response.statusText} (${response.status})`);
          }
          
          const profileData = await response.json();
          console.log('Facebook profile data:', profileData);
          
          // Get the Facebook user ID
          providerUserId = profileData.id;
          console.log('Retrieved provider user ID:', providerUserId);
          
          if (!providerUserId) {
            throw new Error('Could not retrieve Facebook user ID from profile data');
          }
        } catch (profileError) {
          console.error('Error fetching Facebook profile:', profileError);
          throw profileError;
        }
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
      
      // Log the data being inserted
      const insertData = {
        user_id: user.id,
        provider: provider,
        provider_user_id: providerUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      };
      console.log('Inserting connection data:', {
        ...insertData,
        access_token: insertData.access_token ? `${insertData.access_token.substring(0, 10)}...` : null,
        refresh_token: insertData.refresh_token ? `${insertData.refresh_token.substring(0, 10)}...` : null
      });
      
      // Save the connection to the database
      const { data, error } = await supabase
        .from('oauth_connections')
        .insert(insertData)
        .select();
      
      if (error) {
        console.error('Error saving connection to database:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to save connection: ${error.message}`);
      }
      
      console.log('Connection saved successfully:', data);
      
      // Fetch and store provider data
      const connectionId = data[0].id;
      await fetchAndStoreProviderData(provider, tokens.access_token, connectionId);
      
      return data[0];
    } catch (error) {
      console.error('Error saving connection:', error);
      throw error;
    }
  };

  const fetchAndStoreProviderData = async (provider, accessToken, connectionId) => {
    try {
      console.log(`Fetching data from ${provider} API...`);
      
      // Fetch data from provider API
      let providerData;
      if (provider === 'google') {
        // Get the basic profile data
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Google profile: ${response.statusText}`);
        }
        
        const profileData = await response.json();
        console.log('Google API profile response:', profileData);
        
        // Initialize providerData with the profile
        providerData = { profile: profileData };
        
        // Fetch Google Calendar events
        try {
          console.log('Fetching calendar events...');
          const calendarResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=' + 
            new Date().toISOString(),
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            console.log('Calendar data fetched:', calendarData.items?.length || 0, 'events');
            providerData.calendar = calendarData;
          } else {
            console.log('Calendar fetch failed:', calendarResponse.status);
          }
        } catch (calendarError) {
          console.warn('Error fetching calendar data:', calendarError);
        }
        
        // Fetch YouTube subscriptions
        try {
          console.log('Fetching YouTube subscriptions...');
          const youtubeSubsResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=10',
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (youtubeSubsResponse.ok) {
            const youtubeSubsData = await youtubeSubsResponse.json();
            console.log('YouTube subscriptions fetched:', youtubeSubsData.items?.length || 0);
            providerData.youtubeSubscriptions = youtubeSubsData;
          } else {
            console.log('YouTube subscriptions fetch failed:', youtubeSubsResponse.status);
          }
        } catch (youtubeError) {
          console.warn('Error fetching YouTube subscriptions:', youtubeError);
        }
        
        // Fetch YouTube channel (if exists for user)
        try {
          console.log('Fetching YouTube channel info...');
          const youtubeChannelResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (youtubeChannelResponse.ok) {
            const youtubeChannelData = await youtubeChannelResponse.json();
            console.log('YouTube channel data fetched');
            providerData.youtubeChannel = youtubeChannelData;
            
            // Log username info for debugging
            if (youtubeChannelData.items?.length > 0) {
              const channel = youtubeChannelData.items[0];
              console.log('YouTube username/customUrl:', channel.snippet?.customUrl);
              console.log('YouTube channel title:', channel.snippet?.title);
            }
          } else {
            console.log('YouTube channel fetch failed:', youtubeChannelResponse.status);
          }
        } catch (youtubeError) {
          console.warn('Error fetching YouTube channel:', youtubeError);
        }
        
        // Fetch Gmail message count (metadata only)
        try {
          console.log('Fetching Gmail metadata...');
          const gmailResponse = await fetch(
            'https://www.googleapis.com/gmail/v1/users/me/profile',
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (gmailResponse.ok) {
            const gmailData = await gmailResponse.json();
            console.log('Gmail metadata fetched');
            providerData.gmail = gmailData;
          } else {
            console.log('Gmail metadata fetch failed:', gmailResponse.status);
          }
        } catch (gmailError) {
          console.warn('Error fetching Gmail metadata:', gmailError);
        }
        
        // Fetch Google Drive file count (metadata only)
        try {
          console.log('Fetching Drive metadata...');
          const driveResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=kind,nextPageToken,incompleteSearch,files(id,name,mimeType,modifiedTime)',
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (driveResponse.ok) {
            const driveData = await driveResponse.json();
            console.log('Drive files fetched:', driveData.files?.length || 0);
            providerData.drive = driveData;
          } else {
            console.log('Drive metadata fetch failed:', driveResponse.status);
          }
        } catch (driveError) {
          console.warn('Error fetching Drive metadata:', driveError);
        }
      } else if (provider === 'spotify') {
        // Get user profile
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch Spotify profile: ${profileResponse.statusText}`);
        }
        
        const profileData = await profileResponse.json();
        console.log('Spotify profile data:', profileData);
        
        // Get top tracks (if possible)
        let topTracks = null;
        try {
          const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (tracksResponse.ok) {
            topTracks = await tracksResponse.json();
            console.log('Spotify top tracks fetched:', topTracks.items.length);
          }
        } catch (error) {
          console.warn('Could not fetch Spotify top tracks:', error);
        }
        
        // Get recently played (if possible)
        let recentlyPlayed = null;
        try {
          const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (recentResponse.ok) {
            recentlyPlayed = await recentResponse.json();
            console.log('Spotify recently played fetched:', recentlyPlayed.items.length);
          }
        } catch (error) {
          console.warn('Could not fetch Spotify recently played:', error);
        }
        
        providerData = { 
          profile: profileData,
          topTracks: topTracks,
          recentlyPlayed: recentlyPlayed
        };
      } else if (provider === 'twitch') {
        // Get Twitch user profile
        const profileResponse = await fetch('https://api.twitch.tv/helix/users', {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch Twitch profile: ${profileResponse.statusText}`);
        }
        
        const userData = await profileResponse.json();
        
        if (!userData.data || userData.data.length === 0) {
          throw new Error('No user data returned from Twitch API');
        }
        
        const profileData = userData.data[0];
        console.log('Twitch profile data:', profileData);
        
        // Get user's channel information (optional)
        let channelData = null;
        try {
          const channelResponse = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${profileData.id}`, {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID
            }
          });
          
          if (channelResponse.ok) {
            const channelInfo = await channelResponse.json();
            if (channelInfo.data && channelInfo.data.length > 0) {
              channelData = channelInfo.data[0];
              console.log('Twitch channel data:', channelData);
            }
          }
        } catch (error) {
          console.warn('Could not fetch Twitch channel information:', error);
        }
        
        // Get user's analytics if available (requires analytics:read:games scope)
        let analyticsData = null;
        try {
          const analyticsResponse = await fetch('https://api.twitch.tv/helix/analytics/games?first=10', {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Client-Id': import.meta.env.VITE_TWITCH_CLIENT_ID
            }
          });
          
          if (analyticsResponse.ok) {
            analyticsData = await analyticsResponse.json();
            console.log('Twitch analytics data:', analyticsData);
          }
        } catch (error) {
          console.warn('Could not fetch Twitch analytics:', error);
        }
        
        providerData = { 
          profile: profileData,
          channel: channelData,
          analytics: analyticsData
        };
      } else if (provider === 'facebook') {
        // Get Facebook user profile
        const profileResponse = await fetch('https://graph.facebook.com/v18.0/me?fields=id,name,email,picture,link,birthday,location', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch Facebook profile: ${profileResponse.statusText}`);
        }
        
        const profileData = await profileResponse.json();
        console.log('Facebook profile data:', profileData);
        
        // Get user's posts if possible
        let posts = null;
        try {
          const postsResponse = await fetch('https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,full_picture&limit=10', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (postsResponse.ok) {
            posts = await postsResponse.json();
            console.log('Facebook posts fetched:', posts.data?.length || 0);
          }
        } catch (error) {
          console.warn('Could not fetch Facebook posts:', error);
        }
        
        // Get user's photos if possible
        let photos = null;
        try {
          const photosResponse = await fetch('https://graph.facebook.com/v18.0/me/photos?fields=id,picture,images,created_time&limit=10&type=uploaded', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (photosResponse.ok) {
            photos = await photosResponse.json();
            console.log('Facebook photos fetched:', photos.data?.length || 0);
          }
        } catch (error) {
          console.warn('Could not fetch Facebook photos:', error);
        }
        
        providerData = { 
          profile: profileData,
          posts: posts,
          photos: photos
        };
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
      
      // Store the data in the database
      console.log('Storing provider data in database for connection:', connectionId);
      
      // First store the provider_data record
      const { data: providerRecord, error: providerError } = await supabase
        .from('provider_data')
        .insert({
          connection_id: connectionId,
          provider: provider,
          data_type: 'profile',
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
      
      if (providerError) {
        console.error('Error storing provider data:', providerError);
        throw new Error(`Failed to store provider data: ${providerError.message}`);
      }
      
      console.log('Provider data record created:', providerRecord);
      
      // Then store individual data points
      if (provider === 'google' && providerData.profile) {
        const profile = providerData.profile;
        
        const dataPoints = [
          { key: 'id', value: profile.id },
          { key: 'email', value: profile.email },
          { key: 'name', value: profile.name },
          { key: 'given_name', value: profile.given_name },
          { key: 'family_name', value: profile.family_name },
          { key: 'picture', value: profile.picture },
        ].filter(point => point.value !== undefined);
        
        console.log(`Storing ${dataPoints.length} Google profile data points...`);
        await storeDataPoints(providerRecord.id, dataPoints);
        
        // Store calendar data if available
        if (providerData.calendar && providerData.calendar.items) {
          // Create a separate provider_data record for calendar
          const { data: calendarRecord, error: calendarError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'calendar',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (calendarError) {
            console.error('Error storing calendar data:', calendarError);
          } else {
            // Store summary data about calendar
            const calendarSummaryPoints = [
              { key: 'total_events', value: providerData.calendar.items.length.toString() },
              { key: 'calendar_timezone', value: providerData.calendar.timeZone },
            ].filter(point => point.value !== undefined);
            
            console.log(`Storing calendar summary data points...`);
            await storeDataPoints(calendarRecord.id, calendarSummaryPoints);
            
            // Store individual calendar events (limited number)
            const events = providerData.calendar.items.slice(0, 10);
            const calendarEventPoints = events.map((event, index) => ({
              key: `event_${index + 1}`,
              value: JSON.stringify({
                id: event.id,
                summary: event.summary,
                start: event.start,
                end: event.end,
                status: event.status,
                created: event.created
              })
            }));
            
            console.log(`Storing ${calendarEventPoints.length} calendar event data points...`);
            await storeDataPoints(calendarRecord.id, calendarEventPoints);
          }
        }
        
        // Store YouTube subscriptions if available
        if (providerData.youtubeSubscriptions && providerData.youtubeSubscriptions.items) {
          // Create a separate provider_data record for YouTube subscriptions
          const { data: youtubeSubsRecord, error: youtubeSubsError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'youtube_subscriptions',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (youtubeSubsError) {
            console.error('Error storing YouTube subscriptions data:', youtubeSubsError);
          } else {
            // Store total subscriptions count
            const subscriptionSummary = [
              { key: 'total_subscriptions', value: providerData.youtubeSubscriptions.pageInfo?.totalResults?.toString() || 
                providerData.youtubeSubscriptions.items.length.toString() }
            ];
            
            console.log(`Storing YouTube subscriptions summary...`);
            await storeDataPoints(youtubeSubsRecord.id, subscriptionSummary);
            
            // Store individual subscriptions
            const subscriptionDataPoints = providerData.youtubeSubscriptions.items.map((sub, index) => ({
              key: `subscription_${index + 1}`,
              value: JSON.stringify({
                id: sub.id,
                channel_id: sub.snippet?.resourceId?.channelId,
                title: sub.snippet?.title,
                description: sub.snippet?.description?.substring(0, 100),
                thumbnail: sub.snippet?.thumbnails?.default?.url
              })
            }));
            
            console.log(`Storing ${subscriptionDataPoints.length} YouTube subscription data points...`);
            await storeDataPoints(youtubeSubsRecord.id, subscriptionDataPoints);
          }
        }
        
        // Store YouTube channel data if available
        if (providerData.youtubeChannel && providerData.youtubeChannel.items?.length > 0) {
          // Create a separate provider_data record for YouTube channel
          const { data: youtubeChannelRecord, error: youtubeChannelError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'youtube_channel',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (youtubeChannelError) {
            console.error('Error storing YouTube channel data:', youtubeChannelError);
          } else {
            const channel = providerData.youtubeChannel.items[0];
            const channelDataPoints = [
              { key: 'channel_id', value: channel.id },
              { key: 'title', value: channel.snippet?.title },
              { key: 'username', value: channel.snippet?.customUrl || channel.snippet?.title || 'N/A' },
              { key: 'description', value: channel.snippet?.description?.substring(0, 500) },
              { key: 'custom_url', value: channel.snippet?.customUrl },
              { key: 'thumbnail', value: channel.snippet?.thumbnails?.default?.url },
              { key: 'subscriber_count', value: channel.statistics?.subscriberCount },
              { key: 'video_count', value: channel.statistics?.videoCount },
              { key: 'view_count', value: channel.statistics?.viewCount }
            ].filter(point => point.value !== undefined);
            
            console.log(`Storing ${channelDataPoints.length} YouTube channel data points...`);
            await storeDataPoints(youtubeChannelRecord.id, channelDataPoints);
          }
        }
        
        // Store Gmail data if available
        if (providerData.gmail) {
          // Create a separate provider_data record for Gmail
          const { data: gmailRecord, error: gmailError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'gmail',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (gmailError) {
            console.error('Error storing Gmail data:', gmailError);
          } else {
            const gmailDataPoints = [
              { key: 'email', value: providerData.gmail.emailAddress },
              { key: 'messages_total', value: providerData.gmail.messagesTotal?.toString() },
              { key: 'threads_total', value: providerData.gmail.threadsTotal?.toString() },
              { key: 'history_id', value: providerData.gmail.historyId }
            ].filter(point => point.value !== undefined);
            
            console.log(`Storing ${gmailDataPoints.length} Gmail data points...`);
            await storeDataPoints(gmailRecord.id, gmailDataPoints);
          }
        }
        
        // Store Drive data if available
        if (providerData.drive && providerData.drive.files) {
          // Create a separate provider_data record for Drive
          const { data: driveRecord, error: driveError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'drive',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (driveError) {
            console.error('Error storing Drive data:', driveError);
          } else {
            // Store summary about Drive
            const driveSummaryPoints = [
              { key: 'files_count', value: providerData.drive.files.length.toString() }
            ];
            
            console.log(`Storing Drive summary data points...`);
            await storeDataPoints(driveRecord.id, driveSummaryPoints);
            
            // Store individual file metadata (limited number)
            const fileDataPoints = providerData.drive.files.map((file, index) => ({
              key: `file_${index + 1}`,
              value: JSON.stringify({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                modifiedTime: file.modifiedTime
              })
            }));
            
            console.log(`Storing ${fileDataPoints.length} Drive file data points...`);
            await storeDataPoints(driveRecord.id, fileDataPoints);
          }
        }
      } else if (provider === 'spotify') {
        // Store Spotify profile data points
        if (providerData.profile) {
          const profile = providerData.profile;
          
          const profileDataPoints = [
            { key: 'id', value: profile.id },
            { key: 'display_name', value: profile.display_name },
            { key: 'email', value: profile.email },
            { key: 'country', value: profile.country },
            { key: 'product', value: profile.product },
            { key: 'followers', value: profile.followers?.total?.toString() },
            { key: 'profile_url', value: profile.external_urls?.spotify },
            { key: 'profile_image', value: profile.images?.[0]?.url },
          ].filter(point => point.value !== undefined);
          
          console.log(`Storing ${profileDataPoints.length} Spotify profile data points...`);
          await storeDataPoints(providerRecord.id, profileDataPoints);
        }
        
        // Store top tracks if available
        if (providerData.topTracks && providerData.topTracks.items?.length > 0) {
          // Create a separate provider_data record for top tracks
          const { data: tracksRecord, error: tracksError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'top_tracks',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (tracksError) {
            console.error('Error storing top tracks data:', tracksError);
          } else {
            // Store each track as a data point
            const trackDataPoints = providerData.topTracks.items.map((track, index) => ({
              key: `track_${index + 1}`,
              value: JSON.stringify({
                id: track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                image: track.album.images?.[0]?.url,
                preview_url: track.preview_url,
                url: track.external_urls?.spotify
              })
            }));
            
            console.log(`Storing ${trackDataPoints.length} Spotify track data points...`);
            await storeDataPoints(tracksRecord.id, trackDataPoints);
          }
        }
      } else if (provider === 'twitch' && providerData.profile) {
        const profile = providerData.profile;
        
        const profileDataPoints = [
          { key: 'id', value: profile.id },
          { key: 'login', value: profile.login },
          { key: 'display_name', value: profile.display_name },
          { key: 'type', value: profile.type },
          { key: 'broadcaster_type', value: profile.broadcaster_type },
          { key: 'description', value: profile.description },
          { key: 'profile_image_url', value: profile.profile_image_url },
          { key: 'offline_image_url', value: profile.offline_image_url },
          { key: 'view_count', value: profile.view_count?.toString() },
          { key: 'email', value: profile.email },
          { key: 'created_at', value: profile.created_at }
        ].filter(point => point.value !== undefined);
        
        console.log(`Storing ${profileDataPoints.length} Twitch profile data points...`);
        await storeDataPoints(providerRecord.id, profileDataPoints);
        
        // Store channel data if available
        if (providerData.channel) {
          // Create a separate provider_data record for channel info
          const { data: channelRecord, error: channelError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'channel',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (channelError) {
            console.error('Error storing channel data:', channelError);
          } else {
            const channel = providerData.channel;
            const channelDataPoints = [
              { key: 'broadcaster_id', value: channel.broadcaster_id },
              { key: 'broadcaster_language', value: channel.broadcaster_language },
              { key: 'title', value: channel.title },
              { key: 'game_id', value: channel.game_id },
              { key: 'game_name', value: channel.game_name },
              { key: 'delay', value: channel.delay?.toString() }
            ].filter(point => point.value !== undefined);
            
            console.log(`Storing ${channelDataPoints.length} Twitch channel data points...`);
            await storeDataPoints(channelRecord.id, channelDataPoints);
          }
        }
        
        // Store analytics data if available
        if (providerData.analytics && providerData.analytics.data && providerData.analytics.data.length > 0) {
          // Create a separate provider_data record for analytics
          const { data: analyticsRecord, error: analyticsError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'analytics',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (analyticsError) {
            console.error('Error storing analytics data:', analyticsError);
          } else {
            // Store each game analytic as a data point
            const analyticsDataPoints = providerData.analytics.data.map((game, index) => ({
              key: `game_${index + 1}`,
              value: JSON.stringify({
                game_id: game.game_id,
                name: game.name,
                url: game.URL,
                date_range: game.date_range
              })
            }));
            
            console.log(`Storing ${analyticsDataPoints.length} Twitch analytics data points...`);
            await storeDataPoints(analyticsRecord.id, analyticsDataPoints);
          }
        }
      } else if (provider === 'facebook' && providerData.profile) {
        const profile = providerData.profile;
        
        const profileDataPoints = [
          { key: 'id', value: profile.id },
          { key: 'name', value: profile.name },
          { key: 'email', value: profile.email },
          { key: 'picture', value: profile.picture?.data?.url },
          { key: 'link', value: profile.link },
          { key: 'birthday', value: profile.birthday },
          { key: 'location', value: profile.location?.name }
        ].filter(point => point.value !== undefined);
        
        console.log(`Storing ${profileDataPoints.length} Facebook profile data points...`);
        await storeDataPoints(providerRecord.id, profileDataPoints);
        
        // Store posts data if available
        if (providerData.posts && providerData.posts.data && providerData.posts.data.length > 0) {
          // Create a separate provider_data record for posts
          const { data: postsRecord, error: postsError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'posts',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (postsError) {
            console.error('Error storing posts data:', postsError);
          } else {
            // Store each post as a data point
            const postsDataPoints = providerData.posts.data.map((post, index) => ({
              key: `post_${index + 1}`,
              value: JSON.stringify({
                id: post.id,
                message: post.message,
                created_time: post.created_time,
                picture: post.full_picture
              })
            }));
            
            console.log(`Storing ${postsDataPoints.length} Facebook post data points...`);
            await storeDataPoints(postsRecord.id, postsDataPoints);
          }
        }
        
        // Store photos data if available
        if (providerData.photos && providerData.photos.data && providerData.photos.data.length > 0) {
          // Create a separate provider_data record for photos
          const { data: photosRecord, error: photosError } = await supabase
            .from('provider_data')
            .insert({
              connection_id: connectionId,
              provider: provider,
              data_type: 'photos',
              last_updated: new Date().toISOString()
            })
            .select()
            .single();
          
          if (photosError) {
            console.error('Error storing photos data:', photosError);
          } else {
            // Store each photo as a data point
            const photosDataPoints = providerData.photos.data.map((photo, index) => ({
              key: `photo_${index + 1}`,
              value: JSON.stringify({
                id: photo.id,
                picture: photo.picture,
                source: photo.images?.[0]?.source,
                created_time: photo.created_time
              })
            }));
            
            console.log(`Storing ${photosDataPoints.length} Facebook photo data points...`);
            await storeDataPoints(photosRecord.id, photosDataPoints);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching/storing provider data:', error);
      throw error;
    }
  };
  
  // Helper function to store data points
  const storeDataPoints = async (providerDataId, dataPoints) => {
    for (const point of dataPoints) {
      const { error: pointError } = await supabase
        .from('provider_data_points')
        .insert({
          provider_data_id: providerDataId,
          data_key: point.key,
          data_value: String(point.value), // Ensure it's a string
        });
      
      if (pointError) {
        console.error(`Error storing data point ${point.key}:`, pointError);
        // Continue with other points even if one fails
      }
    }
    console.log('All data points stored successfully');
  };

  const disconnectProvider = async (connection) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${connection.provider} account?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Just delete the connection instead of updating status
      const { error } = await supabase
        .from('oauth_connections')
        .delete()
        .eq('id', connection.id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchConnections();
      
      // Clear selected connection if it was deleted
      if (selectedConnection && selectedConnection.id === connection.id) {
        setSelectedConnection(null);
        setProviderData(null);
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      setError('Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  const loadProviderData = async (connection) => {
    try {
      setSelectedConnection(connection);
      setProviderData(null);
      
      console.log(`Loading data for ${connection.provider} connection ID:`, connection.id);
      
      // Get the provider data from the database
      const { data, error } = await supabase
        .from('provider_data')
        .select(`
          id,
          provider,
          data_type,
          last_updated,
          provider_data_points (
            data_key,
            data_value
          )
        `)
        .eq('connection_id', connection.id);
      
      if (error) {
        console.error('Error loading provider data:', error);
        setError(`Failed to load ${connection.provider} data`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No provider data found for connection');
        return;
      }
      
      console.log('Provider data loaded:', data);
      
      // Transform the data into a more user-friendly format
      const transformedData = data.reduce((acc, dataItem) => {
        const dataPoints = dataItem.provider_data_points.reduce((pointsAcc, point) => {
          pointsAcc[point.data_key] = point.data_value;
          return pointsAcc;
        }, {});
        
        acc[dataItem.data_type] = {
          data_points: dataPoints,
          last_updated: dataItem.last_updated
        };
        
        return acc;
      }, {});
      
      console.log('Transformed data:', transformedData);
      setProviderData(transformedData);
    } catch (error) {
      console.error('Error in loadProviderData:', error);
      setError(`Failed to load provider data: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'google':
        return <FaGoogle className="text-red-500" />;
      case 'spotify':
        return <FaSpotify className="text-green-500" />;
      case 'twitch':
        return <FaTwitch className="text-purple-500" />;
      case 'facebook':
        return <FaFacebook className="text-blue-600" />;
      default:
        return <FaLink />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'disconnected':
        return <FaExclamationCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => connectProvider('google')}
          disabled={connecting || connections.some(c => c.provider === 'google')}
          className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
            connecting ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <FaGoogle className="text-xl mr-3 text-blue-500" />
          <span className="font-medium">
            {connecting ? 'Connecting...' : 'Connect Google'}
          </span>
          {connecting && <FaSpinner className="ml-2 animate-spin" />}
        </button>
        
        <button
          onClick={() => connectProvider('spotify')}
          disabled={connecting || connections.some(c => c.provider === 'spotify')}
          className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
            connecting ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <FaSpotify className="text-xl mr-3 text-green-500" />
          <span className="font-medium">
            {connecting ? 'Connecting...' : 'Connect Spotify'}
          </span>
          {connecting && <FaSpinner className="ml-2 animate-spin" />}
        </button>
        
        <button
          onClick={() => connectProvider('twitch')}
          disabled={connecting || connections.some(c => c.provider === 'twitch')}
          className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
            connecting ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <FaTwitch className="text-xl mr-3 text-purple-500" />
          <span className="font-medium">
            {connecting ? 'Connecting...' : 'Connect Twitch'}
          </span>
          {connecting && <FaSpinner className="ml-2 animate-spin" />}
        </button>
        
        <button
          onClick={() => connectProvider('facebook')}
          disabled={connecting || connections.some(c => c.provider === 'facebook')}
          className={`flex items-center px-6 py-3 rounded-lg shadow-md ${
            connecting ? 'bg-gray-300' : 'bg-white hover:bg-gray-100'
          }`}
        >
          <FaFacebook className="text-xl mr-3 text-blue-600" />
          <span className="font-medium">
            {connecting ? 'Connecting...' : 'Connect Facebook'}
          </span>
          {connecting && <FaSpinner className="ml-2 animate-spin" />}
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Connected accounts list */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
          
          {loading && !connecting && (
            <div className="flex justify-center py-4">
              <FaSpinner className="animate-spin text-2xl text-blue-500" />
            </div>
          )}
          
          {!loading && connections.length === 0 && (
            <p className="text-gray-500 py-2">No accounts connected yet</p>
          )}
          
          <ul className="space-y-3">
            {connections.map((connection) => (
              <li 
                key={connection.id}
                className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between 
                  ${selectedConnection?.id === connection.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => loadProviderData(connection)}
              >
                  <div className="flex items-center">
                  <span className="mr-3">
                    {getProviderIcon(connection.provider)}
                  </span>
                    <div>
                    <span className="font-medium capitalize">{connection.provider}</span>
                    <div className="text-xs text-gray-500 flex items-center">
                      {getStatusIcon(connection.status)}
                      <span className="ml-1 capitalize">{connection.status}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectProvider(connection);
                  }}
                  className="text-gray-500 hover:text-red-500"
                  title="Disconnect"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Provider data view */}
        <div className="w-full md:w-2/3 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Provider Data</h2>
          
          {!selectedConnection && (
            <div className="text-gray-500 py-8 text-center">
              Select a connected account to view its data
            </div>
          )}
          
          {selectedConnection && loading && (
            <div className="flex justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-blue-500" />
            </div>
          )}
          
          {selectedConnection && !loading && !providerData && (
            <div className="text-gray-500 py-8 text-center">
              No data available for this connection
        </div>
      )}
      
          {selectedConnection && providerData && (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedConnection.provider.charAt(0).toUpperCase() + selectedConnection.provider.slice(1)} Account Details
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Last updated: {formatDate(providerData.profile?.last_updated)}
                  </p>
              </div>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {selectedConnection.provider === 'google' && providerData.profile && (
                  <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {providerData.profile.data_points.picture && (
                      <div className="sm:col-span-2 flex justify-center">
                        <img 
                          src={providerData.profile.data_points.picture} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full border-2 border-gray-200"
                        />
                      </div>
                    )}
                    
                    <div className="sm:col-span-2">
                      <h4 className="text-lg font-medium">{providerData.profile.data_points.name}</h4>
                      <p className="text-gray-500">{providerData.profile.data_points.email}</p>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">First Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.given_name || 'N/A'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.family_name || 'N/A'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Google ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.id || 'N/A'}</dd>
                    </div>
                  </div>
                )}
                
                {selectedConnection.provider === 'spotify' && providerData.profile && (
                  <div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 mb-8">
                      {providerData.profile.data_points.profile_image && (
                        <div className="sm:col-span-2 flex justify-center">
                          <img 
                            src={providerData.profile.data_points.profile_image} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full border-2 border-gray-200"
                          />
                        </div>
                      )}
                      
                      <div className="sm:col-span-2 text-center mb-4">
                        <h4 className="text-lg font-medium">{providerData.profile.data_points.display_name}</h4>
                        <p className="text-gray-500">{providerData.profile.data_points.email}</p>
                        {providerData.profile.data_points.profile_url && (
                          <a 
                            href={providerData.profile.data_points.profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline text-sm"
                          >
                            View Spotify Profile
                          </a>
                        )}
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Country</dt>
                        <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.country || 'N/A'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Subscription</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{providerData.profile.data_points.product || 'N/A'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Followers</dt>
                        <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.followers || '0'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Spotify ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{providerData.profile.data_points.id || 'N/A'}</dd>
                      </div>
                    </div>
                    
                    {/* Display top tracks if available */}
                    {providerData.top_tracks && (
                      <div className="mt-6">
                        <h4 className="text-lg font-medium mb-4">Your Top Tracks</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(providerData.top_tracks.data_points)
                            .filter(([key]) => key.startsWith('track_'))
                            .sort((a, b) => {
                              const indexA = parseInt(a[0].split('_')[1]);
                              const indexB = parseInt(b[0].split('_')[1]);
                              return indexA - indexB;
                            })
                            .map(([key, value]) => {
                              try {
                                const track = JSON.parse(value);
                                return (
                                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                    {track.image && (
                                      <img 
                                        src={track.image} 
                                        alt={track.name}
                                        className="w-full h-32 object-cover rounded mb-2" 
                                      />
                                    )}
                                    <h5 className="font-medium text-sm truncate">{track.name}</h5>
                                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                    <p className="text-xs text-gray-400 truncate">{track.album}</p>
                                    {track.url && (
                                      <a 
                                        href={track.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-600 hover:underline mt-1 inline-block"
                                      >
                                        Open in Spotify
                                      </a>
                                    )}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccounts; 