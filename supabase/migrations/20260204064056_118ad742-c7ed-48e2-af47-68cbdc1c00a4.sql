-- Update the test application with realistic dates (today)
UPDATE public.loan_applications 
SET 
  application_started_date = now(),
  created_at = now(),
  application_submitted_date = CASE WHEN status != 'draft' THEN now() ELSE NULL END
WHERE id = 'a763a8b7-1997-4561-b763-217890a42bab';

-- Also fix any other applications with future dates
UPDATE public.loan_applications 
SET 
  application_started_date = created_at,
  application_submitted_date = CASE 
    WHEN status NOT IN ('draft', 'paused') AND application_submitted_date > now() 
    THEN created_at 
    ELSE application_submitted_date 
  END
WHERE application_started_date > now() OR created_at > now();