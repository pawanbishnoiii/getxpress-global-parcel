ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS support_phone text,
  ADD COLUMN IF NOT EXISTS business_hours text,
  ADD COLUMN IF NOT EXISTS cin text,
  ADD COLUMN IF NOT EXISTS pan text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS footer_text text,
  ADD COLUMN IF NOT EXISTS maintenance_message text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pincode text;

CREATE OR REPLACE FUNCTION public.gateway_single_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.enabled AND NEW.category IN ('payment','otp') THEN
    UPDATE public.gateway_configs SET enabled = false, updated_at = now()
     WHERE category = NEW.category AND provider <> NEW.provider AND enabled;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_gateway_single_active ON public.gateway_configs;
CREATE TRIGGER trg_gateway_single_active AFTER INSERT OR UPDATE OF enabled ON public.gateway_configs
  FOR EACH ROW WHEN (NEW.enabled) EXECUTE FUNCTION public.gateway_single_active();

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  key text PRIMARY KEY,
  name text NOT NULL,
  body text NOT NULL,
  media_url text,
  link_url text,
  event text NOT NULL DEFAULT 'manual',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage wa templates" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.whatsapp_templates(key,name,body,event) VALUES
 ('booking','Booking confirmed','Hi {{name}}, your GetXpress parcel {{tracking}} is booked. Track: {{link}}','booking'),
 ('pickup','Picked up','{{tracking}} has been picked up and is on its way. Track: {{link}}','pickup'),
 ('transit','In transit','{{tracking}} is {{status}}. Track live: {{link}}','transit'),
 ('out_for_delivery','Out for delivery','{{tracking}} is out for delivery today. Please keep your phone reachable.','transit'),
 ('delivered','Delivered','{{tracking}} has been delivered. Thank you for shipping with GetXpress!','delivered'),
 ('otp','OTP','{{otp}} is your GetXpress verification code. Do not share it with anyone.','otp'),
 ('offer','Offer','Hi {{name}}, {{offer}} Book now: {{link}}','manual')
ON CONFLICT (key) DO NOTHING;

GRANT UPDATE ON public.smtp_settings TO service_role;