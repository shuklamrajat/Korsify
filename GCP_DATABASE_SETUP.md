# 🗄️ Create Cloud SQL Database on GCP

## Step 1: Enable Required APIs

```bash
# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com --project=korsify-app

# Enable Compute Engine API (required for Cloud SQL)
gcloud services enable compute.googleapis.com --project=korsify-app

# Enable Service Networking API (for private connections)
gcloud services enable servicenetworking.googleapis.com --project=korsify-app
```

## Step 2: Create Cloud SQL PostgreSQL Instance

```bash
# Create the database instance
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --availability-type=zonal \
  --authorized-networks=0.0.0.0/0 \
  --project=korsify-app

# This will take 5-10 minutes to complete
```

## Step 3: Set Root Password

```bash
# Set a secure root password
gcloud sql users set-password postgres \
  --instance=korsify-db \
  --password='KorsifyRoot2024!' \
  --project=korsify-app
```

## Step 4: Create Application Database

```bash
# Create the main database
gcloud sql databases create korsify \
  --instance=korsify-db \
  --project=korsify-app
```

## Step 5: Create Application User

```bash
# Create a dedicated user for your app
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='KorsifyApp2024!' \
  --project=korsify-app
```

## Step 6: Get Connection Information

```bash
# Get the connection name (important for Cloud Run)
gcloud sql instances describe korsify-db \
  --format="value(connectionName)" \
  --project=korsify-app

# Get the public IP address
gcloud sql instances describe korsify-db \
  --format="value(ipAddresses[0].ipAddress)" \
  --project=korsify-app
```

## Step 7: Create DATABASE_URL Secret

```bash
# Get the connection name first
CONNECTION_NAME=$(gcloud sql instances describe korsify-db \
  --format="value(connectionName)" \
  --project=korsify-app)

# Create the DATABASE_URL for Cloud Run (uses Unix socket)
DATABASE_URL="postgresql://korsify_user:KorsifyApp2024!@/korsify?host=/cloudsql/$CONNECTION_NAME"

# Store it as a secret
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=korsify-app

echo "DATABASE_URL secret created successfully!"
echo "Connection string: $DATABASE_URL"
```

## Step 8: Test Connection (Optional)

```bash
# Connect to your database to test
gcloud sql connect korsify-db \
  --user=korsify_user \
  --database=korsify \
  --project=korsify-app

# Once connected, you can run SQL commands like:
# \dt (list tables)
# \q (quit)
```

## Your Database Details

After running the commands above, you'll have:

- **Instance Name**: `korsify-db`
- **Database Name**: `korsify`
- **Username**: `korsify_user`
- **Password**: `KorsifyApp2024!`
- **Region**: `us-central1`

## For Cloud Run Deployment

Your `DATABASE_URL` will be:
```
postgresql://korsify_user:KorsifyApp2024!@/korsify?host=/cloudsql/korsify-app:us-central1:korsify-db
```

## For External Access (Development/Testing)

If you need to connect from outside GCP:
```
postgresql://korsify_user:KorsifyApp2024!@[PUBLIC_IP]:5432/korsify
```

## Monitoring Your Database

- **Console**: https://console.cloud.google.com/sql/instances
- **Costs**: ~$7-15/month for db-f1-micro
- **Backup**: Automatic daily backups at 3 AM

## Next Steps

1. Run the commands above to create your database
2. Note down the DATABASE_URL
3. Add it to Cloud Run as a secret
4. Your app will be able to connect to the database

Ready to create your database? Start with Step 1! 🚀