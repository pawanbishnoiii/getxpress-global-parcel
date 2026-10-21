CREATE TYPE public.app_role AS ENUM ('admin','point','network','state_director','state_manager','area_manager');
CREATE TABLE public.app_settings ( cash_on_pickup boolean NOT NULL DEFAULT false, id boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (id) );
CREATE TABLE public.audit_logs ( action text NOT NULL, actor uuid, created_at timestamptz NOT NULL DEFAULT now(), entity text NOT NULL, entity_id text, id uuid NOT NULL DEFAULT gen_random_uuid(), meta jsonb NOT NULL DEFAULT '{}'::jsonb, PRIMARY KEY (id) );
CREATE TABLE public.bag_items ( added_by uuid NOT NULL, bag_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), piece_id uuid NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.bags ( bag_code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL, destination text NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), manifest_id uuid, plastic_bag_code text, seal_no text, sealed_at timestamptz, status text NOT NULL DEFAULT 'open', PRIMARY KEY (id) );
CREATE TABLE public.coupon_redemptions ( coupon_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), discount numeric NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), shipment_id uuid NOT NULL, user_id uuid NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.coupons ( active boolean NOT NULL DEFAULT true, code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid, description text, discount_type text NOT NULL DEFAULT 'flat', discount_value numeric NOT NULL, expires_at timestamptz, id uuid NOT NULL DEFAULT gen_random_uuid(), max_discount numeric, max_uses numeric, min_order numeric NOT NULL DEFAULT 0, per_user_limit numeric NOT NULL DEFAULT 1, starts_at timestamptz NOT NULL DEFAULT now(), used_count numeric NOT NULL DEFAULT 0, PRIMARY KEY (id) );
CREATE TABLE public.courier_provider_settings ( account_label text, enabled boolean NOT NULL DEFAULT false, environment text NOT NULL DEFAULT 'sandbox', provider text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (provider) );
CREATE TABLE public.health_checks ( checked_at timestamptz NOT NULL DEFAULT now(), details jsonb NOT NULL DEFAULT '{}'::jsonb, id uuid NOT NULL DEFAULT gen_random_uuid(), latency_ms numeric, status text NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.integration_settings ( admin_alert_email text, alert_on_application boolean NOT NULL DEFAULT false, alert_on_booking boolean NOT NULL DEFAULT false, api_enabled boolean NOT NULL DEFAULT false, id boolean NOT NULL DEFAULT true, otp_provider text NOT NULL DEFAULT 'demo', otp_sender_id text, payment_key_id text, payment_live boolean NOT NULL DEFAULT false, payment_provider text NOT NULL DEFAULT 'none', smtp_from text, smtp_host text, smtp_port numeric, smtp_provider text NOT NULL DEFAULT 'none', smtp_user text, updated_at timestamptz NOT NULL DEFAULT now(), webhook_url text, whatsapp_enabled boolean NOT NULL DEFAULT false, whatsapp_number text, PRIMARY KEY (id) );
CREATE TABLE public.label_prints ( created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), piece_id uuid NOT NULL, printed_by uuid NOT NULL, reason text, PRIMARY KEY (id) );
CREATE TABLE public.login_otps ( attempts numeric NOT NULL DEFAULT 0, code_hash text NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), phone text NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.manifests ( created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL, from_location text NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), manifest_code text NOT NULL, received_at timestamptz, received_by uuid, status text NOT NULL DEFAULT 'in_transit', to_location text NOT NULL, vehicle_no text, PRIMARY KEY (id) );
CREATE TABLE public.notifications ( body text NOT NULL, channel text NOT NULL DEFAULT 'in_app', created_at timestamptz NOT NULL DEFAULT now(), error text, id uuid NOT NULL DEFAULT gen_random_uuid(), kind text NOT NULL, meta jsonb NOT NULL DEFAULT '{}'::jsonb, recipient text, sent_at timestamptz, status text NOT NULL DEFAULT 'queued', subject text NOT NULL, user_id uuid, PRIMARY KEY (id) );
CREATE TABLE public.payments ( amount numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), method text, mode text NOT NULL DEFAULT 'demo', provider text NOT NULL DEFAULT 'manual', provider_ref text, shipment_id uuid NOT NULL, status text NOT NULL DEFAULT 'pending', user_id uuid NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.phone_otps ( attempts numeric NOT NULL DEFAULT 0, code_hash text NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), phone text NOT NULL, user_id uuid NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.pincode_allocations ( assigned_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), effective_from date NOT NULL DEFAULT current_date, effective_to date, holder_role public.app_role NOT NULL, holder_user_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), note text, pincode text NOT NULL, status text NOT NULL DEFAULT 'active', PRIMARY KEY (id) );
CREATE TABLE public.pincodes ( active boolean NOT NULL DEFAULT true, city text NOT NULL, hub_name text, pincode text NOT NULL, state text NOT NULL, tier text, zone text, PRIMARY KEY (pincode) );
CREATE TABLE public.point_applications ( address text NOT NULL, address_line2 text, age numeric, business_name text NOT NULL, business_type text NOT NULL, city text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), daily_capacity numeric, district text, email text NOT NULL, full_name text NOT NULL, gender text, id uuid NOT NULL DEFAULT gen_random_uuid(), message text, phone text NOT NULL, pincode text NOT NULL, reference text NOT NULL DEFAULT ('GXH'||lpad((floor(random()*900000)+100000)::text,6,'0')), space_sqft numeric, state text NOT NULL, status text NOT NULL DEFAULT 'submitted', user_id uuid, whatsapp text, PRIMARY KEY (id) );
CREATE TABLE public.point_commissions ( amount numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), point_user_id uuid NOT NULL, rate numeric NOT NULL, settled_at timestamptz, settled_by uuid, shipment_id uuid NOT NULL, status text NOT NULL DEFAULT 'pending', PRIMARY KEY (id) );
CREATE TABLE public.profiles ( account_type text NOT NULL DEFAULT 'personal', address text, age numeric, avatar_url text, business_name text, city text, contact_email text, created_at timestamptz NOT NULL DEFAULT now(), first_name text, full_name text, gender text, id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, last_name text, last_seen_at timestamptz, lat numeric, lng numeric, onboarded_at timestamptz, phone text, phone_verified boolean NOT NULL DEFAULT false, pincode text, updated_at timestamptz NOT NULL DEFAULT now(), whatsapp text, PRIMARY KEY (id) );
CREATE TABLE public.returns ( created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), kind text NOT NULL, pickup_at timestamptz, reason text NOT NULL, requested_by uuid NOT NULL, restocking_status text NOT NULL DEFAULT 'pending', return_awb text, shipment_id uuid NOT NULL, status text NOT NULL DEFAULT 'requested', updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (id) );
CREATE TABLE public.seal_codes ( batch_id uuid NOT NULL, code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL, kind text NOT NULL, used_bag_id uuid, PRIMARY KEY (code) );
CREATE TABLE public.service_rates ( active boolean NOT NULL DEFAULT true, base numeric NOT NULL DEFAULT 0, per_kg numeric NOT NULL DEFAULT 0, service text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (service) );
CREATE TABLE public.shipment_pieces ( box_preset text, contents text, created_at timestamptz NOT NULL DEFAULT now(), dims jsonb, id uuid NOT NULL DEFAULT gen_random_uuid(), piece_code text NOT NULL, seq_no numeric NOT NULL, shipment_id uuid NOT NULL, total numeric NOT NULL, weight_kg numeric, PRIMARY KEY (id) );
CREATE TABLE public.shipments ( contents text, coupon_code text, created_at timestamptz NOT NULL DEFAULT now(), declared_value numeric, dims jsonb, discount numeric NOT NULL DEFAULT 0, id uuid NOT NULL DEFAULT gen_random_uuid(), origin_point_id uuid, payment_method text NOT NULL DEFAULT 'prepaid', payment_status text NOT NULL DEFAULT 'pending', pickup_lat numeric, pickup_lng numeric, pieces_count numeric NOT NULL DEFAULT 0, price numeric NOT NULL, receiver_address text NOT NULL, receiver_city text NOT NULL, receiver_name text NOT NULL, receiver_phone text NOT NULL, receiver_pincode text NOT NULL, routing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, sender_address text NOT NULL, sender_city text NOT NULL, sender_name text NOT NULL, sender_phone text NOT NULL, sender_pincode text NOT NULL, service text NOT NULL DEFAULT 'standard', status text NOT NULL DEFAULT 'booked', tracking_number text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), user_id uuid NOT NULL, weight_kg numeric NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.staff_scopes ( created_at timestamptz NOT NULL DEFAULT now(), created_by uuid, id uuid NOT NULL DEFAULT gen_random_uuid(), point_id uuid, revoked_at timestamptz, role public.app_role NOT NULL, state text, user_id uuid NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.state_rates ( active boolean NOT NULL DEFAULT true, base numeric NOT NULL, per_kg numeric NOT NULL, service text NOT NULL, set_by uuid, state text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (state, service) );
CREATE TABLE public.tracking_events ( created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), location text, note text, piece_id uuid, shipment_id uuid NOT NULL, status text NOT NULL, PRIMARY KEY (id) );
CREATE TABLE public.user_roles ( id uuid NOT NULL DEFAULT gen_random_uuid(), role public.app_role NOT NULL, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, PRIMARY KEY (id) );
CREATE TABLE public.wallet_transactions ( amount numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), kind text NOT NULL, note text, ref text, user_id uuid NOT NULL, PRIMARY KEY (id) );

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_key UNIQUE (user_id, role);
ALTER TABLE public.shipments ADD CONSTRAINT shipments_tracking_key UNIQUE (tracking_number);
ALTER TABLE public.shipment_pieces ADD CONSTRAINT pieces_code_key UNIQUE (piece_code);
ALTER TABLE public.bags ADD CONSTRAINT bags_code_key UNIQUE (bag_code);
ALTER TABLE public.manifests ADD CONSTRAINT manifests_code_key UNIQUE (manifest_code);
ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE public.bag_items ADD CONSTRAINT bag_items_piece_key UNIQUE (piece_id);
CREATE INDEX ON public.shipments (user_id, created_at DESC);
CREATE INDEX ON public.shipments (sender_pincode);
CREATE INDEX ON public.tracking_events (shipment_id, created_at);
CREATE INDEX ON public.shipment_pieces (shipment_id);
CREATE INDEX ON public.pincodes (city);
CREATE INDEX ON public.pincode_allocations (pincode, status);
CREATE INDEX ON public.wallet_transactions (user_id, created_at DESC);
CREATE INDEX ON public.phone_otps (user_id, created_at DESC);
CREATE INDEX ON public.login_otps (phone, created_at DESC);
CREATE INDEX ON public.profiles (phone);
CREATE SEQUENCE IF NOT EXISTS public.awb_seq START 10000001;
CREATE SEQUENCE IF NOT EXISTS public.piece_seq START 1000001;
CREATE SEQUENCE IF NOT EXISTS public.bag_seq START 10001;
CREATE SEQUENCE IF NOT EXISTS public.manifest_seq START 10001;
CREATE SEQUENCE IF NOT EXISTS public.seal_code_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS public.return_seq START 10001;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE OR REPLACE FUNCTION public.is_staff(_u uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _u) $$;
CREATE OR REPLACE FUNCTION public.admin_exists() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') $$;
CREATE OR REPLACE FUNCTION public.manages_state(_state text, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user,'admin') OR EXISTS (SELECT 1 FROM public.staff_scopes
    WHERE user_id = _user AND revoked_at IS NULL AND role IN ('state_director','state_manager','area_manager') AND lower(state) = lower(_state)) $$;
