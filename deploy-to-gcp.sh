#!/bin/bash

# GCP Deployment Script for Korsify Platform
# This script helps you deploy your application to Google Cloud Platform

set -e

echo "========================================="
echo "   Korsify GCP Deployment Script"
echo "========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prompt for configuration
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter your preferred region (default: us-central1): " REGION
REGION=${REGION:-us-central1}

# Set the project
echo ""
echo "Setting up GCP project..."
gcloud config set project $PROJECT_ID

# Update cloudbuild.yaml with the correct region
sed -i.bak "s/'us-central1'/'$REGION'/g" cloudbuild.yaml

# Update the Cloud SQL instance in cloudbuild.yaml
sed -i.bak "s/\$PROJECT_ID:us-central1:korsify-db/$PROJECT_ID:$REGION:korsify-db/g" cloudbuild.yaml

echo ""
echo "Checking if Cloud SQL instance exists..."
if gcloud sql instances describe korsify-db --project=$PROJECT_ID 2>/dev/null; then
    echo "Cloud SQL instance 'korsify-db' already exists."
else
    echo "Creating Cloud SQL instance..."
    gcloud sql instances create korsify-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --network=default \
        --project=$PROJECT_ID
    
    read -sp "Enter a password for the PostgreSQL 'postgres' user: " DB_PASSWORD
    echo ""
    
    gcloud sql users set-password postgres \
        --instance=korsify-db \
        --password="$DB_PASSWORD" \
        --project=$PROJECT_ID
    
    gcloud sql databases create korsify \
        --instance=korsify-db \
        --project=$PROJECT_ID
fi

echo ""
echo "Setting up Cloud Storage bucket..."
BUCKET_NAME="korsify-uploads-$PROJECT_ID"
if gsutil ls -b gs://$BUCKET_NAME 2>/dev/null; then
    echo "Storage bucket already exists."
else
    gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME/
    
    # Set CORS
    echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT"], "maxAgeSeconds": 3600}]' > /tmp/cors.json
    gsutil cors set /tmp/cors.json gs://$BUCKET_NAME/
    rm /tmp/cors.json
fi

echo ""
echo "Setting up secrets..."
echo "You'll need:"
echo "1. Your Gemini API key from https://makersuite.google.com/app/apikey"
echo "2. A secure JWT secret (a long random string)"
echo ""

# Check if secrets exist
if gcloud secrets describe gemini-api-key --project=$PROJECT_ID 2>/dev/null; then
    echo "Secret 'gemini-api-key' already exists."
    read -p "Do you want to update it? (y/n): " UPDATE_GEMINI
    if [ "$UPDATE_GEMINI" = "y" ]; then
        read -sp "Enter your Gemini API key: " GEMINI_KEY
        echo ""
        echo -n "$GEMINI_KEY" | gcloud secrets versions add gemini-api-key --data-file=- --project=$PROJECT_ID
    fi
else
    read -sp "Enter your Gemini API key: " GEMINI_KEY
    echo ""
    echo -n "$GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=- --project=$PROJECT_ID
fi

if gcloud secrets describe jwt-secret --project=$PROJECT_ID 2>/dev/null; then
    echo "Secret 'jwt-secret' already exists."
else
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: $JWT_SECRET"
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID
fi

# Grant permissions
echo ""
echo "Setting up permissions..."
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID 2>/dev/null || true

gcloud secrets add-iam-policy-binding jwt-secret \
    --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID 2>/dev/null || true

echo ""
echo "========================================="
echo "   Deploying Backend to Cloud Run"
echo "========================================="
echo ""

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID

# Get the backend URL
BACKEND_URL=$(gcloud run services describe korsify-backend --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)

echo ""
echo "========================================="
echo "   Backend Deployment Complete!"
echo "========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Update client/.env.production with:"
echo "   VITE_API_URL=$BACKEND_URL"
echo ""
echo "2. Build the frontend:"
echo "   npm run build"
echo ""
echo "3. Deploy frontend to Firebase Hosting or another service"
echo ""
echo "4. Test your deployment:"
echo "   curl $BACKEND_URL/api/health"
echo ""
echo "========================================="