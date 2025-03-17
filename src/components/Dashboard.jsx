import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../services/authService';
import dataService from '../services/dataService';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import ConnectedAccounts from './ConnectedAccounts';
import DataOverview from './DataOverview';
import DataControls from './DataControls';
import DiagnosticTool from './DiagnosticTool';
import { FaGoogle, FaExclamationTriangle } from 'react-icons/fa';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle saving provider data after OAuth authentication
  useEffect(() => {
    const handleProviderSignIn = async () => {
      try {
        console.log('Checking for OAuth callback...');
        
        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }
        
        if (!session) {
          console.log('No session found');
          return;
        }
        
        console.log('Session found:', {
          user: session.user.id,
          email: session.user.email,
          app_metadata: session.user.app_metadata,
          hasProviderToken: !!session.provider_token,
          hasRefreshToken: !!session.provider_refresh_token
        });
        
        // Check if this is a new provider sign-in by looking for provider token
        if (session.provider_token && session.provider_refresh_token) {
          console.log('Provider tokens found - new OAuth connection detected');
          console.log('Provider:', session.user.app_metadata.provider);
          console.log('User ID:', session.user.id);
          
          // Get the provider from the session
          const provider = session.user.app_metadata.provider;
          
          if (!provider) {
            console.error('No provider found in app_metadata');
            return;
          }
          
          // Check if this provider connection already exists
          const { data: existingConnection, error: connectionQueryError } = await supabase
            .from('oauth_connections')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('provider', provider)
            .single();
          
          if (connectionQueryError && connectionQueryError.code !== 'PGRST116') {
            console.error('Error checking for existing connection:', connectionQueryError);
            return;
          }
          
          // Skip if already connected
          if (existingConnection) {
            console.log('Connection already exists, skipping');
            return;
          }
          
          console.log('Creating new connection in database');
          
          try {
            // Verify the oauth_connections table exists
            const { data: tableCheck, error: tableError } = await supabase
              .from('oauth_connections')
              .select('id')
              .limit(1);
              
            if (tableError) {
              console.error('Error verifying oauth_connections table:', tableError);
              if (tableError.code === '42P01') {
                console.error('TABLE DOES NOT EXIST! You need to create the tables first.');
                alert('Database tables are missing. Please run the SQL migration script in Supabase.');
                return;
              }
            } else {
              console.log('oauth_connections table exists');
            }
            
            // Save the provider connection with detailed error logging
            console.log('Inserting connection record with values:', {
              user_id: session.user.id,
              provider,
              token_length: session.provider_token?.length || 0,
              refresh_token_length: session.provider_refresh_token?.length || 0
            });
            
            // Get the provider user ID from the user's identity
            let providerUserId = null;
            if (session.user.identities && session.user.identities.length > 0) {
              const identity = session.user.identities.find(id => id.provider === provider);
              if (identity) {
                providerUserId = identity.id;
                console.log('Found provider user ID from identity:', providerUserId);
              }
            }
            
            // If we couldn't get the ID from identities, use a fallback
            if (!providerUserId) {
              providerUserId = `user_${Date.now()}`;
              console.log('Using fallback provider user ID:', providerUserId);
            }
            
            const { data: newConnection, error: connectionError } = await supabase
              .from('oauth_connections')
              .insert({
                user_id: session.user.id,
                provider: provider,
                provider_user_id: providerUserId,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token
              })
              .select();
              
            if (connectionError) {
              console.error('Error saving connection:', connectionError);
              if (connectionError.code === '42501') {
                console.error('PERMISSION DENIED! Check RLS policies.');
                alert('Permission denied when saving your connection. Check Row Level Security policies.');
              } else if (connectionError.code === '23505') {
                console.error('DUPLICATE RECORD! This connection already exists.');
                alert('This connection already exists in the database.');
              } else {
                alert(`Error saving connection: ${connectionError.message}`);
              }
              return;
            }
            
            console.log('Connection saved successfully:', newConnection);
            
            // Fetch provider data
            try {
              console.log('Fetching provider data from Google API');
              const providerData = await dataService.fetchProviderData(session.user.id, provider);
              console.log('Provider data received:', providerData);
              
              // Store the data
              console.log('Storing provider data in database');
              await dataService.storeProviderData(session.user.id, provider, providerData);
              console.log('Provider data stored successfully');
              
              // Refresh the accounts list
              setTimeout(() => {
                console.log('Reloading page to refresh data');
                window.location.reload();
              }, 1000);
              
            } catch (fetchError) {
              console.error('Error fetching/storing provider data:', fetchError);
              alert(`Error getting data from Google: ${fetchError.message}`);
            }
          } catch (error) {
            console.error('Unexpected error in OAuth process:', error);
            alert(`An unexpected error occurred: ${error.message}`);
          }
        } else {
          console.log('No provider tokens found - not a new OAuth connection');
        }
      } catch (error) {
        console.error('Error in OAuth callback handling:', error);
      }
    };
    
    handleProviderSignIn();
  }, []);

  useEffect(() => {
    // Check URL for tab parameter (useful when returning from OAuth redirects)
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam && ['overview', 'connections', 'controls'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // Clean up the URL if there's a tab parameter
      if (window.history.replaceState) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }
  }, [location]);

  useEffect(() => {
    // The user is already authenticated at this point (through ProtectedRoute)
    // We just need to get the current user
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Toggle diagnostic tool visibility
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Data Overview'}
              {activeTab === 'connections' && 'Connected Accounts'}
              {activeTab === 'controls' && 'Data Sharing Controls'}
              {activeTab === 'diagnostics' && 'System Diagnostics'}
            </h1>
            {activeTab !== 'diagnostics' && (
              <button 
                onClick={toggleDiagnostics}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm"
              >
                {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
              </button>
            )}
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {(showDiagnostics && activeTab !== 'diagnostics') && (
            <div className="mb-6">
              <DiagnosticTool />
            </div>
          )}
          
          {activeTab === 'overview' && <DataOverview user={user} />}
          {activeTab === 'connections' && <ConnectedAccounts user={user} />}
          {activeTab === 'controls' && <DataControls user={user} />}
          {activeTab === 'diagnostics' && <DiagnosticTool />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 