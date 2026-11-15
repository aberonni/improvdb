import dynamic from "next/dynamic";
import { useState } from "react";

import { useToast } from "@/components/ui/use-toast";

const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  { ssr: false },
);

/**
 * Renders the Toaster, and loads Radix Toast for it, only once the first
 * toast is shown: most visits never show one, and it's in `_app`, so it
 * would otherwise weigh on every page. It stays mounted afterwards so toasts
 * can animate out.
 */
export function LazyToaster() {
  const { toasts } = useToast();
  const [needed, setNeeded] = useState(false);

  if (!needed && toasts.length > 0) {
    setNeeded(true);
  }

  return needed ? <Toaster /> : null;
}
