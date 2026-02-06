-- Create security_telemetry table for anonymous aggregate metrics (no PII)
CREATE TABLE public.security_telemetry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name text NOT NULL,
    metric_date date NOT NULL DEFAULT CURRENT_DATE,
    count bigint NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (metric_name, metric_date)
);

-- Enable RLS
ALTER TABLE public.security_telemetry ENABLE ROW LEVEL SECURITY;

-- No user-level policies needed - only edge functions with service role can write
-- Admins can read for dashboards
CREATE POLICY "Admins can view telemetry"
ON public.security_telemetry
FOR SELECT
TO authenticated
USING (public.has_role_or_higher(auth.uid(), 'customer_service'));

-- Function to increment telemetry counter (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.increment_security_telemetry(
    _metric_name text,
    _increment_by integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_telemetry (metric_name, metric_date, count)
    VALUES (_metric_name, CURRENT_DATE, _increment_by)
    ON CONFLICT (metric_name, metric_date)
    DO UPDATE SET 
        count = security_telemetry.count + _increment_by,
        updated_at = now();
END;
$$;

-- Add index for efficient querying
CREATE INDEX idx_security_telemetry_metric_date ON public.security_telemetry(metric_name, metric_date DESC);

-- Add comment for documentation
COMMENT ON TABLE public.security_telemetry IS 'Aggregate security metrics without PII. Used for anonymous usage tracking like password toggle counts and failed login patterns.';