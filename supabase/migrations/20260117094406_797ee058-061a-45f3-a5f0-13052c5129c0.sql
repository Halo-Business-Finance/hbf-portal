-- Step 1: Add new roles to the app_role enum (must be separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_service';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'underwriter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';