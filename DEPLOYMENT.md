# IBM Cloud Code Engine Deployment Guide

This document outlines the deployment process for the HBF Portal to IBM Cloud Code Engine.

## Prerequisites

- IBM Cloud account with access to:
  - Container Registry
  - Code Engine
  - Databases for PostgreSQL
- GitHub repository connected to Lovable
- GitHub Actions enabled

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  IBM Container  │────▶│  Code Engine    │
│   (main branch) │     │    Registry     │     │   Application   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ IBM PostgreSQL  │
                                                │    Database     │
                                                └─────────────────┘
```

## GitHub Secrets Required

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `IBM_CLOUD_API_KEY` | IBM Cloud API key | IBM Cloud → Manage → Access (IAM) → API keys |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `IBM_DATABASE_URL` | PostgreSQL connection string | IBM Cloud → Databases → Service credentials |

## One-Time IBM Cloud Setup

Run these commands once to set up your IBM Cloud resources:

```bash
# Login to IBM Cloud
ibmcloud login --apikey YOUR_API_KEY -r us-south

# Create Container Registry namespace
ibmcloud cr namespace-add halo-website

# Create Code Engine project
ibmcloud ce project create --name hbf-portal

# Select the project
ibmcloud ce project select --name hbf-portal

# Create registry secret for Code Engine to pull images
ibmcloud ce registry create \
  --name icr-secret \
  --server private.us.icr.io \
  --username iamapikey \
  --password YOUR_API_KEY

# Create the initial application
ibmcloud ce application create \
  --name hbf-portal \
  --image private.us.icr.io/halo-website/hbf-portal:latest \
  --registry-secret icr-secret \
  --port 80 \
  --min-scale 1 \
  --max-scale 10
```

## Deployment Process

### Automatic Deployment

Push to the `main` branch triggers automatic deployment:

1. GitHub Actions builds Docker image
2. Image is pushed to IBM Container Registry
3. Code Engine application is updated

### Manual Deployment

Trigger manually via GitHub Actions:
1. Go to **Actions** tab
2. Select **Deploy to IBM Code Engine**
3. Click **Run workflow**

## Environment Variables

The following environment variables are set in Code Engine:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | IBM PostgreSQL connection string |

## Health Check

The application includes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-13T12:00:00.000Z",
  "services": {
    "database": "connected",
    "supabase": "connected"
  }
}
```

## Troubleshooting

### View Application Logs

```bash
ibmcloud ce project select --name hbf-portal
ibmcloud ce application logs --name hbf-portal
```

### Check Application Status

```bash
ibmcloud ce application get --name hbf-portal
```

### Force Redeploy

```bash
ibmcloud ce application update \
  --name hbf-portal \
  --image private.us.icr.io/halo-website/hbf-portal:latest
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `BXNIM0109E` API key error | Verify `IBM_CLOUD_API_KEY` secret is set correctly |
| Image pull failed | Check registry secret configuration |
| Database connection failed | Verify `IBM_DATABASE_URL` format and SSL settings |

## Database Connection

The IBM PostgreSQL connection string format:

```
postgres://username:password@host:port/database?sslmode=verify-full
```

Get credentials from: **IBM Cloud → Databases for PostgreSQL → Service credentials**

## Scaling

Adjust scaling in Code Engine:

```bash
ibmcloud ce application update \
  --name hbf-portal \
  --min-scale 1 \
  --max-scale 20 \
  --cpu 0.5 \
  --memory 1G
```

## Security Considerations

- All secrets are stored in GitHub Secrets (encrypted)
- Database connections use SSL/TLS
- Container images are stored in private registry
- Code Engine provides automatic HTTPS
