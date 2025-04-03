# Fixing Google OAuth Scopes for Elroi

This guide explains how to update your Google OAuth consent screen to include all the necessary scopes for the enhanced Google integration.

## The Issue

You've connected your Google account, but you're not seeing the additional data types (Calendar, YouTube, Gmail, Drive) in the dashboard. This is because your Google OAuth integration is missing the required scopes that grant permission to access these additional data types.

## How to Fix It

### Step 1: Update the Google Cloud Console Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Under the "Scopes for Google APIs" section, click "Add or Remove Scopes"
5. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (Read access to Google Calendar)
   - `https://www.googleapis.com/auth/youtube.readonly` (Read access to YouTube data)
   - `https://www.googleapis.com/auth/gmail.metadata` (Read Gmail metadata)
   - `https://www.googleapis.com/auth/drive.metadata.readonly` (Read Google Drive metadata)
6. Click "Save and Continue"

### Step 2: Enable Required APIs

Make sure you have enabled all the necessary APIs:

1. Go to "APIs & Services" > "Library"
2. Search for and enable each of these APIs if they're not already enabled:
   - Google Calendar API
   - YouTube Data API v3
   - Gmail API
   - Google Drive API

### Step 3: Reconnect Your Google Account

1. Go back to your Elroi dashboard
2. Navigate to the "Connected Accounts" tab
3. Disconnect your existing Google connection
4. Connect Google again
5. You will now see the additional permission requests for Calendar, YouTube, Gmail, and Drive
6. After approving, the additional data should appear in your dashboard

## Verification

After reconnecting, go to the "Data Overview" tab and check that you can see:

1. **Calendar Events** - Your upcoming Google Calendar events
2. **YouTube Data** - Channel statistics and subscriptions (if you have any)
3. **Gmail Metadata** - Message and thread counts
4. **Google Drive** - File counts and recent files

If you're still having issues after following these steps, please check the browser console for any error messages and report them. 