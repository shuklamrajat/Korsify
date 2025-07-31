# Testing Korsify Locally in Replit

Since the external domain has issues, use Replit's built-in webview:

## Quick Access:
1. Look for the **Webview** tab in your Replit interface
2. If missing, click **"+"** → Select **"Webview"**
3. The app will load at `localhost:5000`

## What to Test:
- Landing page with hero section
- Navigation menu (Features, How It Works, Pricing)
- "Get Started" button → Creator Dashboard
- File upload functionality
- Course creation workflow

## Application Routes:
- `/` - Landing page
- `/creator` - Creator Dashboard
- `/learner` - Learner Dashboard
- `/courses/:id` - Course viewer
- `/courses/:id/edit` - Course editor

The app is running correctly - you just need to access it through Replit's webview!