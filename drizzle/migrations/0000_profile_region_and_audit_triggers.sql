ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text, ADD COLUMN IF NOT EXISTS district text;

CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec jsonb; old_rec jsonb; changed jsonb := '{}'::jsonb; k text;
BEGIN
  rec := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  IF TG_OP = 'UPDATE' THEN
    old_rec := to_jsonb(OLD);
    FOR k IN SELECT jsonb_object_keys(rec) LOOP
      IF k NOT IN ('updated_at','last_seen_at') AND rec->k IS DISTINCT FROM old_rec->k THEN
        changed := changed || jsonb_build_object(k, jsonb_build_object('from', old_rec->k, 'to', rec->k));
      END IF;
    END LOOP;
    IF changed = '{}'::jsonb THEN RETURN NEW; END IF;
  END IF;
  INSERT INTO public.audit_logs(action, actor, entity, entity_id, meta)
  VALUES (lower(TG_OP), auth.uid(), TG_TABLE_NAME, rec->>'id',
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('changes', changed) ELSE jsonb_build_object('row', rec - 'secret' - 'api_key' - 'token') END);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS audit_shipments ON public.shipments;
CREATE TRIGGER audit_shipments AFTER UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
DROP TRIGGER IF EXISTS audit_provider_settings ON public.courier_provider_settings;
CREATE TRIGGER audit_provider_settings AFTER INSERT OR UPDATE ON public.courier_provider_settings FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
DROP TRIGGER IF EXISTS audit_whatsapp_settings ON public.whatsapp_settings;
CREATE TRIGGER audit_whatsapp_settings AFTER INSERT OR UPDATE ON public.whatsapp_settings FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
DROP TRIGGER IF EXISTS audit_piece_scans ON public.shipment_pieces;
CREATE TRIGGER audit_piece_scans AFTER UPDATE ON public.shipment_pieces FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM anon, authenticated;