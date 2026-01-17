-- Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id, IP address, or combination
  endpoint TEXT NOT NULL,   -- function name or action
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (identifier, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role)
CREATE POLICY "Service role only access"
  ON public.rate_limit_tracking
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for fast lookups
CREATE INDEX idx_rate_limit_identifier_endpoint ON public.rate_limit_tracking(identifier, endpoint);
CREATE INDEX idx_rate_limit_window_end ON public.rate_limit_tracking(window_end);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier TEXT,
  _endpoint TEXT,
  _max_requests INTEGER,
  _window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_requests INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE,
  current_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_window_end TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate current window
  v_window_start := date_trunc('second', NOW() - (EXTRACT(EPOCH FROM NOW())::INTEGER % _window_seconds) * INTERVAL '1 second');
  v_window_end := v_window_start + (_window_seconds * INTERVAL '1 second');

  -- Check for existing block
  SELECT rt.blocked_until INTO v_blocked_until
  FROM rate_limit_tracking rt
  WHERE rt.identifier = _identifier
    AND rt.endpoint = _endpoint
    AND rt.blocked_until > NOW()
  ORDER BY rt.blocked_until DESC
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      0, 
      v_blocked_until, 
      _max_requests;
    RETURN;
  END IF;

  -- Get or create rate limit record for current window
  INSERT INTO rate_limit_tracking (identifier, endpoint, request_count, window_start, window_end)
  VALUES (_identifier, _endpoint, 1, v_window_start, v_window_end)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limit_tracking.request_count + 1,
    updated_at = NOW()
  RETURNING rate_limit_tracking.request_count INTO v_current_count;

  -- Check if limit exceeded
  IF v_current_count > _max_requests THEN
    -- Block for the window duration
    UPDATE rate_limit_tracking
    SET blocked_until = v_window_end
    WHERE identifier = _identifier
      AND endpoint = _endpoint
      AND window_start = v_window_start;

    RETURN QUERY SELECT 
      FALSE, 
      0, 
      v_window_end, 
      v_current_count;
  ELSE
    RETURN QUERY SELECT 
      TRUE, 
      (_max_requests - v_current_count)::INTEGER, 
      v_window_end, 
      v_current_count;
  END IF;
END;
$$;

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_tracking()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_end < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Add comment
COMMENT ON TABLE public.rate_limit_tracking IS 'Server-side rate limiting for edge functions. Records are automatically cleaned up after 1 hour.';