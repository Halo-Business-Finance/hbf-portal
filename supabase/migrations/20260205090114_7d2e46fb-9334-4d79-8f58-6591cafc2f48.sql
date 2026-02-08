-- Drop the broken trigger that references a non-existent 'role' column
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;

-- Also drop the function since it's no longer needed for profiles
-- (Note: user roles are managed in the user_roles table, not profiles)
DROP FUNCTION IF EXISTS public.prevent_role_escalation();