#!/bin/bash

# Korsify GCP Migration - Step 5: Deploy Frontend
echo "========================================="
echo "Step 5: Deploy Frontend to Cloud Storage"
echo "========================================="

# Load configuration
source migration-config.env

echo "1. Updating frontend configuration..."
echo "Updating API URL in frontend code..."

# Update the frontend config
cat > client/src/config.ts << EOF
const config = {
  API_URL: import.meta.env.PROD 
    ? '${BACKEND_URL}'
    : 'http://localhost:5000',
  
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

export default config;
EOF

echo ""
echo "2. Building frontend for production..."
cd client
npm install
npm run build
cd ..

echo ""
echo "3. Uploading frontend to Cloud Storage..."
gsutil -m cp -r client/dist/* gs://${STATIC_BUCKET}/

echo ""
echo "4. Setting up Cloud CDN and Load Balancer..."

# Create backend bucket
gcloud compute backend-buckets create korsify-frontend-bucket \
  --gcs-bucket-name=${STATIC_BUCKET} \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC

# Create URL map
gcloud compute url-maps create korsify-lb \
  --default-backend-bucket=korsify-frontend-bucket

# Reserve IP address
gcloud compute addresses create korsify-ip \
  --global \
  --ip-version=IPV4

IP_ADDRESS=$(gcloud compute addresses describe korsify-ip --global --format="value(address)")
echo "Reserved IP address: $IP_ADDRESS"

# Create HTTP(S) proxy
gcloud compute target-http-proxies create korsify-http-proxy \
  --url-map=korsify-lb

# Create forwarding rule
gcloud compute forwarding-rules create korsify-http-rule \
  --global \
  --target-http-proxy=korsify-http-proxy \
  --ports=80 \
  --address=korsify-ip

echo ""
echo "5. Setting up custom domain (optional)..."
echo "If you have a domain, create these DNS records:"
echo ""
echo "Type: A"
echo "Name: @ (or your domain)"
echo "Value: $IP_ADDRESS"
echo ""
echo "Type: CNAME"
echo "Name: www"
echo "Value: your-domain.com"
echo ""

echo "========================================="
echo "Frontend Deployment Complete!"
echo "========================================="
echo ""
echo "Your application is now accessible at:"
echo "- HTTP: http://$IP_ADDRESS"
echo "- Backend API: $BACKEND_URL"
echo ""
echo "To enable HTTPS with a custom domain:"
echo "1. Point your domain to IP: $IP_ADDRESS"
echo "2. Run: gcloud compute ssl-certificates create korsify-cert --domains=yourdomain.com --global"
echo "3. Run: gcloud compute target-https-proxies create korsify-https-proxy --ssl-certificates=korsify-cert --url-map=korsify-lb"
echo "4. Run: gcloud compute forwarding-rules create korsify-https-rule --global --target-https-proxy=korsify-https-proxy --ports=443 --address=korsify-ip"
echo ""
echo "Next steps:"
echo "1. Test your application at http://$IP_ADDRESS"
echo "2. Configure your domain DNS if you have one"
echo "3. Run step6-final-checks.sh for verification"
echo "========================================="

# Save frontend URL for reference
echo "FRONTEND_IP=$IP_ADDRESS" >> migration-config.env