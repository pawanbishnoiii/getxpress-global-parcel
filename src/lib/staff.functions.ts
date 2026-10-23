import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireUser } from './auth-guard';

export const staffAssignmentSchema = z.object({
  user: z.string().uuid(),
  role: z.enum(['point','network','state_manager','state_director','area_manager']),
  enabled: z.boolean(), state: z.string().trim().max(80).optional(),
  area: z.string().trim().max(80).optional(), pin: z.string().regex(/^\d{6}$/).optional(),
});
export const manageStaff = createServerFn({method:'POST'}).middleware([requireUser])
  .inputValidator((input: z.input<typeof staffAssignmentSchema>)=>staffAssignmentSchema.parse(input))
  .handler(async({data,context})=>{
    const r=await context.supabase.rpc('manage_staff_assignment',{
      _user:data.user,_role:data.role,_enabled:data.enabled,
      ...(data.state?{_state:data.state}:{}),
      ...(data.area?{_area:data.area}:{}),
      ...(data.pin?{_pin:data.pin}:{}),
    });
    if(r.error) throw new Error(r.error.message);
    return {ok:true};
  });