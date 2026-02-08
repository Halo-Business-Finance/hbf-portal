 # Security Policy
 
 This document outlines the security measures implemented in the Halo Business Finance commercial loan marketplace portal.
 
 ## Reporting a Vulnerability
 
 If you discover a security vulnerability, please report it responsibly:
 
 1. **Do not** create a public GitHub issue for security vulnerabilities
 2. Email security concerns to the development team directly
 3. Include detailed steps to reproduce the issue
 4. Allow up to 48 hours for initial response
 5. We will work with you to understand and address the issue promptly
 
 ---
 
 ## Security Headers
 
 The application implements comprehensive HTTP security headers via nginx:
 
 | Header | Value | Purpose |
 |--------|-------|---------|
 | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS for 1 year |
 | `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking attacks |
 | `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
 | `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter (defense-in-depth) |
 | `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
 | `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables sensitive browser APIs |
 
 ## Content Security Policy (CSP)
 
 A strict CSP is enforced to prevent XSS and data injection attacks:
 
 ```
 default-src 'self';
 script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com;
 style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
 font-src 'self' https://fonts.gstatic.com data:;
 img-src 'self' data: blob: https://*.supabase.co https://*.lovable.app;
 connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.lovable.dev;
 frame-src 'self' https://js.stripe.com;
 frame-ancestors 'self';
 base-uri 'self';
 form-action 'self';
 upgrade-insecure-requests;
 ```
 
 ### CSP Directive Breakdown
 
 | Directive | Allowed Sources | Reason |
 |-----------|-----------------|--------|
 | `default-src` | `'self'` | Baseline restriction to same origin |
 | `script-src` | Self, Supabase, Stripe | Required for auth and payments |
 | `style-src` | Self, Google Fonts | UI styling |
 | `connect-src` | Self, Supabase (HTTP/WSS), Stripe API | API communications |
 | `frame-src` | Self, Stripe | Payment checkout iframe |
 | `frame-ancestors` | `'self'` | Clickjacking protection |
 
 ---
 
 ## Authentication & Session Security
 
 ### Session Management
 - **Session Timeout**: 15 minutes of inactivity (14-minute warning + 1-minute countdown)
 - **Automatic Logout**: Users are logged out after timeout with audio/visual warning
 - **Secure Token Storage**: Sessions managed via Supabase Auth with secure cookies
 
 ### Multi-Factor Authentication
 - MFA support available for enhanced account security
 - TOTP-based authentication supported
 
 ---
 
 ## Database Security
 
 ### Row Level Security (RLS)
 All sensitive tables enforce RLS policies:
 
 | Table | Policy |
 |-------|--------|
 | `loan_applications` | Owner or admin access only |
 | `bank_accounts` | Owner access only |
 | `existing_loans` | Owner or admin access only |
 | `profiles` | Owner access only |
 | `credit_scores` | Owner access only |
 | `borrower_documents` | Owner access only |
 | `notifications` | Owner access only |
 | `audit_logs` | Immutable, admin read-only |
 
 ### Data Protection
 - **Masked Views**: `bank_accounts_masked` view hides full account numbers
 - **Audit Logging**: All sensitive actions logged with immutable audit trail
 - **Database Isolation**: Separate databases for portal and marketing site
 
 ---
 
 ## API & Rate Limiting
 
 ### Server-Side Rate Limiting
 Database-backed rate limiting protects against abuse:
 
 - **Tracking Table**: `rate_limit_tracking` monitors request frequency
 - **Check Function**: `check_rate_limit()` enforces limits per endpoint/identifier
 - **Auto-Cleanup**: Expired rate limit records are automatically purged
 
 ### Edge Function Security
 - All edge functions require authentication (`Authorization` header)
 - Generic error responses prevent information leakage
 - Service role credentials never exposed to clients
 
 ---
 
 ## Input Validation & Sanitization
 
 ### Form Security
 - **Zod Schemas**: All form inputs validated with strict type schemas
 - **Sanitization**: HTML entity encoding, control character stripping
 - **Character Limits**: Enforced on all text inputs
 
 ### SQL Injection Prevention
 - Parameterized queries throughout the codebase
 - No dynamic SQL construction from user input
 
 ### XSS Prevention
 - React's built-in escaping for rendered content
 - HTML entity escaping in PDF generation
 - CSP prevents inline script execution from untrusted sources
 
 ---
 
 ## Dependency Management
 
 ### Automated Scanning
 - **GitHub Dependabot**: Enabled for npm, GitHub Actions, and Docker
 - **Weekly Scans**: Automated checks every Monday at 9 AM EST
 - **Security Alerts**: Automatic PR creation for vulnerable dependencies
 
 ### CodeQL Analysis
 - **Static Analysis**: CodeQL scans on every push/PR to main branch
 - **Scheduled Scans**: Weekly security analysis
 - **Languages**: JavaScript/TypeScript and GitHub Actions
 
 ---
 
 ## Secure Development Practices
 
 ### Environment Variables
 - Private API keys stored as environment secrets (never in code)
 - Publishable keys only where required (Supabase anon key)
 - Build-time variables via secure CI/CD pipeline
 
 ### OAuth & Redirects
 - Origin-validated OAuth redirect URLs
 - `emailRedirectTo` always set with `window.location.origin`
 
 ---
 
 ## Compliance Considerations
 
 As a financial services application handling sensitive borrower data:
 
 - **Data Minimization**: Only collect necessary information
 - **Access Logging**: Comprehensive audit trail for compliance
 - **Encryption**: All data encrypted in transit (TLS) and at rest
 - **Role-Based Access**: Granular permissions (admin, underwriter, customer_service, user)
 
 ---
 
 ## Security Contacts
 
 For security-related inquiries or to report vulnerabilities, contact the development team through appropriate internal channels.
