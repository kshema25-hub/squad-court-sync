-- Create trigger for booking status change notifications
CREATE TRIGGER on_booking_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();

-- Also create trigger for status history logging
CREATE TRIGGER on_booking_status_history
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status_change();