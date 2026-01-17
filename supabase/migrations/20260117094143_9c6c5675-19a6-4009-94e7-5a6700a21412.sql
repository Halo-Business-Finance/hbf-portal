-- Fix Audit Log Integrity: Ensure write-once semantics
-- The audit_logs table should be append-only with no modifications allowed

-- Drop the existing confusing INSERT policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

-- Create a clearer INSERT policy
-- Direct RLS inserts are blocked; only security definer functions (log_audit_event) can insert
CREATE POLICY "Audit logs are insert-only via security functions" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (false);

-- Explicitly block UPDATE operations (RLS level)
CREATE POLICY "Audit logs cannot be updated" 
  ON public.audit_logs 
  FOR UPDATE 
  USING (false);

-- Explicitly block DELETE operations (RLS level)
CREATE POLICY "Audit logs cannot be deleted" 
  ON public.audit_logs 
  FOR DELETE 
  USING (false);

-- Add database-level trigger to enforce write-once semantics (defense in depth)
-- This protects even against superuser modifications (except for explicit bypass)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted. This action has been blocked for security compliance.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to block updates
DROP TRIGGER IF EXISTS prevent_audit_log_update ON public.audit_logs;
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Create trigger to block deletes
DROP TRIGGER IF EXISTS prevent_audit_log_delete ON public.audit_logs;
CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Add a comment explaining the security model
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. Inserts only via log_audit_event() security definer function. Updates and deletes are blocked by triggers and RLS for compliance.';