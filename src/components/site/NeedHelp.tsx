import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Mail, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export function NeedHelp(){
 const [open,setOpen]=useState(false);
 const {data}=useQuery({queryKey:['public-company'],queryFn:async()=>((await supabase.rpc('public_company')).data??{}) as Record<string,string|null>});
 const email=data?.support_email??'';
 const phone=(data?.support_phone??'').replace(/[^\d+]/g,'');
 const wa=(data?.support_whatsapp??'').replace(/\D/g,'');
 return <div className="relative"><Button variant="outline" onClick={()=>setOpen(!open)} aria-expanded={open}><MessageCircle/><span className="hidden sm:inline">Need help?</span></Button>{open&&<div role="dialog" aria-label="Contact support" className="absolute right-0 top-12 z-50 w-72 max-w-[85vw] rounded-lg border bg-popover p-4 shadow-soft"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Contact GetXpress</h2><Button variant="ghost" size="icon" aria-label="Close help" onClick={()=>setOpen(false)}><X/></Button></div><div className="space-y-2">{wa&&<Button variant="outline" asChild className="w-full justify-start"><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle/>WhatsApp</a></Button>}{email&&<Button variant="outline" asChild className="w-full justify-start"><a href={`mailto:${encodeURIComponent(email)}`}><Mail/>Email support</a></Button>}{phone&&<Button variant="outline" asChild className="w-full justify-start"><a href={`tel:${phone}`}><Phone/>Call support</a></Button>}{!wa&&!email&&!phone&&<p className="text-sm text-muted-foreground">Support contact details have not been configured yet.</p>}</div></div>}</div>;
}