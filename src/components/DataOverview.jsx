import React, { useState, useEffect } from 'react';
import { FaSpinner, FaExclamationCircle, FaGoogle, FaYoutube, FaCalendar, FaEnvelope, FaFolder, FaSpotify, FaTwitch, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import dataService from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DataOverview = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [providerData, setProviderData] = useState({});
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !user.id) {
        setError('User not found');
        setLoading(false);
        return;
      }
      
      // Get connected accounts
      const accounts = await dataService.getConnectedAccounts(user.id);
      setConnections(accounts);
      
      // For each active connection, fetch its data
      const dataPromises = accounts
        .filter(conn => conn.status === 'active')
        .map(async (conn) => {
          try {
            const data = await dataService.getProviderData(user.id, conn.provider);
            return { provider: conn.provider, data };
          } catch (error) {
            console.error(`Error fetching data for ${conn.provider}:`, error);
            return { provider: conn.provider, error: true };
          }
        });
      
      const results = await Promise.all(dataPromises);
      
      // Convert to an object with provider as key
      const dataObj = {};
      results.forEach(result => {
        dataObj[result.provider] = result.error ? { error: true } : result.data;
      });
      
      setProviderData(dataObj);
      
      // Generate stats for visualization
      generateStats(dataObj);
    } catch (error) {
      console.error('Error fetching data overview:', error);
      setError('Failed to load data overview');
    } finally {
      setLoading(false);
    }
  };

  const generateStats = (data) => {
    const statsArray = [];
    
    // Generate YouTube statistics if available
    if (data.youtube_channel) {
      const channelData = data.youtube_channel.data;
      if (channelData && channelData.subscriber_count) {
        statsArray.push({
          name: 'YouTube',
          subscribers: parseInt(channelData.subscriber_count) || 0,
          videos: parseInt(channelData.video_count) || 0,
          views: (parseInt(channelData.view_count) || 0) / 1000 // Divide by 1000 for scale
        });
      }
    }
    
    // Add Gmail statistics if available
    if (data.gmail) {
      const gmailData = data.gmail.data;
      if (gmailData && gmailData.messages_total) {
        statsArray.push({
          name: 'Gmail',
          messages: parseInt(gmailData.messages_total) || 0,
          threads: parseInt(gmailData.threads_total) || 0
        });
      }
    }
    
    // Add Google Drive statistics if available
    if (data.drive) {
      const driveData = data.drive.data;
      if (driveData && driveData.files_count) {
        statsArray.push({
          name: 'Drive',
          files: parseInt(driveData.files_count) || 0
        });
      }
    }
    
    // Add existing Twitch stats
    if (data.twitch) {
      // Process Twitch data for stats
      statsArray.push({
        name: 'Twitch',
        followers: data.twitch.data?.[0]?.follower_count || 0,
        streams: data.twitch.data?.[0]?.stream_count || 0,
        views: (data.twitch.data?.[0]?.view_count || 0) / 1000
      });
    }
    
    setStats(statsArray);
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
        return null;
    }
  };

  const getDataTypeIcon = (dataType) => {
    switch (dataType) {
      case 'profile':
        return <FaGoogle className="text-red-500" />;
      case 'calendar':
        return <FaCalendar className="text-blue-500" />;
      case 'youtube_channel':
      case 'youtube_subscriptions':
        return <FaYoutube className="text-red-600" />;
      case 'gmail':
        return <FaEnvelope className="text-yellow-500" />;
      case 'drive':
        return <FaFolder className="text-green-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatYouTubeUsername = (username) => {
    if (!username) return '';
    
    // If the username already has @ symbol, use it as is
    if (username.startsWith('@')) {
      return username;
    }
    
    // If it contains a slash or domain, it's likely a URL - extract the last part
    if (username.includes('/') || username.includes('.')) {
      const parts = username.split(/[\/\.]/);
      const lastPart = parts[parts.length - 1];
      return lastPart ? `@${lastPart}` : '';
    }
    
    // Otherwise just prepend @
    return `@${username}`;
  };

  const getActiveConnections = () => {
    return connections.filter(conn => conn.status === 'active');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  const activeConnections = getActiveConnections();
  
  // If no connections, show empty state
  if (activeConnections.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No connected accounts</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by connecting an account to collect and visualize your data.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard?tab=connections"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Connect an Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Your Connected Accounts
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {activeConnections.length} active connection(s)
          </p>
        </div>
        <div className="px-4 py-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeConnections.map(conn => (
            <div key={conn.id} className="border rounded-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                {getProviderIcon(conn.provider)}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium capitalize">{conn.provider}</h4>
                <p className="text-sm text-gray-500">
                  Connected: {formatDate(conn.created_at)}
                </p>
                <Link
                  to="/dashboard?tab=connections"
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Data Summary
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Overview of the data we've collected
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {activeConnections.map(conn => {
            const data = providerData[conn.provider];
            
            if (!data || data.error) {
              return (
                <div key={conn.id} className="px-4 py-5 sm:px-6">
                  <div className="flex items-center">
                    <div className="mr-3">{getProviderIcon(conn.provider)}</div>
                    <h4 className="text-lg font-medium capitalize">{conn.provider}</h4>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-red-500">
                    <FaExclamationCircle className="mr-1" />
                    <span>Error loading data</span>
                  </div>
                </div>
              );
            }
            
            // Check if we have profile data
            const profileData = data.profile?.data;
            
            return (
              <div key={conn.id} className="px-4 py-5 sm:px-6">
                <div className="flex items-center">
                  <div className="mr-3">{getProviderIcon(conn.provider)}</div>
                  <h4 className="text-lg font-medium capitalize">{conn.provider}</h4>
                </div>
                
                {/* Profile Information */}
                {profileData && (
                  <div className="mt-4">
                    <h5 className="text-md font-medium">Profile Information</h5>
                    <div className="mt-2 flex items-start">
                      {profileData.picture && (
                        <img 
                          src={profileData.picture} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full mr-4"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{profileData.name || 'No name available'}</p>
                        <p className="text-sm text-gray-500">{profileData.email || 'No email available'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated: {formatDate(data.profile.last_updated)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Calendar Data */}
                {conn.provider === 'google' && data.calendar?.data && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center">
                      <div className="mr-2"><FaCalendar className="text-blue-500" /></div>
                      <h5 className="text-md font-medium">Calendar</h5>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{data.calendar.data.total_events || '0'}</span> upcoming events
                      </p>
                      {data.calendar.data.event_1 && (
                        <div className="mt-2">
                          <h6 className="text-sm font-medium">Next Event:</h6>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                            {(() => {
                              try {
                                const event = JSON.parse(data.calendar.data.event_1);
                                return (
                                  <>
                                    <p className="font-medium">{event.summary}</p>
                                    <p className="text-xs text-gray-500">
                                      {event.start && formatDate(event.start.dateTime || event.start.date)}
                                    </p>
                                  </>
                                );
                              } catch (e) {
                                return <p>Error parsing event data</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* YouTube Data */}
                {conn.provider === 'google' && data.youtube_channel?.data && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center">
                      <div className="mr-2"><FaYoutube className="text-red-600" /></div>
                      <h5 className="text-md font-medium">YouTube Channel</h5>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 mb-2">
                      <span className="font-medium">{data.youtube_channel.data.title}</span>
                      {data.youtube_channel.data.username && (
                        <span className="ml-2 text-gray-500">
                          {data.youtube_channel.data.custom_url ? (
                            <a 
                              href={`https://youtube.com/${data.youtube_channel.data.custom_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {formatYouTubeUsername(data.youtube_channel.data.username)}
                            </a>
                          ) : (
                            formatYouTubeUsername(data.youtube_channel.data.username)
                          )}
                        </span>
                      )}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">Subscribers</p>
                        <p className="font-medium">{data.youtube_channel.data.subscriber_count || '0'}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">Videos</p>
                        <p className="font-medium">{data.youtube_channel.data.video_count || '0'}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="font-medium">{data.youtube_channel.data.view_count || '0'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* YouTube Subscriptions */}
                {conn.provider === 'google' && data.youtube_subscriptions?.data && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center">
                      <div className="mr-2"><FaYoutube className="text-red-600" /></div>
                      <h5 className="text-md font-medium">YouTube Subscriptions</h5>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">{data.youtube_subscriptions.data.total_subscriptions || '0'}</span> channel subscriptions
                    </p>
                  </div>
                )}
                
                {/* Gmail Data */}
                {conn.provider === 'google' && data.gmail?.data && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center">
                      <div className="mr-2"><FaEnvelope className="text-yellow-500" /></div>
                      <h5 className="text-md font-medium">Gmail</h5>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">Messages</p>
                        <p className="font-medium">{data.gmail.data.messages_total || '0'}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs text-gray-500">Threads</p>
                        <p className="font-medium">{data.gmail.data.threads_total || '0'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Google Drive Data */}
                {conn.provider === 'google' && data.drive?.data && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center">
                      <div className="mr-2"><FaFolder className="text-green-600" /></div>
                      <h5 className="text-md font-medium">Google Drive</h5>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">{data.drive.data.files_count || '0'}</span> files indexed
                    </p>
                    {data.drive.data.file_1 && (
                      <div className="mt-2">
                        <h6 className="text-sm font-medium">Recent Files:</h6>
                        <div className="mt-1 space-y-1">
                          {[1, 2, 3].map(i => {
                            const fileKey = `file_${i}`;
                            if (!data.drive.data[fileKey]) return null;
                            
                            try {
                              const file = JSON.parse(data.drive.data[fileKey]);
                              return (
                                <div key={i} className="p-1 text-sm flex items-center">
                                  <span className="w-4 h-4 rounded-sm bg-gray-200 mr-2 flex-shrink-0" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Display other data types here (future development) */}
              </div>
            );
          })}
        </div>
      </div>
      
      {stats.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Platform Statistics</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subscribers" fill="#8884d8" name="Subscribers" />
                  <Bar dataKey="followers" fill="#8884d8" name="Followers" />
                  <Bar dataKey="videos" fill="#82ca9d" name="Videos" />
                  <Bar dataKey="streams" fill="#82ca9d" name="Streams" />
                  <Bar dataKey="views" fill="#ffc658" name="Views (K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataOverview; 