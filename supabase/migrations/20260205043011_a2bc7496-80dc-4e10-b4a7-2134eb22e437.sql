-- ============================================================
-- DEFENSE-IN-DEPTH: Add RESTRICTIVE policies to deny anonymous access
-- These policies use AND logic with existing policies, ensuring
-- that even if a permissive policy is misconfigured, anonymous
-- users cannot access data.
-- ============================================================

-- loan_applications: Require authentication for all operations
CREATE POLICY "Require auth for loan_applications"
ON public.loan_applications
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- existing_loans: Require authentication for all operations
CREATE POLICY "Require auth for existing_loans"
ON public.existing_loans
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- bank_accounts: Require authentication for all operations
CREATE POLICY "Require auth for bank_accounts"
ON public.bank_accounts
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- profiles: Require authentication for all operations
CREATE POLICY "Require auth for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- credit_scores: Require authentication for all operations
CREATE POLICY "Require auth for credit_scores"
ON public.credit_scores
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- notifications: Require authentication for all operations
CREATE POLICY "Require auth for notifications"
ON public.notifications
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- notification_preferences: Require authentication for all operations
CREATE POLICY "Require auth for notification_preferences"
ON public.notification_preferences
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- borrower_documents: Require authentication for all operations
CREATE POLICY "Require auth for borrower_documents"
ON public.borrower_documents
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- user_roles: Require authentication for all operations
CREATE POLICY "Require auth for user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- admin_application_assignments: Require authentication for all operations
CREATE POLICY "Require auth for admin_assignments"
ON public.admin_application_assignments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contacts: Require authentication for all operations
CREATE POLICY "Require auth for crm_contacts"
ON public.crm_contacts
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- crm_activities: Require authentication for all operations
CREATE POLICY "Require auth for crm_activities"
ON public.crm_activities
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- crm_opportunities: Require authentication for all operations
CREATE POLICY "Require auth for crm_opportunities"
ON public.crm_opportunities
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- crm_integration_settings: Require authentication for all operations
CREATE POLICY "Require auth for crm_integration_settings"
ON public.crm_integration_settings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- crm_sync_log: Require authentication for all operations
CREATE POLICY "Require auth for crm_sync_log"
ON public.crm_sync_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- loan_application_status_history: Require authentication for all operations
CREATE POLICY "Require auth for status_history"
ON public.loan_application_status_history
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- rate_limit_tracking: This table is managed by service role, add auth requirement
CREATE POLICY "Require auth for rate_limit_tracking"
ON public.rate_limit_tracking
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- audit_logs: Require authentication for SELECT (inserts are via service role)
CREATE POLICY "Require auth for audit_logs_select"
ON public.audit_logs
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- system_settings: Require authentication for all operations
CREATE POLICY "Require auth for system_settings"
ON public.system_settings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- external_notification_webhooks: Require authentication for all operations
CREATE POLICY "Require auth for external_webhooks"
ON public.external_notification_webhooks
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);