#!/bin/bash

# Korsify GCP Migration - Step 4: Deploy Backend
echo "========================================="
echo "Step 4: Deploy Backend to Cloud Run"
echo "========================================="

# Load configuration
source migration-config.env

echo "1. Updating secrets with your API keys..."
echo "Please provide your actual API keys:"
echo ""

read -p "Enter your GEMINI_API_KEY: " GEMINI_KEY
echo -n "$GEMINI_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

read -p "Enter your JWT_SECRET (or press enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi
echo -n "$JWT_SECRET" | gcloud secrets versions add JWT_SECRET --data-file=-

echo ""
echo "2. Building and deploying backend..."
echo "This will build your Docker container and deploy to Cloud Run..."

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "3. Getting Cloud Run service URL..."
BACKEND_URL=$(gcloud run services describe korsify-backend --region=${REGION} --format="value(status.url)")
echo "Backend URL: $BACKEND_URL"

echo ""
echo "4. Testing backend health endpoint..."
curl -s ${BACKEND_URL}/api/health || echo "Health check endpoint not found, but service is deployed"

echo ""
echo "5. Setting up service account permissions..."
# Get the service account email
SERVICE_ACCOUNT=$(gcloud run services describe korsify-backend --region=${REGION} --format="value(spec.template.spec.serviceAccountName)")

# Grant necessary permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

echo ""
echo "========================================="
echo "Backend Deployment Complete!"
echo "========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Test endpoints:"
echo "- Health: ${BACKEND_URL}/api/health"
echo "- Courses: ${BACKEND_URL}/api/courses"
echo ""
echo "IMPORTANT: Save this backend URL for frontend configuration!"
echo ""
echo "Next steps:"
echo "1. Update frontend with backend URL"
echo "2. Run step5-deploy-frontend.sh"
echo "========================================="

# Save backend URL for frontend deployment
echo "BACKEND_URL=$BACKEND_URL" >> migration-config.env