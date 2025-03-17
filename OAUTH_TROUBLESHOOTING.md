# OAuth Integration Troubleshooting Guide

This document provides guidance on debugging and fixing issues with the OAuth integration in the Elroi application.

## Database Setup

The most common issue with OAuth integration is missing or misconfigured database tables. Follow these steps to ensure your database is properly set up:

1. Navigate to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `/migrations/setup_tables.sql` file
4. Run the SQL script to create the necessary tables and permissions

The script will:
- Check if the required tables exist and create them if they don't
- Add any missing columns (like the `status` column) to existing tables
- Set up proper Row Level Security (RLS) policies

## Using the Diagnostic Tool

The application now includes a built-in diagnostic tool to help identify issues:

1. Log in to your Elroi account
2. Navigate to the "Diagnostics" tab in the sidebar
3. Click "Run Diagnostics" to check your database setup

The diagnostic tool will check:
- If you're properly authenticated
- If the necessary tables exist in your database
- The current record count in each table
- Whether the RLS policies are properly configured

Based on the results, the tool will provide specific recommendations for fixing any issues it finds.

## Common Issues

### 1. Missing Tables

**Symptom**: The OAuth flow completes but no data is saved.

**Solution**: Run the database migration script from `/migrations/setup_tables.sql` in your Supabase SQL Editor.

### 2. Row Level Security Issues

**Symptom**: You see errors like "Permission denied for table oauth_connections" in the console.

**Solution**: The migration script should fix RLS policies, but you can also manually add them in the Supabase dashboard:
- Go to Database > Tables
- Select the problem table
- Go to the "Policies" tab
- Add policies that allow users to select, insert, update, and delete their own records

### 3. Error Tracing

For detailed debugging, check your browser's developer console (F12). The application includes enhanced error logging that will help identify where in the process the failure occurs.

### 4. Data Retrieval Issues

If data is being saved but not properly displayed:

1. Use the diagnostic tool to confirm data exists in the tables
2. Check the browser console for any API errors
3. Verify that the user ID in the queries matches your authenticated user

## Manually Testing the OAuth Flow

1. Clear your browser cache or use an incognito window
2. Log in to the application
3. Go to the "Connected Accounts" tab
4. Click "Connect Google"
5. Watch the browser console for detailed logs
6. After authentication, the diagnostic tool should show new records in the tables

## Contact Support

If you're still experiencing issues after trying these troubleshooting steps, contact support with the following information:
- Screenshots of the diagnostic tool results
- Any error messages from the browser console
- Steps you've already taken to troubleshoot 