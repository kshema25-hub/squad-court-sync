-- Create helper function to check if faculty can access a student (shares a class)
CREATE OR REPLACE FUNCTION public.faculty_can_access_student(_faculty_user_id UUID, _student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Faculty and student share at least one class
    SELECT 1
    FROM public.class_members faculty_cm
    JOIN public.class_members student_cm ON faculty_cm.class_id = student_cm.class_id
    WHERE faculty_cm.user_id = _faculty_user_id
      AND student_cm.user_id = _student_user_id
  )
$$;

-- Drop overly permissive profile policies
DROP POLICY IF EXISTS "Admins and faculty can view all profiles" ON public.profiles;

-- Create separate policies for admins and faculty
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view profiles of students in their classes"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );

-- Faculty can always view their own profile
CREATE POLICY "Faculty can view own profile"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND auth.uid() = user_id
  );

-- Drop overly permissive booking policies
DROP POLICY IF EXISTS "Admins and faculty can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and faculty can manage bookings" ON public.bookings;

-- Create separate policies for admins and faculty for bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view bookings of students in their classes"
  ON public.bookings FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );

CREATE POLICY "Faculty can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND auth.uid() = user_id
  );

CREATE POLICY "Faculty can approve/reject bookings of students in their classes"
  ON public.bookings FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );

-- Similarly update equipment_issues policies
DROP POLICY IF EXISTS "Admins and faculty can manage equipment issues" ON public.equipment_issues;

CREATE POLICY "Admins can manage all equipment issues"
  ON public.equipment_issues FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view equipment issues of students in their classes"
  ON public.equipment_issues FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );

CREATE POLICY "Faculty can manage equipment issues of students in their classes"
  ON public.equipment_issues FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );

CREATE POLICY "Faculty can create equipment issues for students in their classes"
  ON public.equipment_issues FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'faculty') 
    AND public.faculty_can_access_student(auth.uid(), user_id)
  );