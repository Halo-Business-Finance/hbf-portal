-- =====================================================
-- IBM PostgreSQL Schema Export for HBF Portal
-- Generated from Supabase schema
-- Run this on your IBM PostgreSQL instance
-- =====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES (ENUMS)
CREATE TYPE app_role AS ENUM (
  'admin', 'moderator', 'user', 'customer_service', 'underwriter', 'super_admin'
);

CREATE TYPE application_status AS ENUM (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'funded', 'paused'
);

CREATE TYPE loan_type AS ENUM (
  'refinance', 'bridge_loan', 'purchase', 'franchise', 'factoring', 'working_capital'
);

CREATE TYPE user_role AS ENUM ('admin', 'user');

-- 3. TABLES

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  business_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Loan Applications
CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_type loan_type NOT NULL,
  amount_requested NUMERIC,
  status application_status NOT NULL DEFAULT 'draft',
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_zip TEXT,
  years_in_business INTEGER,
  loan_details JSONB DEFAULT '{}'::jsonb,
  application_number TEXT,
  application_started_date TIMESTAMPTZ DEFAULT now(),
  application_submitted_date TIMESTAMPTZ,
  funded_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loan Application Status History
CREATE TABLE public.loan_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Application Assignments
CREATE TABLE public.admin_application_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  institution TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active',
  is_business BOOLEAN NOT NULL DEFAULT false,
  external_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank Accounts Masked View
CREATE VIEW public.bank_accounts_masked AS
SELECT
  id, user_id, account_name,
  '****' || RIGHT(account_number, 4) AS account_number_masked,
  account_type, institution, balance, currency,
  status, is_business, created_at, updated_at
FROM public.bank_accounts;

-- Credit Scores
CREATE TABLE public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  bureau TEXT NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing Loans
CREATE TABLE public.existing_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_application_id UUID REFERENCES public.loan_applications(id),
  loan_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  lender TEXT NOT NULL,
  loan_balance NUMERIC NOT NULL,
  original_amount NUMERIC NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  remaining_months INTEGER NOT NULL,
  maturity_date DATE NOT NULL,
  origination_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'current',
  loan_purpose TEXT NOT NULL,
  has_prepayment_penalty BOOLEAN NOT NULL DEFAULT false,
  prepayment_period_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Borrower Documents
CREATE TABLE public.borrower_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES public.borrower_documents(id),
  is_latest_version BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "loan_funded": {"sms": false, "email": true, "in_app": true},
    "status_update": {"sms": false, "email": true, "in_app": true},
    "payment_received": {"sms": false, "email": true, "in_app": true},
    "payment_reminder": {"sms": false, "email": true, "in_app": true},
    "document_required": {"sms": false, "email": true, "in_app": true},
    "application_approved": {"sms": true, "email": true, "in_app": true},
    "application_rejected": {"sms": false, "email": true, "in_app": true},
    "application_submitted": {"sms": false, "email": true, "in_app": true},
    "application_under_review": {"sms": false, "email": true, "in_app": true}
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- External Notification Webhooks
CREATE TABLE public.external_notification_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '[]'::jsonb,
  event_types JSONB DEFAULT '["loan_funded", "application_submitted", "application_approved"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- System Settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Security Telemetry
CREATE TABLE public.security_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_name, metric_date)
);

-- Rate Limit Tracking
CREATE TABLE public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (identifier, endpoint, window_start)
);

-- CRM Contacts
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  lead_source TEXT DEFAULT 'website',
  lead_status TEXT DEFAULT 'new',
  contact_type TEXT DEFAULT 'lead',
  notes TEXT,
  tags TEXT[],
  assigned_to UUID,
  external_crm_id TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Opportunities
CREATE TABLE public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id),
  loan_application_id UUID REFERENCES public.loan_applications(id),
  opportunity_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  loan_amount NUMERIC,
  stage TEXT DEFAULT 'prospecting',
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  actual_close_date DATE,
  assigned_to UUID,
  loss_reason TEXT,
  notes TEXT,
  external_crm_id TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id),
  opportunity_id UUID REFERENCES public.crm_opportunities(id),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  duration_minutes INTEGER,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  external_crm_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Integration Settings
CREATE TABLE public.crm_integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  external_crm_name TEXT NOT NULL DEFAULT 'loanflow-nexus',
  api_endpoint TEXT,
  webhook_url TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional',
  last_sync_at TIMESTAMPTZ,
  field_mappings JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Sync Log
