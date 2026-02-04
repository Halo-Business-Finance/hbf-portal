-- Add 'paused' status to the application_status enum
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'paused';