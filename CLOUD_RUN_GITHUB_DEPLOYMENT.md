# Deploy Replit App to Google Cloud Run via GitHub

## Overview
This guide shows how to deploy your Replit app directly to Google Cloud Run using GitHub integration - no migration scripts needed!

## Step 1: Connect Replit to GitHub

### In Replit:
1. Open the **Git** tab in your workspace
2. Click "Connect to GitHub"
3. Create a new repository or connect to existing
4. Push your code to GitHub

Your code is now on GitHub and auto-syncs with Replit!

## Step 2: Prepare for Cloud Run

### Create these files in your Replit:

#### 1. Create `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all files
COPY . .

# Build the app
RUN npm run build || true

# Expose port
EXPOSE 8080

# Start command
CMD ["npm", "start"]
```

#### 2. Create `.gcloudignore`
```
node_modules
.git
.env
.env.local
uploads/
*.log
```

#### 3. Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "NODE_ENV=production node server/index.js",
    "build": "tsc && vite build"
  }
}
```

## Step 3: Deploy to Cloud Run from GitHub

### Option A: Using Google Cloud Console (Easier)

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **"Create Service"**
3. Select **"Continuously deploy from a repository"**
4. Click **"Set up with Cloud Build"**
5. Choose **GitHub** as source
6. Authenticate and select your repository
7. Configure:
   - Branch: `main`
   - Build Type: `Dockerfile`
   - Dockerfile path: `/Dockerfile`
8. Service settings:
   - Region: `us-central1`
   - CPU: 1
   - Memory: 1 GB
   - Min instances: 0
   - Max instances: 10
9. Environment variables (click "Variables & Secrets"):
   ```
   NODE_ENV=production
   PORT=8080
   ```
10. Add secrets (create in Secret Manager first):
    - GEMINI_API_KEY
    - JWT_SECRET
    - DATABASE_URL
11. Click **"Create"**

### Option B: Using gcloud CLI

```bash
# 1. First, set up Cloud Build trigger
gcloud builds triggers create github \
  --repo-name=YOUR_GITHUB_REPO \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --project=korsify-app

# 2. Create cloudbuild.yaml in your repo
cat > cloudbuild.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/korsify-app/korsify:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/korsify-app/korsify:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'korsify'
      - '--image'
      - 'gcr.io/korsify-app/korsify:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
images:
  - 'gcr.io/korsify-app/korsify:$COMMIT_SHA'
EOF

# 3. Push to GitHub to trigger deployment
git add .
git commit -m "Deploy to Cloud Run"
git push
```

## Step 4: Set Up Database (Cloud SQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --project=korsify-app

# Create database
gcloud sql databases create korsify \
  --instance=korsify-db \
  --project=korsify-app

# Create user
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='YourSecurePassword' \
  --project=korsify-app

# Get connection name
gcloud sql instances describe korsify-db \
  --format="value(connectionName)" \
  --project=korsify-app
```

## Step 5: Connect Cloud Run to Cloud SQL

In Cloud Run service settings:
1. Go to **"Connections"** tab
2. Add Cloud SQL connection
3. Select your `korsify-db` instance
4. Update DATABASE_URL environment variable:
   ```
   postgresql://korsify_user:PASSWORD@/korsify?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
   ```

## Step 6: Set Up Continuous Deployment

Now every push to GitHub automatically deploys to Cloud Run!

### Workflow:
1. Make changes in Replit
2. Commit and push to GitHub (via Git tab)
3. Cloud Build automatically builds and deploys
4. Your app updates on Cloud Run (~5 minutes)

## Environment Variables Needed

Create these in Cloud Run service:
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
GEMINI_API_KEY=<from Secret Manager>
JWT_SECRET=<from Secret Manager>
```

## Monitoring Deployment

### View build status:
```bash
gcloud builds list --limit=5
```

### View Cloud Run logs:
```bash
gcloud run services logs read korsify --region=us-central1
```

### Get service URL:
```bash
gcloud run services describe korsify \
  --region=us-central1 \
  --format="value(status.url)"
```

## Advantages of This Approach

✅ **Continuous Deployment**: Auto-deploys on every git push  
✅ **Version Control**: Full git history and rollback capability  
✅ **No Manual Migration**: Code stays in Replit, deploys to Cloud Run  
✅ **Cost Effective**: Only pay for what you use  
✅ **Scalable**: Auto-scales based on traffic  
✅ **Integrated**: Works with Replit's development workflow  

## Quick Start Commands

```bash
# 1. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  --project=korsify-app

# 2. Create secrets
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-

# 3. Grant permissions
gcloud projects add-iam-policy-binding korsify-app \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.developer"
```

## Total Setup Time: ~20 minutes

Much simpler than migration scripts! 🚀