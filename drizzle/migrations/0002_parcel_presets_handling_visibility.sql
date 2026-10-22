CREATE TABLE public.parcel_presets (
  id text PRIMARY KEY,
  label text NOT NULL,
  label_hi text,
  kind text NOT NULL DEFAULT 'packages',
  max_kg numeric NOT NULL DEFAULT 1,
  l numeric NOT NULL DEFAULT 1,
  w numeric NOT NULL DEFAULT 1,
  h numeric NOT NULL DEFAULT 1,
  fee numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.parcel_presets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.parcel_presets TO authenticated;
GRANT ALL ON public.parcel_presets TO service_role;
ALTER TABLE public.parcel_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads parcel presets" ON public.parcel_presets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manages parcel presets" ON public.parcel_presets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER audit_parcel_presets AFTER INSERT OR UPDATE OR DELETE ON public.parcel_presets FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS is_fragile boolean NOT NULL DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS has_electronics boolean NOT NULL DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS handling_fee numeric NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Own or staff shipments" ON public.shipments;
CREATE POLICY "Own or scoped staff shipments" ON public.shipments FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'network')
  OR public.can_access_pincode(sender_pincode, auth.uid())
  OR public.can_access_pincode(receiver_pincode, auth.uid())
);