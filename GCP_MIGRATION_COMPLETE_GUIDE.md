# Complete Google Cloud Platform Migration Guide for Korsify

## Phase 0: Pre-Migration Checklist

### Information I Need From You:

#### 1. Current Environment Details
- [ ] Current PostgreSQL database size (run: `psql -c "SELECT pg_database_size('your_db_name')/1024/1024 as size_mb;"`)
- [ ] Current uploaded files size (run: `du -sh uploads/`)
- [ ] Current monthly active users (approximate)
- [ ] Current server location preference (e.g., US, Europe, Asia)
- [ ] Domain name you want to use (e.g., korsify.com)

#### 2. API Keys and Secrets I Need
```bash
# Create a file called 'migration-secrets.txt' with these values:
GEMINI_API_KEY=your_current_gemini_key
JWT_SECRET=your_current_jwt_secret
DATABASE_URL=your_current_database_url
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
STRIPE_SECRET_KEY=your_stripe_key_if_using
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key_if_using
```

#### 3. Google Account Setup
- [ ] Google account with billing enabled
- [ ] Credit card for GCP billing (they give $300 free credits)
- [ ] Organization name for GCP project

---

## Phase 1: Google Cloud Platform Setup

### Step 1.1: Create GCP Account and Project

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com
   ```

2. **Create New Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Project name: `korsify-production`
   - Project ID: `korsify-prod-[random-numbers]` (auto-generated)
   - Click "Create"

3. **Enable Billing**
   - Go to Billing → Link billing account
   - Add credit card (you get $300 free credits)

### Step 1.2: Install Google Cloud CLI on Your Computer

**For Windows:**
```bash
# Download installer from:
https://cloud.google.com/sdk/docs/install

# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**For Mac:**
```bash
# Using Homebrew
brew install --cask google-cloud-sdk

# Or download from:
https://cloud.google.com/sdk/docs/install-sdk#mac
```

**For Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 1.3: Authenticate and Set Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project korsify-prod-[your-project-id]

# Verify
gcloud config get-value project
```

### Step 1.4: Enable Required APIs

```bash
# Run this command to enable all needed services
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  cloudcdn.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Phase 2: Database Migration

### Step 2.1: Backup Current Database

**On your current server/Replit:**
```bash
# Create backup directory
mkdir -p migration-backup

# Backup PostgreSQL database
pg_dump -h localhost -U your_username -d your_database_name > migration-backup/korsify_backup.sql

# Verify backup size
ls -lh migration-backup/korsify_backup.sql
```

### Step 2.2: Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_14 \
  --tier=db-g1-small \
  --region=us-central1 \
  --network=default \
  --no-assign-ip \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --availability-type=zonal

# Wait for instance to be ready (takes 5-10 minutes)
gcloud sql instances describe korsify-db
```

### Step 2.3: Create Database and User

```bash
# Create database
gcloud sql databases create korsify \
  --instance=korsify-db

# Set root password
gcloud sql users set-password postgres \
  --instance=korsify-db \
  --password='YourStrongPassword123!'

# Create application user
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='AppUserPassword456!'
```

### Step 2.4: Import Database Backup

```bash
# First, upload backup to Cloud Storage
gsutil mb gs://korsify-db-backup
gsutil cp migration-backup/korsify_backup.sql gs://korsify-db-backup/

# Import to Cloud SQL
gcloud sql import sql korsify-db \
  gs://korsify-db-backup/korsify_backup.sql \
  --database=korsify \
  --user=postgres
```

### Step 2.5: Get Database Connection Details

```bash
# Get connection name
gcloud sql instances describe korsify-db --format="value(connectionName)"
# Save this! Format: project:region:instance

# Your new database URL will be:
# postgresql://korsify_user:AppUserPassword456!@/korsify?host=/cloudsql/PROJECT:REGION:INSTANCE
```

---

## Phase 3: File Storage Setup

### Step 3.1: Create Storage Buckets

```bash
# Create bucket for uploaded documents
gsutil mb -p korsify-prod-[project-id] -l us-central1 gs://korsify-uploads

