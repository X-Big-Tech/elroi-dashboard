# Setting Up Twitch OAuth for Elroi

This guide will walk you through the process of setting up Twitch OAuth credentials for your Elroi application.

## 1. Create a Twitch Developer Account

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account (or create one if you don't have one)
3. If this is your first time, you may need to register as a developer by accepting the Developer Agreement

## 2. Create a New Application

1. Click on "Applications" in the top menu
2. Click the "Register Your Application" button
3. Fill in the required information:
   - **Name**: Elroi (or whatever name you prefer)
   - **OAuth Redirect URLs**: `http://localhost:5173/oauth-callback.html` (for local development)
   - **Category**: Choose "Analytics Tool" or "Dashboard"
4. Click "Create" to register your application

## 3. Get Your Credentials

1. Once your app is created, you'll be taken back to the Applications page
2. You'll see your new application listed with its **Client ID**
3. Click "New Secret" to generate a **Client Secret**
4. Save both these values as you'll need them for your application

## 4. Configure OAuth Redirect URIs

If you need to add additional redirect URIs later:
1. Click on your application in the Developer Console
2. Add additional redirect URIs as needed:
   - Development: `http://localhost:5173/oauth-callback.html`
   - Production: `https://yourdomain.com/oauth-callback.html`
3. Click "Save" at the bottom of the page

## 5. Update Your .env File

Add your Twitch credentials to your `.env` file:

```
VITE_TWITCH_CLIENT_ID=your_client_id_here
VITE_TWITCH_CLIENT_SECRET=your_client_secret_here
```

## 6. Scopes Used in This Application

The Elroi application uses the following Twitch scopes:
- `user:read:email`: Read access to your email address
- `analytics:read:games`: Read access to analytics for games you play

## 7. Testing Your Integration

1. Start your application with `npm run dev`
2. Navigate to the Connected Accounts page
3. Click "Connect Twitch"
4. You should see a popup for Twitch authentication
5. After authenticating, the popup should close and your Twitch account should appear in the Connected Accounts list
6. Click on your Twitch connection to see your profile information and channel data

## Troubleshooting

If you encounter any issues:

1. Check browser console for error messages
2. Verify your OAuth credentials are correctly set in your `.env` file
3. Ensure your redirect URI matches exactly what's configured in the Twitch Developer Console
4. Check that you've requested the correct scopes
5. Ensure your Twitch account is properly set up

## Security Considerations

For production use, the OAuth token exchange should be done on a secure server, not client-side. This implementation is simplified for development purposes.

In a production environment:
1. Set up a server endpoint to handle the OAuth code exchange
2. Keep your client secret secure on the server
3. Use HTTPS for all OAuth-related traffic 