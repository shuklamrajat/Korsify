#!/bin/bash

# Korsify GCP Migration - Step 3: Database Migration
echo "========================================="
echo "Step 3: Database Migration"
echo "========================================="

# Load configuration
source migration-config.env

echo "1. Creating database backup..."
echo "Backing up current database..."

# Create backup directory
mkdir -p migration-backup

# Export database (adjust connection details as needed)
echo "Enter your current database connection details:"
read -p "Database host (default: localhost): " CURRENT_DB_HOST
CURRENT_DB_HOST=${CURRENT_DB_HOST:-localhost}

read -p "Database name (default: korsify): " CURRENT_DB_NAME
CURRENT_DB_NAME=${CURRENT_DB_NAME:-korsify}

read -p "Database user (default: postgres): " CURRENT_DB_USER
CURRENT_DB_USER=${CURRENT_DB_USER:-postgres}

echo "Creating backup..."
pg_dump -h $CURRENT_DB_HOST -U $CURRENT_DB_USER -d $CURRENT_DB_NAME > migration-backup/korsify_backup_$(date +%Y%m%d_%H%M%S).sql

if [ $? -ne 0 ]; then
    echo "Database backup failed. Please check your connection details."
    exit 1
fi

BACKUP_FILE=$(ls -t migration-backup/*.sql | head -1)
echo "Backup created: $BACKUP_FILE"

echo ""
echo "2. Uploading backup to Cloud Storage..."
gsutil cp $BACKUP_FILE gs://${UPLOADS_BUCKET}/database-backup/

echo ""
echo "3. Getting Cloud SQL connection details..."
CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE} --format="value(connectionName)")
echo "Connection name: $CONNECTION_NAME"

echo ""
echo "4. Importing database to Cloud SQL..."
gcloud sql import sql ${DB_INSTANCE} \
  gs://${UPLOADS_BUCKET}/database-backup/$(basename $BACKUP_FILE) \
  --database=${DB_NAME} \
  --user=postgres

if [ $? -ne 0 ]; then
    echo "Database import failed. Retrying with different method..."
    
    # Alternative method: Connect via proxy
    echo "Starting Cloud SQL proxy..."
    cloud_sql_proxy -instances=${CONNECTION_NAME}=tcp:5433 &
    PROXY_PID=$!
    
    sleep 5
    
    echo "Importing via proxy..."
    psql -h localhost -p 5433 -U postgres -d ${DB_NAME} < $BACKUP_FILE
    
    kill $PROXY_PID
fi

echo ""
echo "5. Creating database connection string secret..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=- 2>/dev/null || \
echo -n "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=-

echo ""
echo "6. Verifying database migration..."
echo "Testing connection to Cloud SQL..."
gcloud sql connect ${DB_INSTANCE} --user=${DB_USER} --database=${DB_NAME} << EOF
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
\q
EOF

echo ""
echo "========================================="
echo "Database Migration Complete!"
echo "========================================="
echo ""
echo "Database details:"
echo "- Instance: ${DB_INSTANCE}"
echo "- Database: ${DB_NAME}"
echo "- User: ${DB_USER}"
echo "- Connection: ${CONNECTION_NAME}"
echo ""
echo "Next steps:"
echo "1. Run step4-deploy-backend.sh to deploy your backend"
echo "========================================="