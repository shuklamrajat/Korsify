# 🚀 Korsify Google Cloud Migration - Start Here

## Prerequisites Checklist
Before starting, ensure you have:
- [ ] A Google account
- [ ] Credit card for billing (you get $300 free credits)
- [ ] 30-60 minutes for the migration
- [ ] Access to your current database

## Step 0: Install Google Cloud CLI

### For Windows:
1. Download installer: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow prompts
3. Open a new Command Prompt/PowerShell

### For Mac:
```bash
brew install --cask google-cloud-sdk
```

### For Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Verify Installation:
```bash
gcloud --version
```

## Step 1: Initial Setup

1. **Login to Google Cloud:**
```bash
gcloud auth login
```

2. **Verify Your Existing Project:**
   - Your existing project: **korsify-app**
   - Go to: https://console.cloud.google.com
   - Make sure billing is enabled (required for resources)

3. **Run Setup Script:**
```bash
cd migration
chmod +x *.sh
./step1-gcp-setup.sh
```
This will:
- Configure your existing korsify-app project
- Enable required APIs
- Create Cloud SQL database
- Set up storage buckets

**⏱️ Time: 15 minutes**

## Step 2: Prepare Your Code

```bash
./step2-prepare-code.sh
```
This creates:
- Dockerfile for containerization
- Cloud Build configuration
- Production environment files

**⏱️ Time: 2 minutes**

## Step 3: Migrate Database

```bash
./step3-database-migration.sh
```
You'll need:
- Your current database connection details
- Database will be backed up first
- Then imported to Cloud SQL

**⏱️ Time: 10-20 minutes**

## Step 4: Deploy Backend

```bash
./step4-deploy-backend.sh
```
You'll be asked for:
- Your GEMINI_API_KEY
- JWT_SECRET (or one will be generated)

**⏱️ Time: 10 minutes**

## Step 5: Deploy Frontend

```bash
./step5-deploy-frontend.sh
```
This will:
- Build your React app
- Upload to Cloud Storage
- Set up CDN

**⏱️ Time: 10 minutes**

## Step 6: Verify Everything

```bash
./step6-final-checks.sh
```
This runs health checks on all components.

**⏱️ Time: 2 minutes**

## Quick Start Commands

If you want to run everything at once:
```bash
# Make scripts executable
chmod +x migration/*.sh

# Run all steps
cd migration
./step1-gcp-setup.sh && \
./step2-prepare-code.sh && \
./step3-database-migration.sh && \
./step4-deploy-backend.sh && \
./step5-deploy-frontend.sh && \
./step6-final-checks.sh
```

## What You'll Need to Provide

### During Step 1:
- Link your billing account (in browser)

### During Step 3 (Database):
- Current database host (probably localhost)
- Database name (probably korsify)
- Database username

### During Step 4 (Backend):
- GEMINI_API_KEY
- JWT_SECRET (optional, can be generated)

## Troubleshooting

### If database connection fails:
```bash
# Check if database is accessible
gcloud sql instances describe korsify-db
```

### If deployment fails:
```bash
# Check Cloud Run logs
gcloud logs read --project=YOUR_PROJECT_ID
```

### If frontend doesn't load:
```bash
# Check if files uploaded
gsutil ls gs://YOUR_PROJECT_ID-static/
```

## After Migration

1. **Update DNS** (if you have a domain)
2. **Test all features**
3. **Monitor costs** in GCP Console
4. **Set up backups** (automated by default)

## Support

- Google Cloud Console: https://console.cloud.google.com
- View logs: https://console.cloud.google.com/logs
- Monitor costs: https://console.cloud.google.com/billing

## Estimated Costs

- **During migration**: ~$0 (covered by free tier)
- **Monthly after**: $10-45 depending on usage
- **Free credits**: $300 (lasts 2-6 months typically)

---

Ready? Start with Step 0 (Install Google Cloud CLI) above! 🎯