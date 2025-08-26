#!/bin/bash

# Script to create Cloud SQL database for Korsify on GCP
echo "========================================="
echo "Creating Cloud SQL Database for Korsify"
echo "========================================="

PROJECT_ID="korsify-app"
INSTANCE_NAME="korsify-db"
DATABASE_NAME="korsify"
APP_USER="korsify_user"
APP_PASSWORD="KorsifyApp2024!"
REGION="us-central1"

echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Database: $DATABASE_NAME"
echo ""

# Step 1: Enable APIs
echo "1. Enabling required APIs..."
gcloud services enable sqladmin.googleapis.com --project=$PROJECT_ID
gcloud services enable compute.googleapis.com --project=$PROJECT_ID
gcloud services enable servicenetworking.googleapis.com --project=$PROJECT_ID

echo ""
echo "2. Creating Cloud SQL instance (this takes 5-10 minutes)..."
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --availability-type=zonal \
  --authorized-networks=0.0.0.0/0 \
  --project=$PROJECT_ID

if [ $? -ne 0 ]; then
    echo "Failed to create database instance. It might already exist."
    echo "Continuing with existing instance..."
fi

echo ""
echo "3. Setting root password..."
gcloud sql users set-password postgres \
  --instance=$INSTANCE_NAME \
  --password='KorsifyRoot2024!' \
  --project=$PROJECT_ID

echo ""
echo "4. Creating application database..."
gcloud sql databases create $DATABASE_NAME \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID

echo ""
echo "5. Creating application user..."
gcloud sql users create $APP_USER \
  --instance=$INSTANCE_NAME \
  --password="$APP_PASSWORD" \
  --project=$PROJECT_ID

echo ""
echo "6. Getting connection information..."
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)" \
  --project=$PROJECT_ID)

PUBLIC_IP=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(ipAddresses[0].ipAddress)" \
  --project=$PROJECT_ID)

echo "Connection Name: $CONNECTION_NAME"
echo "Public IP: $PUBLIC_IP"

echo ""
echo "7. Creating DATABASE_URL secret..."
DATABASE_URL="postgresql://$APP_USER:$APP_PASSWORD@/$DATABASE_NAME?host=/cloudsql/$CONNECTION_NAME"

# Create the secret (or update if exists)
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=$PROJECT_ID 2>/dev/null || \
echo -n "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL \
  --data-file=- \
  --project=$PROJECT_ID

echo ""
echo "========================================="
echo "Database Setup Complete!"
echo "========================================="
echo ""
echo "Your database details:"
echo "- Instance: $INSTANCE_NAME"
echo "- Database: $DATABASE_NAME" 
echo "- User: $APP_USER"
echo "- Password: $APP_PASSWORD"
echo "- Connection: $CONNECTION_NAME"
echo "- Public IP: $PUBLIC_IP"
echo ""
echo "DATABASE_URL (for Cloud Run):"
echo "$DATABASE_URL"
echo ""
echo "DATABASE_URL (for external access):"
echo "postgresql://$APP_USER:$APP_PASSWORD@$PUBLIC_IP:5432/$DATABASE_NAME"
echo ""
echo "Secret 'DATABASE_URL' has been created in Secret Manager"
echo ""
echo "Next steps:"
echo "1. Test connection: gcloud sql connect $INSTANCE_NAME --user=$APP_USER --database=$DATABASE_NAME"
echo "2. Add DATABASE_URL secret to your Cloud Run service"
echo "3. Deploy your application"
echo "========================================="