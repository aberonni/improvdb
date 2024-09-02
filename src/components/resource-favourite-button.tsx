import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useMemo } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
  const { data: user, isLoading } = api.user.getUser.useQuery();
  const utils = api.useUtils();

  const isFavourite = useMemo(() => {
    return user?.favourites.some(
      (favourite) => favourite.resourceId === resourceId,
    );
  }, [user, resourceId]);

  const { mutate: setFavourite, isLoading: isSaving } =
    api.user.setFavourite.useMutation({
      onSuccess: async () => {
        await utils.user.getUser.invalidate();
        void utils.resource.invalidate();
      },
      onError: (e) => {
        const errorMessage =
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description:
            errorMessage ??
            "Failed to update favourite! Please try again later.",
        });
      },
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
            title: "You must be logged in to favourite a resource.",
            variant: "destructive",
          });
        }

        setFavourite({
          resourceId,
          favourite: !isFavourite,
        });
      }}
      disabled={isSaving || isLoading}
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
