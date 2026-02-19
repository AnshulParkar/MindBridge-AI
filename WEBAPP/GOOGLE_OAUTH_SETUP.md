# Google OAuth Setup Guide for MindBridge

## Step 1: Go to Google Cloud Console
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (the one used for Google Calendar) or create a new one

## Step 2: Enable the Google+ API / People API
1. Go to **APIs & Services** → **Library**
2. Search for **"Google+ API"** or **"People API"** and enable it

## Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type → click **Create**
3. Fill in the required fields:
   - **App name**: `MindBridge`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, add:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue** through remaining steps
7. On **Test users** page, add your Gmail address for testing
8. Click **Save and Continue** → **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Set the name to `MindBridge Web App`
5. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:3000
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Create**
8. **Copy the Client ID and Client Secret** shown in the popup

## Step 5: Add to .env File
Open the `.env` file in the `WEBAPP/` folder and add these lines:

```env
# Google OAuth (for Sign In with Google)
GOOGLE_CLIENT_ID="paste-your-client-id-here"
GOOGLE_CLIENT_SECRET="paste-your-client-secret-here"
```

> **Note**: These are DIFFERENT from `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET`. 
> The Calendar credentials are for Google Calendar API integration.
> The OAuth credentials are for "Sign in with Google" authentication.

## Step 6: Verify Setup
1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/auth/signin`
3. Click **"Continue with Google"**
4. You should see the Google sign-in popup
5. After signing in, you'll be redirected to the profile completion page

## Production Deployment
When deploying to production, update:
1. **Authorized JavaScript origins**: Add your production URL (e.g., `https://mindbridge.com`)
2. **Authorized redirect URIs**: Add `https://mindbridge.com/api/auth/callback/google`
3. Update the `.env` with the same credentials (they work for both origins)
4. Update `NEXTAUTH_URL` in `.env` to your production URL

## Troubleshooting
- **"Error 400: redirect_uri_mismatch"**: Make sure `http://localhost:3000/api/auth/callback/google` is in your authorized redirect URIs
- **"Access blocked"**: Your app is in testing mode. Add your Google account to test users in the consent screen
- **Google sign-in button not showing**: Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env` and restart the dev server
