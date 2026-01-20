-- Fix RLS so users can cancel their own pending bookings (UPDATE needs WITH CHECK)
DO $$
BEGIN
  -- Drop the old policy that implicitly requires the new row to remain status='pending'
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='bookings'
      AND policyname='Users can update their own pending bookings'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own pending bookings" ON public.bookings';
  END IF;
END $$;

-- Allow users to update rows that are currently pending, and allow the new status to be pending or cancelled
CREATE POLICY "Users can update/cancel their own pending bookings"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'cancelled')
);
