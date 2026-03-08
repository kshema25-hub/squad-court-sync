
CREATE OR REPLACE FUNCTION public.check_court_booking_conflict(
  _court_id uuid,
  _start_time timestamptz,
  _end_time timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE court_id = _court_id
      AND resource_type = 'court'
      AND status IN ('pending', 'approved')
      AND start_time < _end_time
      AND end_time > _start_time
  )
$$;

CREATE OR REPLACE FUNCTION public.check_equipment_booking_conflict(
  _equipment_id uuid,
  _start_time timestamptz,
  _end_time timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE equipment_id = _equipment_id
      AND resource_type = 'equipment'
      AND status IN ('pending', 'approved')
      AND start_time < _end_time
      AND end_time > _start_time
  )
$$;
