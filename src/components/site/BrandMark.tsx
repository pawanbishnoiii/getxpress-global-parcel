import { cn } from "@/lib/utils";
import logo from "@/assets/getxpress-logo.png.asset.json";
import logoLight from "@/assets/getxpress-logo-light.png.asset.json";

/**
 * GetXpress wordmark (navy letters, orange X) on a transparent background.
 * `light` swaps in white letters for dark surfaces so it never blends in.
 */
export function BrandMark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex w-40 items-center", className)}>
      <img
        src={light ? logoLight.url : logo.url}
        alt="GetXpress"
        width={1600}
        height={436}
        className="h-auto w-full object-contain"
      />
    </span>
  );
}
