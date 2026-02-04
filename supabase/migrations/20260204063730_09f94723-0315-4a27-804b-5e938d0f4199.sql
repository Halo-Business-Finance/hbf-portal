-- Add funded_date column to track actual funding date
ALTER TABLE public.loan_applications
ADD COLUMN funded_date TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.loan_applications.funded_date IS 'The date when the loan was actually funded and closed';

-- Create trigger to automatically set funded_date when status changes to funded
CREATE OR REPLACE FUNCTION public.set_funded_date_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set funded_date when status changes to 'funded'
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    NEW.funded_date := NOW();
  END IF;
  
  -- Clear funded_date if status changes away from 'funded' (e.g., correction)
  IF OLD.status = 'funded' AND NEW.status != 'funded' THEN
    NEW.funded_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER set_funded_date_trigger
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_funded_date_on_status_change();