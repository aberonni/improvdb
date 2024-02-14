import React, { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SaveButton } from "@/components/ui/save-button"; 
import { useToast } from "@/components/ui/use-toast";

export const AreYouSureDialogs = {
  ResourceSave: "ResourceSave",
  LessonPlanSave: "LessonPlanSave",
  AdminResourceDelete: "AdminResourceDelete"
} as const;

interface Props {
  customButton?: typeof SaveButton;
  dialog: keyof typeof AreYouSureDialogs;
  description: string;
  isFormValid?: boolean;
  isSaving?: boolean;
  onSave: () => void;
}

export const AreYouSureDialog: React.FC<Props> = ({
  dialog,
  description,
  isFormValid,
  isSaving,
  customButton,
  onSave,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const CustomButton = customButton ?? SaveButton;

  const localStorageId = `dontAskAgainFor${dialog}`;

  useEffect(() => {
    // Perform localStorage action after page has been mounted on client side
    setDontAskAgain(localStorage.getItem(localStorageId) === JSON.stringify(true));
  }, [localStorageId]);

  if (!isFormValid) {
    return (
      <CustomButton
        isLoading={isSaving}
        onClick={() => {
          onSave();
          toast({
            title: "Uh oh!",
            // variant: "destructive",
            description: "Please fix the errors in the form before saving.",
          });
        }}
      />
    );
  }

  if (!open && dontAskAgain) return <CustomButton isLoading={isSaving} onClick={onSave} />;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <CustomButton isLoading={isSaving} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {description}
          </AlertDialogDescription>
          <div className="!mt-6 flex items-center justify-center space-x-2 sm:justify-start">
            <Checkbox
              id="dontAskAgain"
              checked={dontAskAgain}
              onCheckedChange={(val) => setDontAskAgain(val as boolean)}
            />
            <label
              htmlFor="dontAskAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don't ask me again
            </label>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setOpen(false);
              if (dontAskAgain) {
                localStorage.setItem(localStorageId, JSON.stringify(true));
              }
              onSave();
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
