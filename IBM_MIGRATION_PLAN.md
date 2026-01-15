# IBM Cloud Migration Plan

## Overview

Migration from Supabase to IBM Cloud infrastructure for the HBF Portal while maintaining security isolation between the marketing website and the secure borrower portal.

## Architecture Decision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           IBM Cloud                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐          ┌─────────────────────┐                │
│  │   Marketing Site    │          │   Secure Portal     │                │
│  │   (Code Engine)     │          │   (Code Engine)     │                │
│  └──────────┬──────────┘          └──────────┬──────────┘                │
│             │                                 │                           │
│             ▼                                 ▼                           │
│  ┌─────────────────────┐          ┌─────────────────────┐                │
│  │  Marketing DB       │          │  Portal DB          │                │
│  │  (PostgreSQL)       │          │  (PostgreSQL)       │                │
│  │  - Public content   │          │  - Borrower PII     │                │
│  │  - Lead forms       │          │  - Loan apps        │                │
│  │  - Analytics        │          │  - Documents        │                │
│  └─────────────────────┘          │  - Credit scores    │                │
│                                   │  - Bank accounts    │                │
│                                   └─────────────────────┘                │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │              IBM Cloud Object Storage (Shared)                 │       │
│  │  ┌─────────────────────┐    ┌─────────────────────────────┐   │       │
│  │  │ /marketing/         │    │ /portal/                     │   │       │
│  │  │ - Public assets     │    │ - Borrower documents (enc)  │   │       │
│  │  │ - Images/videos     │    │ - Loan documents (enc)      │   │       │
│  │  │ Policy: Public      │    │ Policy: Authenticated only  │   │       │
│  │  └─────────────────────┘    └─────────────────────────────┘   │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌─────────────────────┐                                                 │
│  │   IBM App ID        │◄─── Authentication for Portal                   │
│  │   (Auth Service)    │                                                 │
│  └─────────────────────┘                                                 │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Migration Phases

### Phase 1: Infrastructure Setup
- [ ] Provision dedicated PostgreSQL instance for portal
- [ ] Configure IBM App ID for authentication
- [ ] Set up Object Storage bucket with access policies
- [ ] Configure network security groups

### Phase 2: Database Migration
- [ ] Export Supabase schema
- [ ] Migrate tables to IBM PostgreSQL:
  - `profiles`
  - `user_roles`
  - `loan_applications`
  - `loan_application_status_history`
  - `existing_loans`
  - `bank_accounts`
  - `credit_scores`
  - `borrower_documents`
  - `notifications`
  - `notification_preferences`
  - `audit_logs`
  - `crm_*` tables
  - `external_notification_webhooks`
  - `system_settings`
- [ ] Migrate database functions
- [ ] Set up row-level security equivalent

### Phase 3: Authentication Migration
- [ ] Configure IBM App ID with MFA support
- [ ] Migrate user accounts
- [ ] Update client-side auth context
- [ ] Test authentication flows

### Phase 4: Storage Migration
- [ ] Configure Object Storage access policies
- [ ] Migrate existing documents from Supabase storage
- [ ] Update file upload/download code

### Phase 5: Edge Functions Migration
- [ ] Convert Supabase Edge Functions to IBM Cloud Functions:
  - `admin-dashboard`
  - `health-check`
  - `ibm-database`
  - `loan-application-processor`
  - `notification-service`
  - `send-document-email`
  - `update_profile`

### Phase 6: Client Code Updates
- [ ] Replace Supabase client with IBM services
- [ ] Update API calls to use new endpoints
- [ ] Update environment variables
- [ ] Test all features

### Phase 7: Data Migration & Cutover
- [ ] Final data sync from Supabase
- [ ] DNS cutover
- [ ] Monitor for issues
- [ ] Decommission Supabase

## Security Considerations

### Database Security
- Enable SSL/TLS for all connections
- Use connection pooling with pgBouncer
- Implement database-level encryption at rest
- Configure IP allowlisting
- Set up automated backups

### Authentication Security
- Enable MFA via IBM App ID
- Configure session timeout policies
- Implement account lockout after failed attempts
- Enable audit logging

### Storage Security
- Server-side encryption (SSE-S3)
- Access policies per prefix
- Signed URLs for document access
- Audit trail for all file operations

## Environment Variables

### Current (Supabase)
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

### Target (IBM Cloud)
```
VITE_IBM_APP_ID_CLIENT_ID
VITE_IBM_APP_ID_DISCOVERY_ENDPOINT
VITE_IBM_API_GATEWAY_URL
VITE_IBM_COS_ENDPOINT
VITE_IBM_COS_BUCKET
IBM_PORTAL_DATABASE_URL (server-side only)
IBM_COS_API_KEY (server-side only)
IBM_APP_ID_SECRET (server-side only)
```

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Infrastructure | 1-2 days | IBM Cloud access |
| Phase 2: Database | 2-3 days | Phase 1 |
| Phase 3: Auth | 2-3 days | Phase 1 |
| Phase 4: Storage | 1-2 days | Phase 1 |
| Phase 5: Functions | 3-5 days | Phase 2, 3, 4 |
| Phase 6: Client Code | 3-5 days | Phase 5 |
| Phase 7: Cutover | 1 day | Phase 6 |

**Total: ~2-3 weeks**

## Rollback Plan

1. Keep Supabase project active during migration
2. Maintain data sync until cutover complete
3. DNS rollback within 5 minutes if needed
4. Document all configuration changes

## Next Steps

1. Provision IBM PostgreSQL instance for portal
2. Export current Supabase schema
3. Begin Phase 1 infrastructure setup
