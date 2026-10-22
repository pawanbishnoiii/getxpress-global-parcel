import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";
import { brand } from "@/lib/brand";
import { ArrowUpRight,Mail,Package,Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SiteFooter() {
  return (
    <footer className="bg-ink px-5 pb-8 pt-12 text-ink-foreground md:px-8">
      <div className="mx-auto mb-12 flex max-w-[1240px] flex-wrap items-center justify-between gap-6 border-b border-ink-foreground/15 pb-10"><div><p className="text-xs font-semibold uppercase text-primary">Make the next move</p><h2 className="mt-3 text-3xl font-extrabold md:text-4xl">A parcel. A possibility.</h2></div><Button asChild className="h-12"><Link to="/ship">Book a pickup<ArrowUpRight/></Link></Button></div>
      <div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <BrandMark light className="w-56" />
          <p className="mt-5 text-lg font-bold">Every parcel. Moving forward.</p>
          <p className="mt-4 max-w-sm text-sm leading-6 opacity-70">Courier and shipping across India, with Get Xpress hubs and delivery partners.</p>
          <a className="mt-5 inline-flex items-center gap-2 text-sm opacity-75" href={`mailto:${brand.supportEmail}`}><Mail className="h-4 w-4"/>{brand.supportEmail}</a>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold">Ship</p>
          <Link to="/ship" className="block opacity-70 hover:opacity-100">Book a shipment</Link>
          <Link to="/track" className="block opacity-70 hover:opacity-100">Track a parcel</Link>
          <Link to="/international" className="flex items-center gap-2 opacity-70 hover:opacity-100"><Globe2 className="h-3 w-3"/>International quotes</Link>
          <Link to="/demo" className="block opacity-70 hover:opacity-100">Demo workspace</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold">Partner</p>
          <Link to="/point-partner" className="block opacity-70 hover:opacity-100">Open a Get Xpress Hub</Link>
          <Link to="/auth" className="block opacity-70 hover:opacity-100">Sign in</Link>
        </div>
        <div className="space-y-2 text-sm"><p className="font-bold">Policies</p><Link to="/terms" className="block opacity-70 hover:opacity-100">Terms & Conditions</Link><Link to="/privacy" className="block opacity-70 hover:opacity-100">Privacy policy</Link><Link to="/refunds" className="block opacity-70 hover:opacity-100">Cancellations & refunds</Link><Link to="/shipping-policy" className="block opacity-70 hover:opacity-100">Shipping policy</Link></div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1240px] flex-wrap justify-between gap-3 border-t border-ink-foreground/15 pt-6 text-xs opacity-60"><p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p><p className="flex items-center gap-2"><Package className="h-3 w-3"/>From your door to theirs.</p></div>
    </footer>
  );
}
