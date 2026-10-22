import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireUser } from './auth-guard';
import { shippingDeclaration } from './shipping-safety';
const party=z.object({name:z.string().trim().min(2).max(100),phone:z.string().regex(/^\+?[1-9]\d{7,14}$/,'Use country code and mobile number'),email:z.string().email().max(255),country:z.string().trim().min(2).max(80),address:z.string().trim().min(8).max(400),city:z.string().trim().min(2).max(80),postal_code:z.string().trim().min(2).max(20)});
export const internationalSchema=shippingDeclaration.extend({sender:party,receiver:party,weight_kg:z.number().min(0.05).max(100),declared_value:z.number().min(0).max(1000000)});
export const requestInternationalQuote=createServerFn({method:'POST'}).middleware([requireUser]).inputValidator((d:z.input<typeof internationalSchema>)=>internationalSchema.parse(d)).handler(async({data,context})=>{
 const {policy_accepted,...payload}=data;
 const r=await context.supabase.from('international_quote_requests').insert({...payload,user_id:context.userId}).select('id,reference,status').single();
 if(r.error) throw new Error('Your quote request could not be saved. Please retry.');
 return r.data;
});