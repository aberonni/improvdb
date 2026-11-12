import { useToast } from "@/components/ui/use-toast";
import { trpcErrorMessage } from "@/lib/trpc-error";

/**
 * Shows a failed request to the user. Pass it a mutation's error and what to
 * say if the server gave no reason:
 *
 *   const showError = useErrorToast();
 *   api.x.useMutation({ onError: (e) => showError(e, "Failed to save!") });
 */
export function useErrorToast() {
  const { toast } = useToast();

  return (error: Parameters<typeof trpcErrorMessage>[0], fallback: string) =>
    toast({
      title: "Uh oh! Something went wrong.",
      variant: "destructive",
      description: trpcErrorMessage(error, fallback),
    });
}
