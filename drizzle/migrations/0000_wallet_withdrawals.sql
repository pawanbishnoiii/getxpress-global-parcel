CREATE TABLE public.wallet_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric(12,2) NOT NULL CHECK (amount >= 100 AND amount <= 500000),
  payout_method text NOT NULL CHECK (payout_method IN ('upi','bank')),
  payout_details text NOT NULL CHECK (length(payout_details) BETWEEN 5 AND 200),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallet_withdrawals TO authenticated;
GRANT ALL ON public.wallet_withdrawals TO service_role;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals read" ON public.wallet_withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own withdrawals request" ON public.wallet_withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "admin withdrawals update" ON public.wallet_withdrawals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.withdrawal_paid_debit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    INSERT INTO public.wallet_transactions(user_id, amount, kind, note, ref)
    VALUES (NEW.user_id, -NEW.amount, 'withdrawal', 'Payout ' || NEW.payout_method, NEW.id::text);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER wallet_withdrawal_paid BEFORE UPDATE ON public.wallet_withdrawals FOR EACH ROW EXECUTE FUNCTION public.withdrawal_paid_debit();