#!/bin/bash

# GCP Deployment Script for Korsify
# Run this in Google Cloud Shell

set -e

echo "==================================="
echo "Korsify GCP Deployment Script"
echo "==================================="

# Configuration
PROJECT_NAME="korsify"
REGION="us-central1"
DB_INSTANCE_NAME="korsify-db"
DB_NAME="korsify"
DB_USER="korsify_user"
BUCKET_NAME="${PROJECT_NAME}-uploads-${RANDOM}"
SERVICE_NAME="korsify-backend"

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project selected. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Using Project: $PROJECT_ID"
echo "📍 Region: $REGION"

# Enable required APIs
echo ""
echo "🔧 Enabling required GCP APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    storage-api.googleapis.com \
    compute.googleapis.com

# Create Cloud SQL instance
echo ""
echo "🗄️ Creating Cloud SQL PostgreSQL instance..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=admin123 \
    --database-flags=max_connections=50 \
    --no-backup || echo "Instance may already exist, continuing..."

# Wait for instance to be ready
echo "⏳ Waiting for Cloud SQL instance to be ready..."
sleep 10

# Create database
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME || echo "Database may already exist, continuing..."

# Create user
echo "👤 Creating database user..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD || echo "User may already exist, updating password..."

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

# Create storage bucket
echo ""
echo "🪣 Creating Cloud Storage bucket..."
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME/ || echo "Bucket may already exist, continuing..."

# Store secrets
echo ""
echo "🔐 Storing secrets in Secret Manager..."

# Database URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
echo $DATABASE_URL | gcloud secrets create DATABASE_URL --data-file=- || \
    echo $DATABASE_URL | gcloud secrets versions add DATABASE_URL --data-file=-

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=- || \
    echo $JWT_SECRET | gcloud secrets versions add JWT_SECRET --data-file=-

# Storage bucket
echo $BUCKET_NAME | gcloud secrets create STORAGE_BUCKET --data-file=- || \
    echo $BUCKET_NAME | gcloud secrets versions add STORAGE_BUCKET --data-file=-

echo ""
echo "❓ Please enter your Gemini API Key (from https://makersuite.google.com/app/apikey):"
read -s GEMINI_API_KEY
echo $GEMINI_API_KEY | gcloud secrets create GEMINI_API_KEY --data-file=- || \
    echo $GEMINI_API_KEY | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Build and deploy
echo ""
echo "🏗️ Building and deploying application..."

# Create service account for Cloud Run
SERVICE_ACCOUNT="${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts create $SERVICE_NAME \
    --display-name="Cloud Run Service Account for Korsify" || echo "Service account may already exist..."

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/storage.objectAdmin"

# Submit build
echo "🚀 Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "PORT=8080" \
    --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest" \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --set-secrets "STORAGE_BUCKET=STORAGE_BUCKET:latest" \
    --service-account $SERVICE_ACCOUNT \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo "✅ Deployment Complete!"
echo "==================================="
echo "📌 Your app is live at: $SERVICE_URL"
echo "📊 Database: $DB_INSTANCE_NAME"
echo "🪣 Storage: gs://$BUCKET_NAME"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Update your frontend .env.production with: VITE_API_URL=$SERVICE_URL"
echo "2. Test your application at: $SERVICE_URL"
echo "3. Monitor logs: gcloud run logs read --service=$SERVICE_NAME --region=$REGION"