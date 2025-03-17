# Setting Up Spotify OAuth for Elroi

This guide will walk you through the process of setting up Spotify OAuth credentials for your Elroi application.

## 1. Create a Spotify Developer Account

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account (or create one if you don't have one)
3. Accept the terms of service if prompted

## 2. Create a New App

1. Click the "Create an App" button
2. Fill in the required information:
   - **App name**: Elroi (or whatever name you prefer)
   - **App description**: Personal data analytics dashboard
   - **Redirect URI**: `http://localhost:5173/oauth-callback.html` (for local development)
   - Accept the terms and conditions
3. Click "Create"

## 3. Get Your Credentials

1. Once your app is created, you'll be taken to the app dashboard
2. You'll see your **Client ID** displayed on this page
3. Click "Show Client Secret" to reveal your **Client Secret**
4. Save both these values as you'll need them for your application

## 4. Configure Redirect URIs

1. Click "Edit Settings" on your app dashboard
2. Under "Redirect URIs", add:
   - `http://localhost:5173/oauth-callback.html` (for local development)
   - Any production URLs where you'll deploy your application
3. Click "Save" at the bottom of the page

## 5. Update Your .env File

Add your Spotify credentials to your `.env` file:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## 6. Scopes Used in This Application

The Elroi application uses the following Spotify scopes:
- `user-read-email`: Read access to user's email address
- `user-read-private`: Read access to user's subscription details, country, etc.
- `user-top-read`: Read access to user's top tracks and artists
- `user-read-recently-played`: Read access to user's recently played tracks
- `user-library-read`: Read access to user's saved tracks and albums

## 7. Testing Your Integration

1. Start your application with `npm run dev`
2. Navigate to the Connected Accounts page
3. Click "Connect Spotify"
4. You should see a popup for Spotify authentication
5. After authenticating, the popup should close and your Spotify account should appear in the Connected Accounts list
6. Click on your Spotify connection to see your profile information and top tracks

## Troubleshooting

If you encounter any issues:

1. Check browser console for error messages
2. Verify your OAuth credentials are correctly set in your `.env` file
3. Ensure your redirect URI matches exactly what's configured in the Spotify Developer Dashboard
4. Check that you've requested the correct scopes
5. Make sure your Spotify account has some listening history for top tracks to display

## Security Considerations

For production use, the OAuth token exchange should be done on a secure server, not client-side. This implementation is simplified for development purposes.

In a production environment:
1. Set up a server endpoint to handle the OAuth code exchange
2. Keep your client secret secure on the server
3. Use HTTPS for all OAuth-related traffic 