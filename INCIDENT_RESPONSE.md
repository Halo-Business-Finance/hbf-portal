 # Incident Response Plan
 
 This document outlines the procedures for identifying, responding to, and recovering from security incidents in the Halo Business Finance commercial loan marketplace portal.
 
 ---
 
 ## Table of Contents
 
 1. [Incident Classification](#incident-classification)
 2. [Response Team & Roles](#response-team--roles)
 3. [Detection & Identification](#detection--identification)
 4. [Response Procedures](#response-procedures)
 5. [Communication Protocol](#communication-protocol)
 6. [Recovery & Remediation](#recovery--remediation)
 7. [Post-Incident Review](#post-incident-review)
 8. [Regulatory Compliance](#regulatory-compliance)
 
 ---
 
 ## Incident Classification
 
 ### Severity Levels
 
 | Level | Name | Description | Response Time |
 |-------|------|-------------|---------------|
 | **P1** | Critical | Active data breach, system compromise, or ransomware | Immediate (< 15 min) |
 | **P2** | High | Unauthorized access attempt, credential exposure, or DDoS | < 1 hour |
 | **P3** | Medium | Suspicious activity, policy violation, or vulnerability discovery | < 4 hours |
 | **P4** | Low | Failed login attempts, minor policy violations | < 24 hours |
 
 ### Incident Categories
 
 | Category | Examples |
 |----------|----------|
 | **Data Breach** | Unauthorized access to PII, financial data, or loan applications |
 | **Account Compromise** | Stolen credentials, session hijacking, MFA bypass |
 | **System Intrusion** | Malware, unauthorized system access, backdoors |
 | **Denial of Service** | DDoS attacks, resource exhaustion |
 | **Insider Threat** | Unauthorized data access by employees/contractors |
 | **Third-Party Breach** | Compromise of Supabase, Stripe, or other integrations |
 
 ---
 
 ## Response Team & Roles
 
 ### Incident Response Team (IRT)
 
 | Role | Responsibilities |
 |------|------------------|
 | **Incident Commander** | Overall coordination, decision authority, stakeholder communication |
 | **Security Lead** | Technical investigation, forensics, containment actions |
 | **Engineering Lead** | System remediation, patching, infrastructure changes |
 | **Communications Lead** | Internal/external communications, regulatory notifications |
 | **Legal/Compliance** | Regulatory guidance, legal obligations, documentation |
 
 ### Escalation Path
 
 ```
 Detection → Security Lead → Incident Commander → Executive Team → Board (if required)
 ```
 
 ---
 
 ## Detection & Identification
 
 ### Monitoring Sources
 
 | Source | What to Monitor |
 |--------|-----------------|
 | **Audit Logs** | Unusual access patterns, admin actions, data exports |
 | **Supabase Dashboard** | Auth failures, RLS policy violations, unusual queries |
 | **Edge Function Logs** | Error spikes, unauthorized API calls, rate limit triggers |
 | **Application Logs** | Session anomalies, validation failures, XSS attempts |
 | **GitHub Security** | Dependabot alerts, CodeQL findings, secret scanning |
 
 ### Key Indicators of Compromise (IoC)
 
 - Multiple failed authentication attempts from single IP
 - Successful login from unusual geographic location
 - Bulk data exports or unusual query patterns
 - Rate limit threshold exceeded repeatedly
 - Unexpected admin role assignments
 - Database schema modifications outside deployment
 - Edge function invocations from unauthorized origins
 
 ### Initial Triage Checklist
 
 - [ ] Confirm the incident is real (not false positive)
 - [ ] Determine severity level (P1-P4)
 - [ ] Identify affected systems and data
 - [ ] Estimate scope (number of users/records affected)
 - [ ] Document initial findings with timestamps
 - [ ] Notify Incident Commander
 
 ---
 
 ## Response Procedures
 
 ### Phase 1: Containment (Immediate)
 
 **For Account Compromise:**
 ```sql
 -- Immediately revoke all sessions for compromised user
 SELECT auth.sign_out_all_sessions('user_id_here');
 
 -- Disable user account if necessary
 UPDATE auth.users SET banned_until = 'infinity' WHERE id = 'user_id_here';
 ```
 
 **For API/Edge Function Abuse:**
 - Enable emergency rate limiting via `rate_limit_tracking` table
 - Block offending IP addresses at Supabase/CDN level
 - Temporarily disable affected edge functions if necessary
 
 **For Data Breach:**
 - Revoke database access for compromised credentials
 - Rotate Supabase service role keys immediately
 - Enable read-only mode if data integrity is at risk
 
 ### Phase 2: Eradication
 
 - [ ] Remove malicious access (revoke tokens, keys, sessions)
 - [ ] Patch exploited vulnerabilities
 - [ ] Reset compromised credentials
 - [ ] Update RLS policies if bypassed
 - [ ] Deploy security patches to edge functions
 - [ ] Clear any cached malicious data
 
 ### Phase 3: Recovery
 
 - [ ] Restore systems from known-good state if necessary
 - [ ] Re-enable disabled services incrementally
 - [ ] Verify data integrity with checksums/audits
 - [ ] Monitor for continued malicious activity
 - [ ] Gradually restore normal operations
 
 ---
 
 ## Communication Protocol
 
 ### Internal Communication
 
 | Audience | Method | Timing |
 |----------|--------|--------|
 | IRT Members | Secure channel (Slack private channel/Signal) | Immediate |
 | Engineering Team | Internal email + meeting | Within 2 hours |
 | Executive Team | Briefing call | Within 4 hours (P1/P2) |
 | All Staff | Company-wide update | After containment |
 
 ### External Communication
 
 | Audience | Method | Timing | Requirements |
 |----------|--------|--------|--------------|
 | Affected Users | Email notification | Per regulatory timeline | Legal review required |
 | Regulators | Formal notification | Per jurisdiction (see below) | Compliance lead |
 | Media | Press statement | If public disclosure needed | Legal/PR approval |
 | Partners/Vendors | Direct notification | If their data affected | Contract review |
 
 ### Communication Templates
 
 **Initial Internal Alert:**
 ```
 SECURITY INCIDENT - [SEVERITY LEVEL]
 Time Detected: [TIMESTAMP]
 Type: [CATEGORY]
 Status: [INVESTIGATING/CONTAINED/RESOLVED]
 Affected Systems: [LIST]
 Initial Assessment: [BRIEF DESCRIPTION]
 Next Update: [TIME]
 ```
 
 **User Notification (Post Legal Review):**
 ```
 Subject: Important Security Notice from Halo Business Finance
 
 Dear [Customer Name],
 
 We are writing to inform you of a security incident that may have affected your account...
 [Details appropriate to the incident]
 
 Actions we have taken: [LIST]
 Actions you should take: [LIST]
 
 For questions, contact: [SUPPORT CONTACT]
 ```
 
 ---
 
 ## Recovery & Remediation
 
 ### System Recovery Checklist
 
 - [ ] Verify all malicious access has been removed
 - [ ] Confirm all patches have been applied
 - [ ] Test system functionality in staging environment
 - [ ] Validate RLS policies are functioning correctly
 - [ ] Confirm audit logging is operational
 - [ ] Verify rate limiting is active
 - [ ] Test authentication flows
 - [ ] Confirm session management is working
 - [ ] Run security scan to verify remediation
 
 ### Credential Rotation Schedule
 
 | Credential | When to Rotate |
 |------------|----------------|
 | Supabase service_role key | Immediately if exposed |
 | Supabase anon key | If RLS bypass discovered |
 | Stripe API keys | If payment data accessed |
 | Edge function secrets | If function compromised |
 | All user passwords | If auth system breached |
 
 ---
 
 ## Post-Incident Review
 
 ### Timeline Documentation
 
 Document the complete incident timeline:
 
 1. **Detection**: When/how was the incident discovered?
 2. **Notification**: When was the IRT notified?
 3. **Containment**: When was the threat contained?
 4. **Eradication**: When was the threat removed?
 5. **Recovery**: When were systems fully restored?
 6. **Lessons Learned**: What improvements are needed?
 
 ### Post-Mortem Template
 
 ```markdown
 # Incident Post-Mortem: [INCIDENT ID]
 
 ## Summary
 - Date: [DATE]
 - Severity: [P1-P4]
 - Duration: [TIME TO RESOLUTION]
 - Impact: [USERS/SYSTEMS AFFECTED]
 
 ## Root Cause
 [Detailed technical explanation]
 
 ## Timeline
 | Time | Event |
 |------|-------|
 | HH:MM | [Event description] |
 
 ## What Went Well
 - [List positive aspects of response]
 
 ## What Needs Improvement
 - [List areas for improvement]
 
 ## Action Items
 | Item | Owner | Due Date | Status |
 |------|-------|----------|--------|
 | [Action] | [Name] | [Date] | [Status] |
 
 ## Preventive Measures
 [Long-term fixes to prevent recurrence]
 ```
 
 ---
 
 ## Regulatory Compliance
 
 ### Notification Requirements
 
 As a financial services application handling sensitive borrower data, the following regulations may apply:
 
 | Regulation | Notification Timeline | Authority |
 |------------|----------------------|-----------|
 | **GLBA (Gramm-Leach-Bliley Act)** | "As soon as possible" | FTC, State AGs |
 | **State Breach Laws** | Varies (24 hrs - 60 days) | State Attorneys General |
 | **CCPA (California)** | Without unreasonable delay | California AG |
 | **NYDFS Cybersecurity** | 72 hours | NY DFS |
 
 ### Documentation Requirements
 
 Maintain records for minimum **6 years**:
 
 - [ ] Incident detection logs
 - [ ] Response team actions and decisions
 - [ ] Communications (internal and external)
 - [ ] Forensic analysis reports
 - [ ] Remediation steps taken
 - [ ] Post-mortem documentation
 - [ ] Evidence of notification compliance
 
 ### Audit Log Preservation
 
 The `audit_logs` table provides immutable records of:
 - User authentication events
 - Administrative actions
 - Data access patterns
 - System configuration changes
 
 These logs are protected by RLS policies preventing modification and should be preserved for all regulatory inquiries.
 
 ---
 
 ## Quick Reference Card
 
 ### Immediate Actions (First 15 Minutes)
 
 1. **CONFIRM** - Verify incident is real
 2. **CLASSIFY** - Determine severity (P1-P4)
 3. **CONTAIN** - Stop ongoing damage
 4. **COMMUNICATE** - Alert IRT and stakeholders
 5. **DOCUMENT** - Log all actions with timestamps
 
 ### Key Contacts
 
 | Role | Contact Method |
 |------|---------------|
 | Security Lead | [Internal contact] |
 | Incident Commander | [Internal contact] |
 | Legal/Compliance | [Internal contact] |
 | Supabase Support | support@supabase.io |
 | Lovable Support | https://lovable.dev/support |
 
 ### Critical Commands
 
 ```sql
 -- Check recent audit logs for suspicious activity
 SELECT * FROM audit_logs 
 WHERE created_at > NOW() - INTERVAL '1 hour'
 ORDER BY created_at DESC;
 
 -- Check rate limit violations
 SELECT * FROM rate_limit_tracking 
 WHERE blocked_until IS NOT NULL;
 
 -- Review recent login attempts (via Supabase Auth logs)
 -- Access via Supabase Dashboard > Authentication > Logs
 ```
 
 ---
 
 ## Document Control
 
 | Version | Date | Author | Changes |
 |---------|------|--------|---------|
 | 1.0 | 2025-02-05 | Security Team | Initial document |
 
 **Review Schedule**: This document should be reviewed and updated quarterly, or immediately following any security incident.
 
 ---
 
 *This incident response plan is confidential and intended for internal use only.*