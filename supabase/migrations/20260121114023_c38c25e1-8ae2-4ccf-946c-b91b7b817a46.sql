-- Create function to call the notification edge function
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload json;
  request_id bigint;
BEGIN
  -- Only trigger on status changes (not on INSERT as status is pending)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Build the payload
    payload := json_build_object(
      'booking_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'user_id', NEW.user_id
    );
    
    -- Call the edge function using pg_net
    SELECT net.http_post(
      url := 'https://aezfwutplznngkwodseq.supabase.co/functions/v1/send-booking-notification',
      body := payload,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    ) INTO request_id;
    
    RAISE LOG 'Booking notification sent for booking %, request_id: %', NEW.id, request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for booking status changes
DROP TRIGGER IF EXISTS booking_status_notification_trigger ON public.bookings;

CREATE TRIGGER booking_status_notification_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();