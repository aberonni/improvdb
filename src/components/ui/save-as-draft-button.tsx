import React from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface Props {
    isLoading?: boolean;
    onClick?: () => void;
}

export const SaveAsDraftButton:React.FC<Props> = ({ isLoading, onClick }) => (
    <Button disabled={isLoading} type="button" variant={"secondary"} onClick={onClick}>
      {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
      <span>{isLoading ? "Saving Draft..." : "Save as Draft"}</span>
    </Button>
  );