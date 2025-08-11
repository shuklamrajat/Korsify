# Firebase Authentication Setup

## Current Configuration
- **Project**: korsify-app
- **Auth Domain**: korsify-app.firebaseapp.com
- **Replit Domain**: d69ed634-2cc0-4436-95cb-506595ee2d21-00-sunaapjm9rnr.spock.replit.dev

## Required Setup Steps

### 1. Add Authorized Domains
To enable Google sign-in on Replit, you need to add your domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **korsify-app** project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add these domains:
   - `d69ed634-2cc0-4436-95cb-506595ee2d21-00-sunaapjm9rnr.spock.replit.dev`
   - `localhost` (for local testing)
   - Any custom domain you plan to use

### 2. Enable Google Sign-In Provider
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Add your project support email
4. Save the configuration

### 3. OAuth Consent Screen (if needed)
If you haven't configured the OAuth consent screen:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen with your app information
5. Add your domain to authorized domains

## Testing
After completing the setup:
1. Refresh your Replit app
2. Click "Continue with Google" on the login page
3. Complete the Google sign-in flow
4. You should be redirected to the role selection page

## Troubleshooting

### "Unauthorized Domain" Error
- Make sure you've added the exact Replit domain to Firebase authorized domains
- The domain changes when you fork or restart the Repl, so check if it's updated

### "Popup Blocked" Error
- Allow popups in your browser for the Replit domain
- Alternatively, the app will fall back to redirect-based sign-in

### "Invalid API Key" Error
- Verify the Firebase config in `client/src/lib/firebase.ts`
- Make sure the API key matches your Firebase project

## Security Notes
- Never commit service account keys to version control
- Use environment variables for sensitive configuration in production
- The Firebase API key is safe to expose in client-side code (it's restricted by domain)