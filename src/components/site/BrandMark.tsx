import { cn } from "@/lib/utils";
import wordmark from "@/assets/getxpress-wordmark.png.asset.json";
import wordmarkLight from "@/assets/getxpress-wordmark-light.png";

/**
 * Primary Get Xpress wordmark (orange X, navy letters).
 * `light` swaps in the white-lettered version for dark backgrounds.
 */
export function BrandMark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex w-44 items-center", className)}>
      <img
        src={light ? wordmarkLight : wordmark.url}
        alt="Get Xpress"
        width={1920}
        height={640}
        className="h-12 w-full object-contain"
      />
    </span>
  );
}
