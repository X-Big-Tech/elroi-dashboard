# Enhanced Google OAuth Integration for Elroi

This guide explains how to enhance your Google OAuth integration to collect additional data types beyond basic profile information.

## Overview

The enhanced Google OAuth integration enables Elroi to collect the following additional data types:

1. **Google Calendar Events** - Basic information about upcoming calendar events
2. **YouTube Channel & Subscription Data** - Information about the user's YouTube channel and subscriptions
3. **Gmail Metadata** - Count of emails and threads (no content access)
4. **Google Drive File Metadata** - List of file names and metadata (no content access)

## Prerequisites

Before proceeding with the enhanced integration, make sure you have:

1. A Google Cloud Platform account
2. A project with the Google OAuth consent screen already configured
3. Basic Google OAuth integration already working in your Elroi application

## Step 1: Enable Additional APIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Library**
4. Enable the following APIs:
   - Google Calendar API
   - YouTube Data API v3
   - Gmail API
   - Google Drive API

## Step 2: Update OAuth Consent Screen with Additional Scopes

1. Go to **APIs & Services > OAuth consent screen**
2. Under the **Scopes for Google APIs** section, click **Add or Remove Scopes**
3. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (Read access to Google Calendar)
   - `https://www.googleapis.com/auth/youtube.readonly` (Read access to YouTube data)
   - `https://www.googleapis.com/auth/gmail.metadata` (Read Gmail metadata)
   - `https://www.googleapis.com/auth/drive.metadata.readonly` (Read Google Drive metadata)
4. If your app is in production, you may need to go through verification for these additional scopes

## Step 3: Update the OAuth Request in Your Application

The `ConnectedAccounts.jsx` component has been updated to include these additional scopes in the OAuth request. Make sure your application is using the updated component.

## Step 4: Testing the Enhanced Integration

1. Sign out of your application and clear your browser cookies
2. Sign in again and connect your Google account
3. You will now see the additional permission requests for Calendar, YouTube, Gmail, and Drive
4. After approving, Elroi will fetch and store this additional data
5. View the data in the DataOverview component

## Data Types Collected

### Google Profile
- Basic user profile information (name, email, profile picture)

### Calendar Events
- Count of upcoming events
- Details of the next few events (summary, date/time)

### YouTube Channel
- Channel statistics (subscribers, view count, video count)
- Channel name and description

### YouTube Subscriptions
- List of channels the user is subscribed to
- Count of total subscriptions

### Gmail Metadata
- Total message count
- Total thread count

### Google Drive Files
- Count of files in the user's Drive
- Names and types of recent files
- No file contents are accessed

## Limitations and Considerations

1. **OAuth Token Limitations**: The Google OAuth token may expire after a period of time. Implement refresh token logic if needed.

2. **API Quotas**: Google APIs have usage limits and quotas. Monitor your usage to avoid exceeding these limits.

3. **Privacy Considerations**: Always be transparent with users about what data you're collecting and how it will be used. Update your privacy policy accordingly.

4. **Data Storage**: The application stores this data in your Supabase database. Ensure you have proper security measures in place.

## Troubleshooting

### Common Issues

1. **Insufficient Permissions**: If you're not seeing all data types, check that all necessary APIs are enabled and the correct scopes are requested.

2. **API Errors**: Check the browser console for specific API error messages that may indicate issues with quotas or permissions.

3. **Data Not Displaying**: If the data is fetched but not displaying correctly, check the DataOverview component to ensure it's properly rendering the new data types.

### Getting Help

If you encounter issues with the enhanced Google OAuth integration, check:

1. Google Cloud Console for API errors or quota limits
2. Application logs for specific error messages
3. The structure of the data returned by the Google APIs

## Security Best Practices

1. **Minimize Scopes**: Only request the scopes you absolutely need
2. **Secure Storage**: Properly secure OAuth tokens and sensitive user data
3. **Regular Audits**: Regularly audit what data you're collecting and why
4. **User Control**: Allow users to disconnect their account and delete their data 