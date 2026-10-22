ALTER TABLE public.pincodes ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS parcel_photos text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT 'GetXpress Logistics Pvt Ltd',
  ADD COLUMN IF NOT EXISTS company_type text DEFAULT 'Pvt Ltd',
  ADD COLUMN IF NOT EXISTS tagline text DEFAULT 'Doorstep courier across India',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS meta_keywords text,
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS support_whatsapp text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS site_live boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  provider text NOT NULL DEFAULT 'gmail',
  host text NOT NULL DEFAULT 'smtp.gmail.com',
  port int NOT NULL DEFAULT 465,
  secure text NOT NULL DEFAULT 'ssl',
  username text,
  from_name text DEFAULT 'GetXpress',
  from_email text,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.smtp_settings TO authenticated;
GRANT ALL ON public.smtp_settings TO service_role;
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin smtp" ON public.smtp_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.smtp_settings(id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_templates (
  key text PRIMARY KEY,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  image_url text,
  kind text NOT NULL DEFAULT 'transactional',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin templates" ON public.email_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.email_templates(key,name,subject,body,kind) VALUES
('booking_confirmed','Booking confirmed','Your GetXpress order {{tracking}} is booked','Hi {{name}},

Your parcel {{tracking}} is booked. Track it here: {{link}}

Thank you for shipping with {{company}}.','transactional'),
('status_update','Status update','Order {{tracking}}: {{status}}','Hi {{name}},

Your parcel {{tracking}} is now {{status}}.
Track: {{link}}','transactional'),
('delivered','Delivered','Order {{tracking}} delivered','Hi {{name}},

Your parcel {{tracking}} has been delivered. Thank you!','transactional'),
('new_offer','New offer','A new offer from {{company}}','Hi {{name}},

{{offer}}','marketing')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  template_key text,
  subject text,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin email logs" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.public_company()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('company_name',company_name,'tagline',tagline,'description',description,'logo_url',logo_url,'icon_url',icon_url,'support_email',support_email,'support_whatsapp',support_whatsapp,'address',address,'site_live',site_live) FROM public.app_settings WHERE id LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.public_company() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.debit_hub_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.payment_method = 'prepaid' AND public.has_role(NEW.user_id,'point') THEN
    INSERT INTO public.wallet_transactions(user_id,amount,kind,note,ref)
    VALUES (NEW.user_id, -NEW.price, 'order_debit', 'Prepaid booking debit', NEW.tracking_number);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_debit_hub_wallet ON public.shipments;
CREATE TRIGGER trg_debit_hub_wallet AFTER INSERT ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.debit_hub_wallet();