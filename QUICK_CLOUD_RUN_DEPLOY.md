# 🚀 Quick Deploy to Google Cloud Run from Replit

## The Simple 3-Step Process

### Step 1: Push Your Replit Code to GitHub
1. Open the **Git** tab in your Replit workspace
2. Click **"Connect to GitHub"**
3. Create a new repository (e.g., "korsify-app")
4. Your code is now on GitHub!

### Step 2: Deploy from GitHub to Cloud Run (In Google Cloud Console)
1. Go to: https://console.cloud.google.com/run
2. Click **"CREATE SERVICE"**
3. Select **"Continuously deploy from a repository"**
4. Click **"SET UP WITH CLOUD BUILD"**
5. Choose:
   - Source: **GitHub**
   - Repository: Your repo (e.g., "korsify-app")
   - Branch: **main**
   - Build Type: **Dockerfile**
6. Service configuration:
   - Service name: **korsify**
   - Region: **us-central1**
   - Authentication: **Allow unauthenticated**
7. Click **"CREATE"**

### Step 3: Add Environment Variables
After deployment, in Cloud Run:
1. Click on your service
2. Click **"EDIT & DEPLOY NEW REVISION"**
3. Go to **"Variables & Secrets"** tab
4. Add:
   ```
   NODE_ENV=production
   PORT=8080
   GEMINI_API_KEY=(click "Add a secret" and create one)
   JWT_SECRET=(click "Add a secret" and create one)
   DATABASE_URL=(your database connection string)
   ```
5. Click **"DEPLOY"**

## That's It! 🎉

Your app is now live and will auto-deploy whenever you push changes from Replit to GitHub!

---

## Setting Up Cloud SQL Database (If Needed)

```bash
# Quick database setup
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --project=korsify-app

# Create database
gcloud sql databases create korsify --instance=korsify-db

# Create user
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='ChooseSecurePassword'
```

Then in Cloud Run, add Cloud SQL connection and use this DATABASE_URL:
```
postgresql://korsify_user:PASSWORD@/korsify?host=/cloudsql/korsify-app:us-central1:korsify-db
```

---

## Files Already Created for You

✅ **Dockerfile** - Tells Cloud Run how to build your app  
✅ **cloudbuild.yaml** - Automates the deployment process  
✅ **.gcloudignore** - Excludes unnecessary files  

Everything is ready to deploy!