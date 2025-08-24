#!/bin/bash

# Korsify GCP Migration - Step 6: Final Verification
echo "========================================="
echo "Step 6: Final Verification & Testing"
echo "========================================="

# Load configuration
source migration-config.env

echo "Running system health checks..."
echo ""

# Check Cloud SQL
echo "1. Checking Cloud SQL database..."
gcloud sql instances describe ${DB_INSTANCE} --format="value(state)" | grep -q "RUNNABLE" && \
  echo "✓ Database is running" || echo "✗ Database is not running"

# Check Cloud Run
echo ""
echo "2. Checking Cloud Run backend..."
gcloud run services describe korsify-backend --region=${REGION} --format="value(status.conditions[0].status)" | grep -q "True" && \
  echo "✓ Backend is running" || echo "✗ Backend is not running"

# Check backend health
echo ""
echo "3. Testing backend API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${BACKEND_URL}/api/health)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Backend API is responding (HTTP $HTTP_CODE)"
else
  echo "⚠ Backend API returned HTTP $HTTP_CODE"
fi

# Check frontend
echo ""
echo "4. Testing frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${FRONTEND_IP})
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Frontend is accessible (HTTP $HTTP_CODE)"
else
  echo "⚠ Frontend returned HTTP $HTTP_CODE"
fi

# Check storage buckets
echo ""
echo "5. Checking storage buckets..."
gsutil ls gs://${UPLOADS_BUCKET} &>/dev/null && \
  echo "✓ Uploads bucket accessible" || echo "✗ Uploads bucket not accessible"
gsutil ls gs://${STATIC_BUCKET} &>/dev/null && \
  echo "✓ Static bucket accessible" || echo "✗ Static bucket not accessible"

echo ""
echo "========================================="
echo "Migration Summary"
echo "========================================="
echo ""
echo "Access URLs:"
echo "- Frontend: http://${FRONTEND_IP}"
echo "- Backend API: ${BACKEND_URL}"
echo ""
echo "Resources Created:"
echo "- Project: ${PROJECT_ID}"
echo "- Database: ${DB_INSTANCE}"
echo "- Backend Service: korsify-backend"
echo "- Storage Buckets: ${UPLOADS_BUCKET}, ${STATIC_BUCKET}"
echo ""
echo "Cost Estimate (monthly):"
echo "- Cloud SQL (db-f1-micro): ~$7-15"
echo "- Cloud Run: ~$0-20 (based on usage)"
echo "- Storage: ~$0-10 (based on storage/bandwidth)"
echo "- Total: ~$10-45/month"
echo ""
echo "========================================="
echo "Post-Migration Tasks:"
echo "========================================="
echo ""
echo "1. Update DNS records to point to: ${FRONTEND_IP}"
echo "2. Set up SSL certificate for HTTPS"
echo "3. Configure monitoring and alerts"
echo "4. Set up automated backups"
echo "5. Review and optimize costs after 1 week"
echo ""
echo "Monitoring Dashboard:"
echo "https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}"
echo ""
echo "========================================="