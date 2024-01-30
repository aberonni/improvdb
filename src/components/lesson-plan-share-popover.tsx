import { type LessonPlanVisibility } from "@prisma/client";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Link1Icon, Share1Icon } from "@radix-ui/react-icons";
import { api } from "@/utils/api";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { LessonPlanVisibilityLabels } from "./lesson-plan";
import { Label } from "./ui/label";
import { Icons } from "./ui/icons";

export const LessonPlanSharePopover = ({
  lessonPlanId,
  visibility,
}: {
  lessonPlanId: string;
  visibility: LessonPlanVisibility;
}) => {
  const [currentVisibility, setCurrentVisibility] = useState(visibility);

  const { toast } = useToast();
  const utils = api.useUtils();

  const { mutate: setVisibility, isLoading: isUpdatingVisibility } =
    api.lessonPlan.setVisibility.useMutation({
      onSuccess: () => {
        void utils.lessonPlan.getById.invalidate();
        toast({
          title: "Success!",
          description: "Lesson plan updated.",
        });
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to update lesson plan! Please try again later.";
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  async function copyLinkToClipboard() {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Success!",
      description: "Link copied to clipboard.",
    });
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button>
          <Share1Icon className="mr-2 h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 text-sm">
        <RadioGroup
          onValueChange={(newVis) =>
            setCurrentVisibility(newVis as LessonPlanVisibility)
          }
          value={currentVisibility}
          className="flex flex-col space-y-2 py-4"
          disabled={isUpdatingVisibility}
        >
          {Object.entries(LessonPlanVisibilityLabels).map(
            ([visibilityKey, visibilityLabel]) => (
              <Label
                className="flex items-start space-x-3 space-y-0"
                key={visibilityKey}
              >
                <RadioGroupItem value={visibilityKey} />
                <div className="font-normal">
                  {visibilityLabel.label}
                  <br />
                  <span className="mt-1 inline-block text-muted-foreground">
                    {visibilityLabel.description}
                  </span>
                </div>
              </Label>
            ),
          )}
        </RadioGroup>
        <div className="flex gap-1">
          <Button
            className="w-full"
            variant="outline"
            disabled={isUpdatingVisibility || currentVisibility === visibility}
            onClick={() =>
              setVisibility({ id: lessonPlanId, visibility: currentVisibility })
            }
          >
            {isUpdatingVisibility && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Visiblity
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={copyLinkToClipboard}
          >
            <Link1Icon className="mr-2 h-4 w-4" /> Copy Link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
