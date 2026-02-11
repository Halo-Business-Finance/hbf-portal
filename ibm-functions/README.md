# IBM Cloud Functions — Node.js API

Ported from Supabase Edge Functions to a standalone Express API on IBM Code Engine.

## Architecture

```
ibm-functions/
├── Dockerfile            # Node 20 alpine + production build
├── package.json
└── src/
    ├── server.js          # Express app — health check + route mounting
    ├── db.js              # PostgreSQL pool (IBM Cloud Databases)
    ├── auth.js            # JWT verification + role checks
    ├── rate-limit.js      # Server-side rate limiting via DB
    ├── audit-helpers.js   # Shared audit logging
    └── routes/
        ├── audit-logger.js               # POST /api/audit-logger
        ├── loan-application-processor.js # POST /api/loan-application-processor
        └── notification-service.js       # POST /api/notification-service
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | IBM PostgreSQL connection string (postgres://…) |
| `IBM_DB_CA_CERT` | CA certificate for SSL verification |
| `JWT_SECRET` | Secret used to verify JWT tokens |
| `PORT` | Server port (default: 8080) |

## Endpoints

All endpoints require `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/audit-logger` | Log admin actions |
| POST | `/api/loan-application-processor` | Validate/process/update loan applications |
| POST | `/api/notification-service` | Send notifications (email/SMS/webhooks) |

## Deployment

Automatically deployed to IBM Code Engine via `.github/workflows/deploy-ibm-functions.yml`
when changes are pushed to `ibm-functions/`.

### Required GitHub Secrets

- `IBM_CLOUD_API_KEY`
- `IBM_RESOURCE_GROUP`
- `IBM_DATABASE_URL`
- `IBM_DB_CA_CERT`
- `SUPABASE_JWT_SECRET`