CREATE TABLE public.crm_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  external_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  data_payload JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_credit_scores_user_id ON public.credit_scores(user_id);
CREATE INDEX idx_existing_loans_user_id ON public.existing_loans(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_borrower_documents_user_id ON public.borrower_documents(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_admin_assignments_admin_id ON public.admin_application_assignments(admin_id);
CREATE INDEX idx_admin_assignments_application_id ON public.admin_application_assignments(application_id);
CREATE INDEX idx_status_history_application_id ON public.loan_application_status_history(loan_application_id);

-- 5. FUNCTIONS

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number := 'HBF-' || EXTRACT(YEAR FROM NOW()) || '-' || 
      LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' || 
      LPAD((EXTRACT(EPOCH FROM NOW()) % 86400)::INTEGER::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set funded date on status change
CREATE OR REPLACE FUNCTION public.set_funded_date_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    NEW.funded_date := NOW();
  END IF;
  IF OLD.status = 'funded' AND NEW.status != 'funded' THEN
    NEW.funded_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track loan status change
CREATE OR REPLACE FUNCTION public.track_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.loan_application_status_history (
      loan_application_id, status, changed_by, notes
    ) VALUES (
      NEW.id, NEW.status, NULL,
      'Status changed from ' || COALESCE(OLD.status::TEXT, 'none') || ' to ' || NEW.status::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create existing loan on funded
CREATE OR REPLACE FUNCTION public.create_existing_loan_on_funded()
RETURNS TRIGGER AS $$
DECLARE
  v_term_months INTEGER := 60;
  v_interest_rate NUMERIC := 7.5;
  v_monthly_payment NUMERIC;
BEGIN
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    IF NEW.loan_details IS NOT NULL THEN
      IF NEW.loan_details->>'term_months' IS NOT NULL THEN
        v_term_months := (NEW.loan_details->>'term_months')::INTEGER;
      END IF;
      IF NEW.loan_details->>'interest_rate' IS NOT NULL THEN
        v_interest_rate := (NEW.loan_details->>'interest_rate')::NUMERIC;
      END IF;
    END IF;
    
    IF NEW.amount_requested IS NOT NULL AND NEW.amount_requested > 0 THEN
      v_monthly_payment := NEW.amount_requested * 
        (v_interest_rate / 1200 * POWER(1 + v_interest_rate / 1200, v_term_months)) / 
        (POWER(1 + v_interest_rate / 1200, v_term_months) - 1);
    ELSE
      v_monthly_payment := 0;
    END IF;
    
    INSERT INTO public.existing_loans (
      user_id, loan_application_id, loan_name, loan_type, lender,
      loan_balance, original_amount, monthly_payment, interest_rate,
      term_months, remaining_months, maturity_date, origination_date,
      status, loan_purpose, has_prepayment_penalty
    ) VALUES (
      NEW.user_id, NEW.id,
      COALESCE(NEW.business_name, NEW.first_name || ' ' || NEW.last_name) || ' - ' || NEW.loan_type::TEXT,
      NEW.loan_type::TEXT, 'Heritage Business Funding',
      COALESCE(NEW.amount_requested, 0), COALESCE(NEW.amount_requested, 0),
      v_monthly_payment, v_interest_rate, v_term_months, v_term_months,
      CURRENT_DATE + (v_term_months || ' months')::INTERVAL, CURRENT_DATE,
      'current', COALESCE(NEW.loan_details->>'loan_purpose', 'Business financing'), false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Document version management
CREATE OR REPLACE FUNCTION public.update_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_document_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    UPDATE public.borrower_documents
    SET is_latest_version = false
    WHERE id = NEW.parent_document_id OR parent_document_id = NEW.parent_document_id;
    NEW.is_latest_version := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prevent audit log modification
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id UUID, _action TEXT, _resource_type TEXT,
  _resource_id UUID DEFAULT NULL, _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL, _details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
  VALUES (_user_id, _action, _resource_type, _resource_id, _ip_address, _user_agent, _details)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$ LANGUAGE plpgsql;

-- Sanitize CRM sync payload
CREATE OR REPLACE FUNCTION public.sanitize_crm_sync_payload()
RETURNS TRIGGER AS $$
DECLARE
  sanitized_payload JSONB;
  sensitive_fields TEXT[] := ARRAY['ssn', 'social_security', 'tax_id', 'ein', 'password', 'credit_card', 'card_number', 'cvv', 'bank_account', 'routing_number', 'drivers_license', 'passport'];
  field TEXT;
BEGIN
  sanitized_payload := COALESCE(NEW.data_payload, '{}'::jsonb);
  FOREACH field IN ARRAY sensitive_fields LOOP
    IF sanitized_payload ? field THEN
      sanitized_payload := sanitized_payload || jsonb_build_object(field, '[REDACTED]');
    END IF;
  END LOOP;
  NEW.data_payload := sanitized_payload;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment security telemetry
CREATE OR REPLACE FUNCTION public.increment_security_telemetry(
  _metric_name TEXT, _increment_by INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_telemetry (metric_name, metric_date, count)
  VALUES (_metric_name, CURRENT_DATE, _increment_by)
  ON CONFLICT (metric_name, metric_date)
  DO UPDATE SET count = security_telemetry.count + _increment_by, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_tracking()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_end < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW() - INTERVAL '1 hour');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.cleanup_old_crm_sync_logs()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.crm_sync_log WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_scores_updated_at BEFORE UPDATE ON public.credit_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_existing_loans_updated_at BEFORE UPDATE ON public.existing_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_borrower_documents_updated_at BEFORE UPDATE ON public.borrower_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Application number generation
CREATE TRIGGER generate_app_number BEFORE INSERT ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.generate_application_number();

-- Funded date management
CREATE TRIGGER set_funded_date BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_funded_date_on_status_change();

-- Status history tracking
CREATE TRIGGER track_status_change AFTER UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.track_loan_status_change();

-- Create existing loan on funded
CREATE TRIGGER create_loan_on_funded AFTER UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.create_existing_loan_on_funded();

-- Document versioning
CREATE TRIGGER manage_document_version BEFORE INSERT ON public.borrower_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_document_version();

-- Audit log immutability
CREATE TRIGGER prevent_audit_update BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_delete BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- CRM sync payload sanitization
CREATE TRIGGER sanitize_sync_payload BEFORE INSERT OR UPDATE ON public.crm_sync_log
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_crm_sync_payload();

-- 7. SSL ENFORCEMENT (recommended)
-- ALTER SYSTEM SET ssl = on;
-- Ensure your IBM PostgreSQL instance has SSL configured

-- =====================================================
-- NOTES:
-- 1. Supabase-specific functions (auth.uid(), has_role, etc.) 
--    are NOT included - you'll need an API layer for authorization
-- 2. RLS policies are NOT included - IBM PostgreSQL doesn't have 
--    Supabase's auth integration. Use application-level authorization
-- 3. You'll need to set up IBM App ID for authentication
-- 4. File storage needs IBM Cloud Object Storage setup
-- =====================================================
