# Setting Up Google OAuth for Data Connection

This guide will help you set up Google OAuth credentials to connect Google as a data source without using it for authentication.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID for future reference

## 2. Enable Required APIs

1. Go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google OAuth2 API
   - People API (for profile information)
   - Any other Google APIs you need data from (e.g., YouTube Data API)

## 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select the appropriate user type (External or Internal)
3. Fill in the required information:
   - App name: Your app name (e.g., "Elroi")
   - User support email
   - Developer contact information
4. Add the scopes you need:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - Any other scopes needed for additional APIs
5. Add test users if in external user type mode

## 4. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Add a name for your OAuth client
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development with Vite)
   - Your production domain if applicable
6. Add authorized redirect URIs:
   - `http://localhost:5173/oauth-callback.html` (for local development)
   - `https://yourdomain.com/oauth-callback.html` (for production)
7. Click "Create"
8. Note your Client ID and Client Secret

## 5. Update Environment Variables

Add your Google OAuth credentials to the `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## 6. Security Considerations

For production use, the OAuth token exchange should be done on a secure server, not client-side. This implementation is simplified for development purposes.

In a production environment:
1. Set up a server endpoint to handle the OAuth code exchange
2. Keep your client secret secure on the server
3. Use HTTPS for all OAuth-related traffic
4. Consider implementing PKCE (Proof Key for Code Exchange) for added security

## Testing the Connection

1. Run your application
2. Go to the Connected Accounts page
3. Click "Connect Google"
4. You should see a popup for Google authentication
5. After authenticating, the popup should close and your Google account should appear in the Connected Accounts list

## Troubleshooting

If you encounter issues:

1. Check browser console for error messages
2. Verify your OAuth credentials and redirect URIs are correct
3. Make sure the necessary APIs are enabled in your Google Cloud project
4. Check that your OAuth consent screen is configured properly
5. Verify that the scopes requested match what you've configured in the consent screen 