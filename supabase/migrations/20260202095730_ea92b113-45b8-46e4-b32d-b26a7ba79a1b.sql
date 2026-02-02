-- Add class_code column to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS class_code VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS representative_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create function to generate unique class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update profiles table to link to class instead of individual
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id),
ADD COLUMN IF NOT EXISTS is_representative BOOLEAN DEFAULT false;

-- Create index for class_code lookups
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON public.classes(class_code);

-- Update RLS policy on profiles to allow class code lookup
CREATE OR REPLACE FUNCTION public.get_class_by_code(_class_code VARCHAR)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.classes WHERE class_code = _class_code AND is_active = true LIMIT 1
$$;