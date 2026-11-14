import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

/**
 * The signed-in visitor's favourites, and a way to toggle one. Asks the
 * server once, however many Resources use it.
 */
export function useFavourites() {
  const { toast } = useToast();
  const showError = useErrorToast();
  const { status } = useSession();
  // Signed-out visitors have no favourites: don't ask (the request would
  // fail and keep the button disabled while it retries)
  const { data: user, isLoading } = api.user.getUser.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  const utils = api.useUtils();

  const favouriteIds = useMemo(
    () => new Set(user?.favourites.map(({ resourceId }) => resourceId)),
    [user],
  );

  const {
    mutate: setFavourite,
    isPending: isSaving,
    variables,
  } = api.user.setFavourite.useMutation({
    onSuccess: async () => {
      await utils.user.getUser.invalidate();
      void utils.resource.invalidate();
    },
    onError: (e) =>
      showError(e, "Failed to update favourite! Please try again later."),
  });

  const isLoadingUser =
    status === "loading" || (status === "authenticated" && isLoading);

  return {
    isFavourite: (resourceId: string) => favouriteIds.has(resourceId),
    isDisabled: (resourceId: string) =>
      isLoadingUser || (isSaving && variables?.resourceId === resourceId),
    toggle: (resourceId: string) => {
      if (!user) {
        return toast({
          title: "Sign in to save your favourites.",
          variant: "destructive",
        });
      }

      setFavourite({
        resourceId,
        favourite: !favouriteIds.has(resourceId),
      });
    },
  };
}

export const favouriteLabel = (isFavourite: boolean) =>
  isFavourite ? "Remove from favourites" : "Add to favourites";

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
  const favourites = useFavourites();
  const isFavourite = favourites.isFavourite(resourceId);
  const label = favouriteLabel(isFavourite);

  return (
    <Button
      {...buttonProps}
      title={label}
      onClick={() => favourites.toggle(resourceId)}
      disabled={favourites.isDisabled(resourceId)}
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
