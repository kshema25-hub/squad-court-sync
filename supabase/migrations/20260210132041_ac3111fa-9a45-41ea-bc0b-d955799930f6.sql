
-- Create time_blocks table for admin blocking of resources
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('court', 'equipment', 'category', 'global')),
  court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  category TEXT,
  reason TEXT NOT NULL DEFAULT 'Maintenance',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Admins can manage all time blocks
CREATE POLICY "Admins can manage time blocks"
  ON public.time_blocks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Faculty can manage time blocks
CREATE POLICY "Faculty can manage time blocks"
  ON public.time_blocks FOR ALL
  USING (has_role(auth.uid(), 'faculty'::app_role));

-- Anyone can view time blocks (needed for booking availability checks)
CREATE POLICY "Anyone can view time blocks"
  ON public.time_blocks FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON public.time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
