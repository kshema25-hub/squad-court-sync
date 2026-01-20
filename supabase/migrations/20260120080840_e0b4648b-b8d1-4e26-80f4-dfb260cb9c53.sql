-- Create booking_status_history table to track all status changes
CREATE TABLE public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Create index for faster lookups
CREATE INDEX idx_booking_status_history_booking_id ON public.booking_status_history(booking_id);

-- Create trigger function to log status changes
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (booking_id, new_status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
CREATE TRIGGER booking_status_change_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- Enable RLS
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view history for their bookings"
ON public.booking_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_status_history.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all history"
ON public.booking_status_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view history for students in their classes"
ON public.booking_status_history FOR SELECT
USING (
  has_role(auth.uid(), 'faculty') AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_status_history.booking_id 
    AND faculty_can_access_student(auth.uid(), bookings.user_id)
  )
);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_status_history;