# Create bucket for static files (frontend)
gsutil mb -p korsify-prod-[project-id] -l us-central1 gs://korsify-static

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://korsify-static
```

### Step 3.2: Migrate Existing Files

```bash
# From your current server, upload all files
gsutil -m cp -r uploads/* gs://korsify-uploads/

# Verify upload
gsutil ls -l gs://korsify-uploads/
```

---

## Phase 4: Backend Containerization and Deployment

### Step 4.1: Prepare Your Code

First, let's update your code for Google Cloud:

**Create `.env.production` file:**
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://korsify_user:AppUserPassword456!@/korsify?host=/cloudsql/korsify-prod:us-central1:korsify-db
GOOGLE_CLOUD_BUCKET=korsify-uploads
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 4.2: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 8080

# Start server
CMD ["node", "dist/server/index.js"]
```

### Step 4.3: Create Cloud Build Configuration

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/korsify-backend:$COMMIT_SHA', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/korsify-backend:$COMMIT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'korsify-backend'
    - '--image'
    - 'gcr.io/$PROJECT_ID/korsify-backend:$COMMIT_SHA'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--add-cloudsql-instances'
    - 'korsify-prod:us-central1:korsify-db'
    - '--memory'
    - '1Gi'
    - '--cpu'
    - '1'
    - '--timeout'
    - '300'
    - '--max-instances'
    - '10'

images:
- gcr.io/$PROJECT_ID/korsify-backend:$COMMIT_SHA
```

### Step 4.4: Update Backend Code for Cloud Storage

```typescript
// server/storage-gcp.ts
import { Storage } from '@google-cloud/storage';
import multer from 'multer';

const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET!);

export const multerGoogleStorage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function uploadToGCS(file: Express.Multer.File): Promise<string> {
  const blob = bucket.file(`documents/${Date.now()}-${file.originalname}`);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', reject);
    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });
    blobStream.end(file.buffer);
  });
}
```

### Step 4.5: Set Environment Variables in Cloud Run

```bash
# Create secret for sensitive data
echo -n "your_gemini_api_key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your_jwt_secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your_db_password" | gcloud secrets create DB_PASSWORD --data-file=-

# Deploy with environment variables
gcloud run deploy korsify-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances korsify-prod:us-central1:korsify-db \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_BUCKET=korsify-uploads" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,JWT_SECRET=JWT_SECRET:latest" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10
```

---

## Phase 5: Frontend Deployment

### Step 5.1: Update Frontend Configuration

```typescript
// client/src/config.ts
const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://korsify-backend-xxxxx-uc.a.run.app'  // Your Cloud Run URL
    : 'http://localhost:5000',
  
  GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
};

export default config;
```

### Step 5.2: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with your built app
```

### Step 5.3: Deploy to Cloud Storage + CDN

```bash
# Upload built files to storage
gsutil -m cp -r dist/* gs://korsify-static/

# Set up Cloud CDN
gcloud compute backend-buckets create korsify-backend-bucket \
  --gcs-bucket-name=korsify-static

# Create URL map
gcloud compute url-maps create korsify-lb \
  --default-backend-bucket=korsify-backend-bucket

# Create HTTPS certificate (if you have a domain)
gcloud compute ssl-certificates create korsify-cert \
  --domains=korsify.com \
  --global

# Create HTTPS proxy
gcloud compute target-https-proxies create korsify-https-proxy \
  --ssl-certificates=korsify-cert \
  --url-map=korsify-lb

# Create forwarding rule
gcloud compute forwarding-rules create korsify-https-rule \
  --global \
  --target-https-proxy=korsify-https-proxy \
  --ports=443
```

---

## Phase 6: Testing and Verification

### Step 6.1: Test Database Connection

```bash
# Connect to Cloud SQL
gcloud sql connect korsify-db --user=postgres --database=korsify

# Run test query
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
\q
```

### Step 6.2: Test Backend API

```bash
# Get your Cloud Run URL
gcloud run services describe korsify-backend --region=us-central1 --format="value(status.url)"

# Test health endpoint
curl https://korsify-backend-xxxxx-uc.a.run.app/api/health

# Test API endpoints
curl https://korsify-backend-xxxxx-uc.a.run.app/api/courses
```

### Step 6.3: Test Frontend

```bash
# Get Load Balancer IP
gcloud compute forwarding-rules describe korsify-https-rule --global --format="value(IPAddress)"

# Add to your hosts file for testing (before DNS update)
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts
YOUR_IP_ADDRESS korsify.com
```

---

## Phase 7: DNS and Domain Setup

### Step 7.1: Update DNS Records

In your domain registrar (GoDaddy, Namecheap, etc.):

```
Type: A
Name: @ (or korsify.com)
Value: YOUR_LOAD_BALANCER_IP
TTL: 300

Type: CNAME
Name: www
Value: korsify.com
TTL: 300
```

### Step 7.2: Verify SSL Certificate

```bash
# Check certificate status
gcloud compute ssl-certificates describe korsify-cert --global

# Wait for "ACTIVE" status (can take up to 30 minutes)
```

---

## Phase 8: Monitoring and Logging

### Step 8.1: Set Up Monitoring

```bash
# Enable monitoring APIs
gcloud services enable monitoring.googleapis.com logging.googleapis.com

# Create uptime check
gcloud monitoring uptime-check-configs create korsify-health \
  --display-name="Korsify Health Check" \
  --resource-type=uptime-url \
  --monitored-resource="{'host':'korsify.com','path':'/api/health'}" \
  --period=60
```

### Step 8.2: View Logs

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=korsify-backend" --limit 50

# View error logs only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

---

## Phase 9: Cost Optimization

### Step 9.1: Set Budget Alerts

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Korsify Monthly Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Step 9.2: Enable Autoscaling Settings

```bash
# Update Cloud Run autoscaling
gcloud run services update korsify-backend \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=100 \
  --cpu-throttling \
  --region=us-central1
```

---

## Phase 10: Rollback Plan

### If Something Goes Wrong:

#### Quick Rollback Steps:
```bash
# 1. Point DNS back to old server
# Update A record to old IP address

# 2. Restore database locally
psql -U postgres -d korsify < migration-backup/korsify_backup.sql

# 3. Restart old application
npm run dev

# 4. Verify everything works
```

#### Keep Running in Parallel:
```bash
# Keep both systems running for 1 week
# Monitor GCP version for issues
# Gradually migrate traffic using weighted DNS
```

---

## Migration Timeline

### Day 1: Setup and Database
- [ ] Create GCP account and project
- [ ] Enable APIs
- [ ] Create Cloud SQL instance
- [ ] Migrate database

### Day 2: Backend
- [ ] Update code for Google Cloud
- [ ] Create Docker container
- [ ] Deploy to Cloud Run
- [ ] Test API endpoints

### Day 3: Frontend and Testing
- [ ] Build frontend
- [ ] Deploy to Cloud Storage
- [ ] Set up CDN
- [ ] Complete testing

### Day 4: Go Live
- [ ] Update DNS
- [ ] Monitor for issues
- [ ] Keep old system as backup

---

## Common Issues and Solutions

### Issue 1: Database Connection Fails
```bash
# Check Cloud SQL proxy
gcloud sql instances describe korsify-db

# Verify connection string format
# Must be: /cloudsql/PROJECT:REGION:INSTANCE
```

### Issue 2: File Upload Fails
```bash
# Check bucket permissions
gsutil iam get gs://korsify-uploads

# Add service account permission
gsutil iam ch serviceAccount:YOUR_SA@PROJECT.iam.gserviceaccount.com:objectAdmin gs://korsify-uploads
```

### Issue 3: High Costs
```bash
# Check what's costing money
gcloud billing accounts list
gcloud alpha billing accounts budget list

# Reduce costs
- Use smaller database tier (db-f1-micro)
- Reduce Cloud Run memory (512Mi)
- Enable CDN caching
```

---

## Support Contacts

### Google Cloud Support
- Documentation: https://cloud.google.com/docs
- Community: https://www.googlecloudcommunity.com
- Stack Overflow: Tag with `google-cloud-platform`

### Emergency Contacts
- GCP Support: 1-877-355-5787 (if you have support plan)
- Status Page: https://status.cloud.google.com

---

## Final Checklist

Before considering migration complete:

- [ ] All API endpoints working
- [ ] File uploads functioning
- [ ] Database queries performing well
- [ ] SSL certificate active
- [ ] DNS propagated globally
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Team trained on GCP console
- [ ] Documentation updated
- [ ] Old system backed up

---

## Next Steps After Migration

1. **Week 1**: Monitor closely, keep old system ready
2. **Week 2**: Optimize performance, reduce costs
3. **Month 1**: Implement CI/CD pipeline
4. **Month 2**: Add advanced GCP features (Cloud Functions, Pub/Sub)
5. **Month 3**: Full disaster recovery test

Congratulations! Your application is now running on Google Cloud Platform!