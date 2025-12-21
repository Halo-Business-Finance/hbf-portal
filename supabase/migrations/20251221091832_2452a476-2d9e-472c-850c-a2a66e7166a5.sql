-- Fix get_user_notification_preferences to validate user owns the request
-- This prevents unauthorized access to other users' preferences via direct RPC calls

CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_preferences JSONB;
BEGIN
  -- SECURITY: Validate that the requesting user can only access their own preferences
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only access your own notification preferences';
  END IF;

  -- Try to get existing preferences
  SELECT preferences INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = _user_id;
  
  -- If no preferences exist, create default ones
  IF v_preferences IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING preferences INTO v_preferences;
  END IF;
  
  RETURN v_preferences;
END;
$function$;