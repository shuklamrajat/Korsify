#!/bin/bash

# Korsify GCP Migration - Step 2: Prepare Code for Deployment
echo "========================================="
echo "Step 2: Preparing Code for GCP"
echo "========================================="

# Load configuration
source migration-config.env

echo "1. Creating production environment file..."
cat > .env.production << EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}
GOOGLE_CLOUD_BUCKET=${UPLOADS_BUCKET}
GEMINI_API_KEY=\${GEMINI_API_KEY}
JWT_SECRET=\${JWT_SECRET}
EOF

echo "2. Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install PostgreSQL client and build tools
RUN apk add --no-cache postgresql-client python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build || echo "No build script, using source directly"

# Remove dev dependencies
RUN npm prune --production

# Create necessary directories
RUN mkdir -p uploads

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
EOF

echo "3. Creating .dockerignore..."
cat > .dockerignore << 'EOF'
node_modules
.git
.gitignore
*.md
.env
.env.local
.env.development
dist
build
coverage
.vscode
.idea
*.log
migration/
uploads/
EOF

echo "4. Creating Cloud Build configuration..."
cat > cloudbuild.yaml << EOF
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/${PROJECT_ID}/korsify-backend:latest', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/${PROJECT_ID}/korsify-backend:latest']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'korsify-backend'
    - '--image'
    - 'gcr.io/${PROJECT_ID}/korsify-backend:latest'
    - '--region'
    - '${REGION}'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--add-cloudsql-instances'
    - '${PROJECT_ID}:${REGION}:${DB_INSTANCE}'
    - '--set-env-vars'
    - 'NODE_ENV=production,PORT=8080,GOOGLE_CLOUD_BUCKET=${UPLOADS_BUCKET}'
    - '--set-secrets'
    - 'GEMINI_API_KEY=GEMINI_API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,DATABASE_URL=DATABASE_URL:latest'
    - '--memory'
    - '1Gi'
    - '--cpu'
    - '1'
    - '--timeout'
    - '300'
    - '--min-instances'
    - '0'
    - '--max-instances'
    - '10'

images:
- gcr.io/${PROJECT_ID}/korsify-backend:latest
EOF

echo "5. Creating package.json scripts update..."
cat > update-package.json << 'EOF'
// Add this to your package.json scripts section:
"scripts": {
  "start": "node server/index.js",
  "build": "tsc",
  "deploy": "gcloud builds submit --config cloudbuild.yaml"
}
EOF

echo ""
echo "========================================="
echo "Code Preparation Complete!"
echo "========================================="
echo ""
echo "Files created:"
echo "- .env.production (environment variables)"
echo "- Dockerfile (container configuration)"
echo "- .dockerignore (files to exclude)"
echo "- cloudbuild.yaml (deployment configuration)"
echo ""
echo "Next steps:"
echo "1. Update your actual API keys in Secret Manager"
echo "2. Run step3-database-migration.sh to migrate your database"
echo "========================================="