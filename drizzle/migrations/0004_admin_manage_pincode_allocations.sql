GRANT SELECT, INSERT, UPDATE, DELETE ON public.pincode_allocations TO authenticated;
DROP POLICY IF EXISTS "Admins manage allocations" ON public.pincode_allocations;
CREATE POLICY "Admins manage allocations" ON public.pincode_allocations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER TABLE public.pincode_allocations ADD COLUMN IF NOT EXISTS area text;