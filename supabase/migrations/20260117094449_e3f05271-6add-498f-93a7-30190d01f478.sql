-- Implement Granular Admin Role Hierarchy - Part 2
-- Create tables, functions, and policies for role-based access

-- Step 2: Create admin_application_assignments table for underwriter access control
CREATE TABLE IF NOT EXISTS public.admin_application_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE (admin_id, application_id)
);

-- Enable RLS on assignments table
ALTER TABLE public.admin_application_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_application_assignments
CREATE POLICY "Super admins can manage all assignments"
  ON public.admin_application_assignments
  FOR ALL
  USING (public.has_app_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_app_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view their own assignments"
  ON public.admin_application_assignments
  FOR SELECT
  USING (admin_id = auth.uid());

-- Step 3: Create helper function for role hierarchy checking
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id UUID, _minimum_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        -- super_admin has all permissions
        role = 'super_admin'::public.app_role
        -- Check specific role matches
        OR role = _minimum_role
        -- Role hierarchy: super_admin > admin > underwriter/customer_service > moderator > user
        OR (
          _minimum_role = 'admin'::public.app_role AND role = 'super_admin'::public.app_role
        )
        OR (
          _minimum_role = 'underwriter'::public.app_role AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
        )
        OR (
          _minimum_role = 'customer_service'::public.app_role AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
        )
        OR (
          _minimum_role = 'moderator'::public.app_role AND role IN ('super_admin'::public.app_role, 'admin'::public.app_role)
        )
        OR (
          _minimum_role = 'user'::public.app_role
        )
      )
  )
$$;

-- Step 4: Create function to check if underwriter is assigned to a user's application
CREATE OR REPLACE FUNCTION public.is_assigned_to_user(_admin_id UUID, _borrower_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_application_assignments aaa
    JOIN public.loan_applications la ON la.id = aaa.application_id
    WHERE aaa.admin_id = _admin_id
      AND la.user_id = _borrower_user_id
  )
$$;

-- Step 5: Update bank_accounts RLS policies for granular access
-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON public.bank_accounts;

-- Super admins can view all bank accounts
CREATE POLICY "Super admins can view all bank accounts"
  ON public.bank_accounts
  FOR SELECT
  USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Underwriters can only view bank accounts for assigned applications
CREATE POLICY "Underwriters can view assigned user bank accounts"
  ON public.bank_accounts
  FOR SELECT
  USING (
    public.has_app_role(auth.uid(), 'underwriter')
    AND public.is_assigned_to_user(auth.uid(), user_id)
  );

-- Legacy admin role gets underwriter-level access (must be assigned)
CREATE POLICY "Legacy admins view assigned bank accounts"
  ON public.bank_accounts
  FOR SELECT
  USING (
    public.has_app_role(auth.uid(), 'admin')
    AND NOT public.has_app_role(auth.uid(), 'super_admin')
    AND public.is_assigned_to_user(auth.uid(), user_id)
  );

-- Step 6: Create masked view for customer_service (no full account numbers)
CREATE OR REPLACE VIEW public.bank_accounts_masked AS
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

-- Grant access to the masked view
GRANT SELECT ON public.bank_accounts_masked TO authenticated;

-- Step 7: Update loan_applications policies for role hierarchy
DROP POLICY IF EXISTS "Admins can view all applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.loan_applications;

-- Super admins have full access
CREATE POLICY "Super admins can view all applications"
  ON public.loan_applications
  FOR SELECT
  USING (public.has_app_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all applications"
  ON public.loan_applications
  FOR UPDATE
  USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Customer service can view all applications (read-only)
CREATE POLICY "Customer service can view all applications"
  ON public.loan_applications
  FOR SELECT
  USING (public.has_app_role(auth.uid(), 'customer_service'));

-- Underwriters view assigned applications
CREATE POLICY "Underwriters view assigned applications"
  ON public.loan_applications
  FOR SELECT
  USING (
    public.has_app_role(auth.uid(), 'underwriter')
    AND EXISTS (
      SELECT 1 FROM public.admin_application_assignments
      WHERE admin_id = auth.uid() AND application_id = loan_applications.id
    )
  );

-- Underwriters can update assigned applications
CREATE POLICY "Underwriters update assigned applications"
  ON public.loan_applications
  FOR UPDATE
  USING (
    public.has_app_role(auth.uid(), 'underwriter')
    AND EXISTS (
      SELECT 1 FROM public.admin_application_assignments
      WHERE admin_id = auth.uid() AND application_id = loan_applications.id
    )
  );

-- Legacy admin access (transitional - same as underwriter)
CREATE POLICY "Legacy admins view assigned applications"
  ON public.loan_applications
  FOR SELECT
  USING (
    public.has_app_role(auth.uid(), 'admin')
    AND NOT public.has_app_role(auth.uid(), 'super_admin')
    AND EXISTS (
      SELECT 1 FROM public.admin_application_assignments
      WHERE admin_id = auth.uid() AND application_id = loan_applications.id
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_assignments_admin_id ON public.admin_application_assignments(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_assignments_application_id ON public.admin_application_assignments(application_id);

-- Add comment explaining role hierarchy
COMMENT ON TYPE public.app_role IS 'Role hierarchy: super_admin (full access) > admin/underwriter/customer_service (granular) > moderator > user. super_admin: unrestricted access. underwriter: assigned applications + bank accounts. customer_service: read-only, masked bank data. admin: legacy, treated as underwriter.';