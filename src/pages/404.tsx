import { Separator } from "@/components/ui/separator";

export default function Custom404Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center gap-6">
      <span className="text-3xl font-semibold tracking-tight">404</span>
      <Separator orientation="vertical" className="h-16 w-[2px] grow-0" />
      <span className="text-xl font-semibold tracking-tight">
        This page could not be found.
      </span>
    </div>
  );
}
