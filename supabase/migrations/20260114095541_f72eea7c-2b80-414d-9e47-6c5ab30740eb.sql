-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only allow admins/faculty to create notifications for any user
-- Users can only create notifications for themselves (edge case for self-reminders)
CREATE POLICY "Admins and faculty can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'faculty')
    OR auth.uid() = user_id
  );