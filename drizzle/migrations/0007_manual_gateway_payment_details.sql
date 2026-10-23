ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS pay_upi_id text,
  ADD COLUMN IF NOT EXISTS pay_upi_name text,
  ADD COLUMN IF NOT EXISTS pay_bank_name text,
  ADD COLUMN IF NOT EXISTS pay_account_name text,
  ADD COLUMN IF NOT EXISTS pay_account_no text,
  ADD COLUMN IF NOT EXISTS pay_ifsc text,
  ADD COLUMN IF NOT EXISTS pay_instructions text;

CREATE OR REPLACE FUNCTION public.deposit_instructions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('upi_id', pay_upi_id, 'upi_name', pay_upi_name, 'bank_name', pay_bank_name,
    'account_name', pay_account_name, 'account_no', pay_account_no, 'ifsc', pay_ifsc, 'instructions', pay_instructions)
  FROM public.app_settings WHERE id = true AND auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.deposit_instructions() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.deposit_instructions() TO authenticated;