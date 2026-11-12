import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

export const ResourceFavouriteButton = ({
  resourceId,
  favouriteCount,
  showLabel,
  ...buttonProps
}: {
  resourceId: string;
  favouriteCount?: number;
  showLabel?: boolean;
} & ButtonProps) => {
  const { toast } = useToast();
  const showError = useErrorToast();
  const { status } = useSession();
  // Signed-out visitors have no favourites: don't ask (the request would
  // fail and keep the button disabled while it retries)
  const { data: user, isLoading } = api.user.getUser.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  const utils = api.useUtils();

  const isFavourite = useMemo(() => {
    return user?.favourites.some(
      (favourite) => favourite.resourceId === resourceId,
    );
  }, [user, resourceId]);

  const { mutate: setFavourite, isPending: isSaving } =
    api.user.setFavourite.useMutation({
      onSuccess: async () => {
        await utils.user.getUser.invalidate();
        void utils.resource.invalidate();
      },
      onError: (e) =>
        showError(e, "Failed to update favourite! Please try again later."),
    });

  const label = useMemo(
    () => (isFavourite ? "Remove from favourites" : "Add to favourites"),
    [isFavourite],
  );

  return (
    <Button
      {...buttonProps}
      title={label}
      onClick={() => {
        if (!user) {
          return toast({
            title: "Sign in to save your favourites.",
            variant: "destructive",
          });
        }

        setFavourite({
          resourceId,
          favourite: !isFavourite,
        });
      }}
      disabled={
        isSaving ||
        status === "loading" ||
        (status === "authenticated" && isLoading)
      }
      variant={buttonProps.variant ?? "outline"}
      className={cn(buttonProps.className, "group")}
      data-testid="resource-favourite-button"
    >
      {isFavourite ? (
        <HeartFilledIcon className="h-4 w-4 text-red-500 group-hover:text-black dark:group-hover:text-white" />
      ) : (
        <HeartIcon className="h-4 w-4 text-muted-foreground group-hover:text-red-500" />
      )}
      {favouriteCount !== undefined && (
        <span className="ml-0.5 text-xs text-muted-foreground">
          ({favouriteCount})
        </span>
      )}
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  );
};
