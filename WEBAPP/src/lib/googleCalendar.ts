// Google Calendar Integration
// To use this, set up a Google Cloud project and add these env variables:
// GOOGLE_CALENDAR_CLIENT_ID=your-client-id
// GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
// GOOGLE_CALENDAR_REFRESH_TOKEN=your-refresh-token
//
// Steps to get these credentials:
// 1. Go to https://console.cloud.google.com
// 2. Create a project or select existing
// 3. Enable the Google Calendar API
// 4. Create OAuth 2.0 credentials (Web application)
// 5. Add these Authorized redirect URIs:
//    - https://developers.google.com/oauthplayground  (for Option A)
//    - http://localhost:3000/api/auth/google-calendar/callback  (for Option B)
//
// Steps to get the REFRESH TOKEN:
// Option A — Using Google OAuth Playground:
//   1. Make sure you added https://developers.google.com/oauthplayground
//      as an Authorized redirect URI in your Google Cloud OAuth credentials (step 5)
//   2. In Google Cloud Console, go to "OAuth consent screen":
//      a. Set User Type to "External" (required for non-Google Workspace accounts;
//         "Internal" is only available if you have a Google Workspace organization)
//      b. Set the publishing status to "Testing"
//      c. Under "Test users", click "Add Users" and add YOUR Google email address
//         (the one you'll sign in with). Without this you'll get Error 403: access_denied.
//         Note: In "Testing" mode, only added test users can authorize the app.
//   3. Go to https://developers.google.com/oauthplayground
//   4. Click the ⚙️ (settings) icon in the top-right
//   5. Check "Use your own OAuth credentials"
//   6. Enter your Client ID and Client Secret from step 4 above
//   7. In the left panel, find "Google Calendar API v3" and select
//      https://www.googleapis.com/auth/calendar
//   8. Click "Authorize APIs" and sign in with the Google account you added as a test user
//   9. Click "Exchange authorization code for tokens"
//   10. Copy the "Refresh token" value — that is your GOOGLE_CALENDAR_REFRESH_TOKEN
//
// Option B — Using a manual OAuth flow:
//   IMPORTANT: The redirect_uri below must EXACTLY match one of the Authorized redirect URIs
//   configured in your Google Cloud OAuth credentials (step 5). Any mismatch causes Error 400.
//   1. Visit this URL in your browser (replace YOUR_CLIENT_ID):
//      https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/google-calendar/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent
//   2. Sign in & grant access. You'll be redirected with a ?code=... param
//   3. Exchange the code for tokens via a POST request:
//      curl -X POST https://oauth2.googleapis.com/token \
//        -d code=AUTH_CODE \
//        -d client_id=YOUR_CLIENT_ID \
//        -d client_secret=YOUR_CLIENT_SECRET \
//        -d redirect_uri=http://localhost:3000/api/auth/google-calendar/callback \
//        -d grant_type=authorization_code
//   4. The response JSON will contain "refresh_token" — save it as GOOGLE_CALENDAR_REFRESH_TOKEN
//
// Note: The refresh token is long-lived. You only need to generate it once.

interface CalendarEventParams {
  summary: string
  description?: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  attendees?: string[] // email addresses
}

interface CalendarTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn("Google Calendar credentials not configured")
    return null
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const tokens: CalendarTokens = await response.json()
    return tokens.access_token
  } catch (error) {
    console.error("Failed to refresh Google Calendar token:", error)
    return null
  }
}

export async function createCalendarEvent(
  params: CalendarEventParams
): Promise<string | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  try {
    const event = {
      summary: params.summary,
      description: params.description || "",
      start: {
        dateTime: params.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: params.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: params.attendees?.map((email) => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "email", minutes: 60 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `mindbridge-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Google Calendar API error:", errorData)
      return null
    }

    const createdEvent = await response.json()
    console.log("Google Calendar event created:", createdEvent.id)
    return createdEvent.id
  } catch (error) {
    console.error("Failed to create Google Calendar event:", error)
    return null
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const accessToken = await getAccessToken()
  if (!accessToken) return false

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    return response.ok
  } catch (error) {
    console.error("Failed to delete Google Calendar event:", error)
    return false
  }
}

export async function updateCalendarEvent(
  eventId: string,
  params: Partial<CalendarEventParams>
): Promise<boolean> {
  const accessToken = await getAccessToken()
  if (!accessToken) return false

  try {
    const updateData: any = {}

    if (params.summary) updateData.summary = params.summary
    if (params.description) updateData.description = params.description
    if (params.startTime) {
      updateData.start = {
        dateTime: params.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }
    if (params.endTime) {
      updateData.end = {
        dateTime: params.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    )

    return response.ok
  } catch (error) {
    console.error("Failed to update Google Calendar event:", error)
    return false
  }
}
