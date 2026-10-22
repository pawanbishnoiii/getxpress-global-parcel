CREATE POLICY "own parcel photos upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='parcel-photos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "own parcel photos read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='parcel-photos' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'network')));
CREATE OR REPLACE FUNCTION public.debit_hub_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.payment_method <> 'cash_on_pickup' AND public.has_role(NEW.user_id,'point') THEN
    INSERT INTO public.wallet_transactions(user_id,amount,kind,note,ref)
    VALUES (NEW.user_id, -NEW.price, 'order_debit', 'Prepaid booking debit', NEW.tracking_number);
  END IF;
  RETURN NEW;
END $$;