# 🗄️ Simple GCP Database Setup

## Prerequisites
Make sure you have:
- Google Cloud CLI installed (`gcloud --version`)
- Logged into GCP (`gcloud auth login`)
- Project `korsify-app` selected

## Step 1: Quick Setup Command

```bash
# Make the script executable and run it
chmod +x create-gcp-database.sh
./create-gcp-database.sh
```

This single command will:
1. Enable required APIs
2. Create Cloud SQL PostgreSQL instance
3. Set up database and user
4. Create DATABASE_URL secret

## Step 2: Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Enable APIs
gcloud services enable sqladmin.googleapis.com --project=korsify-app

# 2. Create database instance (takes 5-10 minutes)
gcloud sql instances create korsify-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --authorized-networks=0.0.0.0/0 \
  --project=korsify-app

# 3. Create database
gcloud sql databases create korsify --instance=korsify-db --project=korsify-app

# 4. Create user
gcloud sql users create korsify_user \
  --instance=korsify-db \
  --password='KorsifyApp2024!' \
  --project=korsify-app

# 5. Get connection info and create secret
CONNECTION_NAME=$(gcloud sql instances describe korsify-db \
  --format="value(connectionName)" --project=korsify-app)

DATABASE_URL="postgresql://korsify_user:KorsifyApp2024!@/korsify?host=/cloudsql/$CONNECTION_NAME"

echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL \
  --data-file=- --project=korsify-app
```

## Your Database Details

After setup, you'll have:
- **Instance**: `korsify-db`
- **Database**: `korsify`
- **User**: `korsify_user`
- **Password**: `KorsifyApp2024!`
- **Region**: `us-central1`

## DATABASE_URL Format

For Cloud Run (what you'll use):
```
postgresql://korsify_user:KorsifyApp2024!@/korsify?host=/cloudsql/korsify-app:us-central1:korsify-db
```

## Testing Your Database

```bash
# Connect to test
gcloud sql connect korsify-db --user=korsify_user --database=korsify --project=korsify-app

# Inside database, run:
# \dt (list tables)
# \q (quit)
```

## Cost

- **Database**: ~$7-15/month (db-f1-micro)
- **Storage**: ~$1-3/month (10GB)
- **Total**: ~$8-18/month

## Next Steps After Database Creation

1. **Note the DATABASE_URL** (shown in script output)
2. **Add to Cloud Run** as a secret reference
3. **Deploy your app** - it will connect automatically

Run the script now to create your database!

```bash
./create-gcp-database.sh
```