#!/bin/bash

# Korsify GCP Migration - Step 1: Initial Setup
# Run this script after installing gcloud CLI

echo "========================================="
echo "Korsify Migration to Google Cloud"
echo "Step 1: Project Setup"
echo "========================================="

# Configuration variables - USING EXISTING PROJECT
PROJECT_ID="korsify-app"
PROJECT_NAME="Korsify Production"
REGION="us-central1"
ZONE="us-central1-a"

echo ""
echo "Using existing GCP Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set the existing project as default
echo "1. Setting up existing project..."
gcloud config set project $PROJECT_ID

# Verify project exists
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo "ERROR: Project $PROJECT_ID not found!"
    echo "Please make sure you have access to the project 'korsify-app'"
    echo "Run: gcloud projects list"
    exit 1
fi

echo "✓ Project $PROJECT_ID found and set as default"

echo ""
echo "2. Checking billing account..."
# Check if billing is enabled
if gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" | grep -q "True"; then
    echo "✓ Billing is already enabled for this project"
else
    echo "Please ensure billing is enabled for your project:"
    echo "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    echo ""
    read -p "Press enter once you've verified billing is enabled..."
fi

echo ""
echo "3. Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  cloudcdn.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

echo ""
echo "4. Creating Cloud Storage buckets..."
# Create buckets for uploads and static files
gsutil mb -p $PROJECT_ID -l $REGION gs://${PROJECT_ID}-uploads
gsutil mb -p $PROJECT_ID -l $REGION gs://${PROJECT_ID}-static

# Set CORS for uploads bucket
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://${PROJECT_ID}-uploads
rm cors.json

echo ""
echo "5. Creating Cloud SQL instance..."
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=$REGION \
  --network=default \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --availability-type=zonal \
  --root-password="KorsifyRoot2024!"

echo ""
echo "Waiting for Cloud SQL instance to be ready (this takes 5-10 minutes)..."
gcloud sql operations wait --project=$PROJECT_ID $(gcloud sql operations list --instance=korsify-db --project=$PROJECT_ID --format="value(name)" --limit=1)

echo ""
echo "6. Creating database and user..."
gcloud sql databases create korsify --instance=korsify-db

# Create application user
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='KorsifyApp2024!'

echo ""
echo "7. Setting up Secret Manager..."
# Create secrets (we'll populate them later)
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "KorsifyApp2024!" | gcloud secrets create DB_PASSWORD --data-file=-

echo ""
echo "========================================="
echo "Initial Setup Complete!"
echo "========================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Database Instance: korsify-db"
echo "Database Name: korsify"
echo "Database User: korsify_user"
echo "Database Password: KorsifyApp2024!"
echo "Uploads Bucket: gs://${PROJECT_ID}-uploads"
echo "Static Bucket: gs://${PROJECT_ID}-static"
echo ""
echo "IMPORTANT: Save these details!"
echo ""
echo "Next steps:"
echo "1. Update secrets with your actual API keys"
echo "2. Run step2-prepare-code.sh to prepare your application"
echo "========================================="

# Save configuration for next steps
cat > migration-config.env << EOF
PROJECT_ID=$PROJECT_ID
REGION=$REGION
ZONE=$ZONE
DB_INSTANCE=korsify-db
DB_NAME=korsify
DB_USER=korsify_user
DB_PASSWORD=KorsifyApp2024!
UPLOADS_BUCKET=${PROJECT_ID}-uploads
STATIC_BUCKET=${PROJECT_ID}-static
EOF

echo "Configuration saved to migration-config.env"