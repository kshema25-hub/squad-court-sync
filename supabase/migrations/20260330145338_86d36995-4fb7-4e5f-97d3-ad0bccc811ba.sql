
-- Uppercase all existing class names
UPDATE public.classes SET name = UPPER(name);

-- Add unique index on uppercase class name
CREATE UNIQUE INDEX IF NOT EXISTS classes_name_unique ON public.classes (UPPER(name));
