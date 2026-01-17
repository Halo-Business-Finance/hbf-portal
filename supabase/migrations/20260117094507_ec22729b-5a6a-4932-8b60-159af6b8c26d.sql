-- Fix SECURITY DEFINER view issue
-- Replace the view with SECURITY INVOKER (default for views)
DROP VIEW IF EXISTS public.bank_accounts_masked;

-- Recreate as a regular view (SECURITY INVOKER is default)
CREATE VIEW public.bank_accounts_masked 
WITH (security_invoker = true)
AS
  SELECT 
    id,
    user_id,
    account_name,
    'XXXX-' || RIGHT(account_number, 4) AS account_number_masked,
    account_type,
    institution,
    balance,
    currency,
    status,
    is_business,
    created_at,
    updated_at
  FROM public.bank_accounts;

-- Grant access to authenticated users
GRANT SELECT ON public.bank_accounts_masked TO authenticated;

-- Add RLS policy for customer_service to access masked view via underlying table
-- The view inherits RLS from bank_accounts, so we need a policy for customer_service
CREATE POLICY "Customer service can view bank accounts via masked view"
  ON public.bank_accounts
  FOR SELECT
  USING (public.has_app_role(auth.uid(), 'customer_service'));