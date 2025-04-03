# Setting Up Facebook OAuth for Elroi

This guide will walk you through the process of setting up Facebook OAuth credentials for your Elroi application.

## 1. Create a Facebook Developer Account

1. Go to the [Facebook for Developers](https://developers.facebook.com/) website
2. Log in with your Facebook account (or create one if you don't have one)
3. If this is your first time, you may need to register as a developer by providing some basic information

## 2. Create a New App

1. Go to the "My Apps" dropdown in the top-right corner
2. Click "Create App"
3. Select the app type - choose "Consumer" as the app type for this integration
4. Fill in the required information:
   - **App Name**: Elroi (or whatever name you prefer)
   - **App Contact Email**: Your email address
   - **Business Account**: Optional (you can skip this for development)
5. Click "Create App" to continue

## 3. Add Facebook Login Product

1. On your app dashboard, scroll to "Add Products to Your App"
2. Find "Facebook Login" and click "Set Up"
3. In the left menu, navigate to "Facebook Login" > "Settings"
4. Under "Valid OAuth Redirect URIs", add:
   - `http://localhost:5173/oauth-callback.html` (for local development)
   - Your production URL when ready (e.g., `https://yourdomain.com/oauth-callback.html`)
5. Click "Save Changes"

## 4. Configure App Settings

1. In the left menu, go to "Settings" > "Basic"
2. Note your **App ID** and **App Secret** - you'll need these for your application
3. Under "App Domains", add the domains you'll be using (e.g., `localhost` for development)
4. Fill in the required fields like Privacy Policy URL (required for public apps)
5. Save your changes

## 5. Add Permissions and Features

1. In the left menu, go to "App Review" > "Permissions and Features"
2. Request the necessary permissions for your app:
   - `email` - To access the user's email address (basic)
   - `public_profile` - For basic profile info (basic)
   - `user_posts` - To access user's posts (requires review)
   - `user_photos` - To access user's photos (requires review)
3. For development, you can test with your own account as an admin/developer without submitting for review
4. For production with non-admin users, submit these permissions for review by Facebook

## 6. Update Your .env File

Add your Facebook credentials to your `.env` file:

```
VITE_FACEBOOK_APP_ID=your_app_id_here
VITE_FACEBOOK_APP_SECRET=your_app_secret_here
```

## 7. Configure App for Testing

For development, you can test your app without going through Facebook's full review process:

1. In the top menu, switch your app from "Development" to "Live" mode
2. Add yourself (and any other developers) as test users:
   - Go to "Roles" > "Test Users"
   - Add your Facebook account to test the integration

## 8. Testing Your Integration

1. Start your application with `npm run dev`
2. Navigate to the Connected Accounts page
3. Click "Connect Facebook"
4. You should see a popup for Facebook authentication
5. After authenticating, the popup should close and your Facebook account should appear in the Connected Accounts list
6. Click on your Facebook connection to see your profile information, posts, and photos

## Troubleshooting

If you encounter any issues:

1. Check browser console for error messages
2. Verify your OAuth credentials are correctly set in your `.env` file
3. Ensure your redirect URI matches exactly what's configured in the Facebook Developer Dashboard
4. Check that you've registered the permissions you're trying to use
5. Verify that your app is in "Live" mode if testing with non-developer users

## Security Considerations

For production use, follow these security best practices:

1. Always exchange the authorization code for tokens on the server side, not client-side
2. Keep your App Secret secure and never expose it in client-side code
3. Use HTTPS for all OAuth-related traffic
4. Implement CSRF protection for your OAuth flows
5. Regularly rotate your App Secret 