CREATE OR REPLACE FUNCTION public.can_access_pincode(_pin text, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user,'admin') OR public.has_role(_user,'network')
   OR EXISTS (SELECT 1 FROM public.pincode_allocations WHERE pincode = _pin AND holder_user_id = _user AND status = 'active')
   OR EXISTS (SELECT 1 FROM public.pincodes p WHERE p.pincode = _pin AND public.manages_state(p.state, _user)) $$;
CREATE OR REPLACE FUNCTION public.can_access_bag(_bag uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.claim_first_admin() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  PERFORM pg_advisory_xact_lock(42);
  IF public.admin_exists() THEN RAISE EXCEPTION 'An Admin already exists'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin');
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.touch_last_seen() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, phone, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.phone, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.next_awb() RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'GX' || to_char(now(),'YYMM') || lpad(nextval('public.awb_seq')::text, 8, '0') $$;
CREATE OR REPLACE FUNCTION public.next_piece_code() RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'GXP' || lpad(nextval('public.piece_seq')::text, 9, '0') $$;

CREATE OR REPLACE FUNCTION public.track_shipment(_tracking text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.shipments; _code text := upper(trim(_tracking));
BEGIN
  SELECT * INTO s FROM public.shipments WHERE tracking_number = _code;
  IF NOT FOUND THEN
    SELECT sh.* INTO s FROM public.shipment_pieces p JOIN public.shipments sh ON sh.id = p.shipment_id WHERE p.piece_code = _code;
  END IF;
  IF s.id IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'tracking_number', s.tracking_number, 'status', s.status, 'service', s.service,
    'from_city', s.sender_city, 'to_city', s.receiver_city, 'created_at', s.created_at,
    'pieces', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', piece_code, 'seq', seq_no, 'total', total) ORDER BY seq_no) FROM public.shipment_pieces WHERE shipment_id = s.id), '[]'::jsonb),
    'events', COALESCE((SELECT jsonb_agg(jsonb_build_object('status', e.status, 'location', e.location, 'note', e.note, 'created_at', e.created_at, 'at', e.created_at,
        'piece', (SELECT piece_code FROM public.shipment_pieces WHERE id = e.piece_id)) ORDER BY e.created_at DESC) FROM public.tracking_events e WHERE e.shipment_id = s.id), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.scan_piece(_code text, _status text, _location text DEFAULT NULL, _note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.shipments; p public.shipment_pieces; _c text := upper(trim(_code));
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Only staff can scan parcels'; END IF;
  IF _status NOT IN ('picked_up','in_transit','at_hub','out_for_delivery','delivered','exception','cancelled') THEN RAISE EXCEPTION 'Unknown status'; END IF;
  SELECT * INTO p FROM public.shipment_pieces WHERE piece_code = _c;
  IF p.id IS NOT NULL THEN SELECT * INTO s FROM public.shipments WHERE id = p.shipment_id;
  ELSE SELECT * INTO s FROM public.shipments WHERE tracking_number = _c; END IF;
  IF s.id IS NULL THEN RAISE EXCEPTION 'No parcel found for %', _c; END IF;
  IF s.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Parcel is already %', s.status; END IF;
  INSERT INTO public.tracking_events(shipment_id, piece_id, status, location, note) VALUES (s.id, p.id, _status, _location, _note);
  UPDATE public.shipments SET status = _status, updated_at = now() WHERE id = s.id;
  IF _status = 'delivered' AND s.origin_point_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.point_commissions WHERE shipment_id = s.id) THEN
    INSERT INTO public.point_commissions(point_user_id, shipment_id, rate, amount) VALUES (s.origin_point_id, s.id, 0.1, round(s.price * 0.1, 2));
  END IF;
  RETURN jsonb_build_object('awb', s.tracking_number, 'piece', p.piece_code, 'status', _status);
END $$;

CREATE OR REPLACE FUNCTION public.create_bag(_destination text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bags;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  INSERT INTO public.bags(bag_code, destination, created_by) VALUES ('GXB' || lpad(nextval('public.bag_seq')::text, 7, '0'), trim(_destination), auth.uid()) RETURNING * INTO b;
  RETURN to_jsonb(b);
END $$;
CREATE OR REPLACE FUNCTION public.add_piece_to_bag(_bag_id uuid, _code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bags; p public.shipment_pieces;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  SELECT * INTO b FROM public.bags WHERE id = _bag_id;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Bag not found'; END IF;
  IF b.status <> 'open' THEN RAISE EXCEPTION 'Bag is already sealed'; END IF;
  SELECT * INTO p FROM public.shipment_pieces WHERE piece_code = upper(trim(_code));
  IF p.id IS NULL THEN RAISE EXCEPTION 'Parcel % not found', _code; END IF;
  IF EXISTS (SELECT 1 FROM public.bag_items WHERE piece_id = p.id) THEN RAISE EXCEPTION 'Parcel is already in a bag'; END IF;
  INSERT INTO public.bag_items(bag_id, piece_id, added_by) VALUES (_bag_id, p.id, auth.uid());
  RETURN jsonb_build_object('bag', b.bag_code, 'piece', p.piece_code);
END $$;
CREATE OR REPLACE FUNCTION public.set_plastic_bag(_bag_id uuid, _code text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  UPDATE public.bags SET plastic_bag_code = upper(trim(_code)) WHERE id = _bag_id AND status = 'open';
  IF NOT FOUND THEN RAISE EXCEPTION 'Open bag not found'; END IF;
  UPDATE public.seal_codes SET used_bag_id = _bag_id WHERE code = upper(trim(_code));
END $$;
CREATE OR REPLACE FUNCTION public.seal_bag(_bag_id uuid, _seal text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bag_items WHERE bag_id = _bag_id) THEN RAISE EXCEPTION 'Add at least one parcel before sealing'; END IF;
  IF EXISTS (SELECT 1 FROM public.bags WHERE seal_no = upper(trim(_seal))) THEN RAISE EXCEPTION 'Seal already used'; END IF;
  UPDATE public.bags SET seal_no = upper(trim(_seal)), sealed_at = now(), status = 'sealed' WHERE id = _bag_id AND status = 'open';
  IF NOT FOUND THEN RAISE EXCEPTION 'Open bag not found'; END IF;
  UPDATE public.seal_codes SET used_bag_id = _bag_id WHERE code = upper(trim(_seal));
END $$;
CREATE OR REPLACE FUNCTION public.scan_bag_code(_code text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bags; m public.manifests; _c text := upper(trim(_code)); _matched text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  SELECT * INTO b FROM public.bags WHERE bag_code = _c; _matched := 'bag';
  IF b.id IS NULL THEN SELECT * INTO b FROM public.bags WHERE seal_no = _c; _matched := 'seal'; END IF;
  IF b.id IS NULL THEN SELECT * INTO b FROM public.bags WHERE plastic_bag_code = _c; _matched := 'plastic'; END IF;
  IF b.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT * INTO m FROM public.manifests WHERE id = b.manifest_id;
  RETURN jsonb_build_object('found', true, 'bag_id', b.id, 'bag_code', b.bag_code, 'status', b.status, 'seal_no', b.seal_no,
    'plastic_bag_code', b.plastic_bag_code, 'matched', _matched, 'manifest_code', m.manifest_code, 'manifest_status', m.status);
END $$;
CREATE OR REPLACE FUNCTION public.create_manifest(_bag_ids uuid[], _from text, _to text, _vehicle text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.manifests;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  IF EXISTS (SELECT 1 FROM public.bags WHERE id = ANY(_bag_ids) AND (status <> 'sealed' OR manifest_id IS NOT NULL)) THEN RAISE EXCEPTION 'Only sealed, undispatched bags can be added'; END IF;
  INSERT INTO public.manifests(manifest_code, from_location, to_location, vehicle_no, created_by)
  VALUES ('GXM' || lpad(nextval('public.manifest_seq')::text, 7, '0'), _from, _to, _vehicle, auth.uid()) RETURNING * INTO m;
  UPDATE public.bags SET manifest_id = m.id, status = 'dispatched' WHERE id = ANY(_bag_ids);
  INSERT INTO public.tracking_events(shipment_id, piece_id, status, location, note)
    SELECT p.shipment_id, p.id, 'in_transit', _from, 'Dispatched on ' || m.manifest_code FROM public.bag_items bi JOIN public.shipment_pieces p ON p.id = bi.piece_id WHERE bi.bag_id = ANY(_bag_ids);
  UPDATE public.shipments SET status = 'in_transit', updated_at = now() WHERE id IN (SELECT p.shipment_id FROM public.bag_items bi JOIN public.shipment_pieces p ON p.id = bi.piece_id WHERE bi.bag_id = ANY(_bag_ids));
  RETURN to_jsonb(m);
END $$;
CREATE OR REPLACE FUNCTION public.receive_manifest(_manifest_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.manifests;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  UPDATE public.manifests SET status = 'received', received_at = now(), received_by = auth.uid() WHERE id = _manifest_id AND status = 'in_transit' RETURNING * INTO m;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Manifest not in transit'; END IF;
  UPDATE public.bags SET status = 'received' WHERE manifest_id = _manifest_id;
  INSERT INTO public.tracking_events(shipment_id, piece_id, status, location, note)
    SELECT p.shipment_id, p.id, 'at_hub', m.to_location, 'Received from ' || m.manifest_code FROM public.bags b JOIN public.bag_items bi ON bi.bag_id = b.id JOIN public.shipment_pieces p ON p.id = bi.piece_id WHERE b.manifest_id = _manifest_id;
  UPDATE public.shipments SET status = 'at_hub', updated_at = now() WHERE id IN (SELECT p.shipment_id FROM public.bags b JOIN public.bag_items bi ON bi.bag_id = b.id JOIN public.shipment_pieces p ON p.id = bi.piece_id WHERE b.manifest_id = _manifest_id);
END $$;

CREATE OR REPLACE FUNCTION public.generate_seal_codes(_kind text, _count integer)
RETURNS TABLE(code text, batch_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _batch uuid := gen_random_uuid(); _prefix text; i integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only Admin can generate codes'; END IF;
  IF _kind NOT IN ('seal','plastic') THEN RAISE EXCEPTION 'Unknown code type'; END IF;
  IF _count < 1 OR _count > 2000 THEN RAISE EXCEPTION 'Choose between 1 and 2000 codes'; END IF;
  _prefix := CASE WHEN _kind = 'seal' THEN 'GXS' ELSE 'GXL' END;
  FOR i IN 1.._count LOOP
    INSERT INTO public.seal_codes(code, kind, batch_id, created_by) VALUES (_prefix || lpad(nextval('public.seal_code_seq')::text, 8, '0'), _kind, _batch, auth.uid());
  END LOOP;
  INSERT INTO public.audit_logs(actor, action, entity, entity_id, meta) VALUES (auth.uid(), 'generate_codes', 'seal_codes', _batch::text, jsonb_build_object('kind', _kind, 'count', _count));
  RETURN QUERY SELECT s.code, s.batch_id FROM public.seal_codes s WHERE s.batch_id = _batch ORDER BY s.code;
END $$;

CREATE OR REPLACE FUNCTION public.create_return(_awb text, _kind text, _reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.shipments; r public.returns;
BEGIN
  SELECT * INTO s FROM public.shipments WHERE tracking_number = upper(trim(_awb));
  IF s.id IS NULL THEN RAISE EXCEPTION 'Shipment not found'; END IF;
  IF s.user_id <> auth.uid() AND NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not your shipment'; END IF;
  IF _kind NOT IN ('return','rto','exchange') THEN RAISE EXCEPTION 'Unknown return type'; END IF;
  IF EXISTS (SELECT 1 FROM public.returns WHERE shipment_id = s.id AND status NOT IN ('closed','rejected')) THEN RAISE EXCEPTION 'A return is already open for this shipment'; END IF;
  INSERT INTO public.returns(shipment_id, kind, reason, requested_by, return_awb)
  VALUES (s.id, _kind, _reason, auth.uid(), 'GXR' || lpad(nextval('public.return_seq')::text, 8, '0')) RETURNING * INTO r;
  RETURN to_jsonb(r);
END $$;
CREATE OR REPLACE FUNCTION public.update_return_status(_return_id uuid, _status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  UPDATE public.returns SET status = _status, updated_at = now() WHERE id = _return_id;
END $$;

CREATE OR REPLACE FUNCTION public.wallet_balance(_user uuid DEFAULT NULL) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := COALESCE(_user, auth.uid());
BEGIN
  IF u <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN COALESCE((SELECT sum(amount) FROM public.wallet_transactions WHERE user_id = u), 0);
END $$;
CREATE OR REPLACE FUNCTION public.wallet_topup(_amount numeric, _ref text DEFAULT NULL) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF _amount <= 0 OR _amount > 100000 THEN RAISE EXCEPTION 'Amount must be between 1 and 100000'; END IF;
  INSERT INTO public.wallet_transactions(user_id, amount, kind, ref, note) VALUES (auth.uid(), _amount, 'topup', _ref, 'Wallet top-up (demo)');
  RETURN public.wallet_balance(auth.uid());
END $$;
CREATE OR REPLACE FUNCTION public.settle_commissions(_ids uuid[]) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  WITH u AS (UPDATE public.point_commissions SET status = 'settled', settled_at = now(), settled_by = auth.uid() WHERE id = ANY(_ids) AND status = 'pending' RETURNING *)
  INSERT INTO public.wallet_transactions(user_id, amount, kind, ref, note) SELECT point_user_id, amount, 'commission', shipment_id::text, 'Commission settled' FROM u;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.grant_staff_role(_user_id uuid, _role public.app_role, _state text DEFAULT NULL, _point_id uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'state_director') AND _role IN ('state_manager','area_manager','point') AND public.manages_state(_state, auth.uid()))
    OR (public.has_role(auth.uid(),'state_manager') AND _role IN ('area_manager','point') AND public.manages_state(_state, auth.uid()))
    OR (public.has_role(auth.uid(),'area_manager') AND _role = 'point' AND public.manages_state(_state, auth.uid()))) THEN
    RAISE EXCEPTION 'You cannot grant this role';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  INSERT INTO public.staff_scopes(user_id, role, state, point_id, created_by) VALUES (_user_id, _role, _state, COALESCE(_point_id, CASE WHEN _role='point' THEN _user_id END), auth.uid());
  INSERT INTO public.audit_logs(actor, action, entity, entity_id, meta) VALUES (auth.uid(), 'grant_role', 'user', _user_id::text, jsonb_build_object('role', _role, 'state', _state));
END $$;
CREATE OR REPLACE FUNCTION public.find_user_by_phone(_phone text)
RETURNS TABLE(user_id uuid, full_name text, phone text, roles text[]) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  RETURN QUERY SELECT p.id, p.full_name, p.phone, COALESCE(array_agg(r.role::text) FILTER (WHERE r.role IS NOT NULL), '{}')
  FROM public.profiles p LEFT JOIN public.user_roles r ON r.user_id = p.id
  WHERE right(regexp_replace(p.phone,'\D','','g'),10) = right(regexp_replace(_phone,'\D','','g'),10) GROUP BY p.id;
END $$;
CREATE OR REPLACE FUNCTION public.staff_directory()
RETURNS TABLE(user_id uuid, full_name text, phone text, roles text[], states text[]) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  RETURN QUERY SELECT p.id, p.full_name, p.phone,
    (SELECT COALESCE(array_agg(DISTINCT r.role::text), '{}') FROM public.user_roles r WHERE r.user_id = p.id),
    (SELECT COALESCE(array_agg(DISTINCT s.state) FILTER (WHERE s.state IS NOT NULL), '{}') FROM public.staff_scopes s WHERE s.user_id = p.id AND s.revoked_at IS NULL)
  FROM public.profiles p WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id);
END $$;
CREATE OR REPLACE FUNCTION public.admin_users()
RETURNS TABLE(user_id uuid, full_name text, phone text, city text, roles text[], created_at timestamptz, last_seen_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY SELECT p.id, p.full_name, p.phone, p.city,
    (SELECT COALESCE(array_agg(r.role::text), '{}') FROM public.user_roles r WHERE r.user_id = p.id), p.created_at, p.last_seen_at
  FROM public.profiles p ORDER BY p.created_at DESC LIMIT 1000;
END $$;

CREATE OR REPLACE FUNCTION public.import_pincodes(_rows jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.pincodes(pincode, city, state, zone, tier, hub_name, active)
  SELECT DISTINCT ON (r->>'pincode') r->>'pincode', COALESCE(r->>'city',''), COALESCE(r->>'state',''), r->>'zone', r->>'tier', r->>'hub_name', COALESCE((r->>'active')::boolean, true)
  FROM jsonb_array_elements(_rows) r WHERE r->>'pincode' ~ '^\d{6}$'
  ON CONFLICT (pincode) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state, zone = COALESCE(EXCLUDED.zone, pincodes.zone), tier = COALESCE(EXCLUDED.tier, pincodes.tier), hub_name = COALESCE(EXCLUDED.hub_name, pincodes.hub_name);
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.allocate_pincode(_pincode text, _holder uuid, _holder_role public.app_role, _note text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _state text;
BEGIN
  SELECT state INTO _state FROM public.pincodes WHERE pincode = _pincode;
  IF _state IS NULL THEN RAISE EXCEPTION 'Unknown pincode'; END IF;
  IF NOT public.manages_state(_state, auth.uid()) THEN RAISE EXCEPTION 'Not allowed for this state'; END IF;
  IF EXISTS (SELECT 1 FROM public.pincode_allocations WHERE pincode = _pincode AND holder_role = _holder_role AND status = 'active') THEN RAISE EXCEPTION 'Pincode already allocated for this role'; END IF;
  INSERT INTO public.pincode_allocations(pincode, holder_user_id, holder_role, assigned_by, note) VALUES (_pincode, _holder, _holder_role, auth.uid(), _note) RETURNING id INTO _id;
  RETURN _id;
END $$;
CREATE OR REPLACE FUNCTION public.release_pincode(_allocation_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pincode_allocations a JOIN public.pincodes p ON p.pincode = a.pincode WHERE a.id = _allocation_id AND public.manages_state(p.state, auth.uid())) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.pincode_allocations SET status = 'released', effective_to = current_date WHERE id = _allocation_id;
END $$;
CREATE OR REPLACE FUNCTION public.transfer_pincode(_allocation_id uuid, _new_holder uuid, _note text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.pincode_allocations;
BEGIN
  SELECT * INTO a FROM public.pincode_allocations WHERE id = _allocation_id AND status = 'active';
  IF a.id IS NULL THEN RAISE EXCEPTION 'Active allocation not found'; END IF;
  PERFORM public.release_pincode(_allocation_id);
  RETURN public.allocate_pincode(a.pincode, _new_holder, a.holder_role, _note);
END $$;

CREATE OR REPLACE FUNCTION public.dashboard_summary() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
  RETURN jsonb_build_object(
    'shipments', (SELECT count(*) FROM public.shipments),
    'today', (SELECT count(*) FROM public.shipments WHERE created_at >= date_trunc('day', now())),
    'revenue', (SELECT COALESCE(sum(price),0) FROM public.shipments WHERE status <> 'cancelled'),
    'by_status', COALESCE((SELECT jsonb_object_agg(status, n) FROM (SELECT status, count(*) n FROM public.shipments GROUP BY status) x), '{}'::jsonb),
    'last7', (SELECT jsonb_agg(jsonb_build_object('d', to_char(d,'DD Mon'), 'n', (SELECT count(*) FROM public.shipments WHERE created_at::date = d::date)) ORDER BY d) FROM generate_series(current_date - 6, current_date, interval '1 day') d),
    'pincodes', (SELECT count(*) FROM public.pincodes),
    'delegated', (SELECT count(*) FROM public.pincode_allocations WHERE status = 'active'),
    'team', (SELECT count(DISTINCT user_id) FROM public.user_roles),
    'applications', (SELECT count(*) FROM public.point_applications WHERE status = 'submitted'),
    'users', (SELECT count(*) FROM public.profiles));
END $$;

CREATE TABLE public.whatsapp_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  api_key text,
  base_url text NOT NULL DEFAULT 'https://tezsender.in/api',
  instance_id text,
  webhook_secret text,
  otp_template text NOT NULL DEFAULT 'Your Get Xpress code is {{code}}. Valid for 10 minutes. Do not share it.',
  notify_bookings boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.whatsapp_settings DEFAULT VALUES;
CREATE OR REPLACE FUNCTION public.whatsapp_ready() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT enabled AND api_key IS NOT NULL AND length(api_key) > 5 FROM public.whatsapp_settings WHERE id), false) $$;

INSERT INTO public.app_settings(id) VALUES (true);
INSERT INTO public.integration_settings(id) VALUES (true);
INSERT INTO public.service_rates(service, base, per_kg) VALUES ('standard', 49, 30), ('express', 79, 45), ('same_day', 149, 60);

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT ON public.pincodes, public.service_rates, public.state_rates, public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pincodes, public.service_rates, public.state_rates, public.app_settings, public.courier_provider_settings, public.integration_settings, public.whatsapp_settings, public.coupons TO authenticated;
GRANT SELECT ON public.courier_provider_settings, public.integration_settings, public.whatsapp_settings, public.coupons, public.audit_logs, public.health_checks TO authenticated;
CREATE POLICY "Anyone reads pincodes" ON public.pincodes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone reads rates" ON public.service_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone reads team rates" ON public.state_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone reads app settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manages pincodes" ON public.pincodes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages rates" ON public.service_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Managers set team rates" ON public.state_rates FOR ALL TO authenticated USING (public.manages_state(state, auth.uid())) WITH CHECK (public.manages_state(state, auth.uid()));
CREATE POLICY "Admin manages app settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages providers" ON public.courier_provider_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages integrations" ON public.integration_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages whatsapp" ON public.whatsapp_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Signed-in read active coupons" ON public.coupons FOR SELECT TO authenticated USING (active);
CREATE POLICY "Admin reads audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin reads health" ON public.health_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE OR REPLACE FUNCTION public.guard_profile_verify() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' AND (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified OR NEW.phone IS DISTINCT FROM OLD.phone) THEN
    NEW.phone_verified := OLD.phone_verified; NEW.phone := OLD.phone;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard_verify BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verify();
GRANT SELECT ON public.user_roles, public.staff_scopes TO authenticated;
CREATE POLICY "Own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Scopes visible" ON public.staff_scopes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
GRANT UPDATE ON public.staff_scopes TO authenticated;
CREATE POLICY "Admin revokes scopes" ON public.staff_scopes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

GRANT SELECT, INSERT, UPDATE ON public.shipments, public.shipment_pieces, public.tracking_events TO authenticated;
CREATE POLICY "Own or staff shipments" ON public.shipments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own shipment insert" ON public.shipments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff update shipments" ON public.shipments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Pieces visible" ON public.shipment_pieces FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Pieces insert" ON public.shipment_pieces FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()));
CREATE POLICY "Events visible" ON public.tracking_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "Events insert" ON public.tracking_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND (s.user_id = auth.uid() OR public.is_staff(auth.uid()))));
GRANT SELECT ON public.payments, public.coupon_redemptions, public.wallet_transactions, public.point_commissions TO authenticated;
CREATE POLICY "Own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own wallet" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own commissions" ON public.point_commissions FOR SELECT TO authenticated USING (point_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.returns TO authenticated;
CREATE POLICY "Returns visible" ON public.returns FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND s.user_id = auth.uid()));

GRANT SELECT ON public.bags, public.bag_items, public.manifests, public.seal_codes, public.pincode_allocations TO authenticated;
GRANT SELECT, INSERT ON public.label_prints TO authenticated;
CREATE POLICY "Staff bags" ON public.bags FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff bag items" ON public.bag_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manifests" ON public.manifests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff read seal codes" ON public.seal_codes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Allocations visible" ON public.pincode_allocations FOR SELECT TO authenticated USING (holder_user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff label prints" ON public.label_prints FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Label print insert" ON public.label_prints FOR INSERT TO authenticated WITH CHECK (printed_by = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Mark own read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin sends notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT ON public.point_applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.point_applications TO authenticated;
CREATE POLICY "Anyone applies" ON public.point_applications FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Own or staff applications" ON public.point_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff review applications" ON public.point_applications FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_shipment(text), public.whatsapp_ready(), public.admin_exists() TO anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.guard_profile_verify() FROM authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;