import React from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface Props {
    isLoading?: boolean;
    onClick?: () => void;
}

export const NextStepButton:React.FC<Props> = ({ isLoading, onClick }) => (
    <Button disabled={isLoading} type="button" variant={"default"} onClick={onClick}>
      {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
      <span>{isLoading ? "Creating Draft..." : "Next Step"}</span>
    </Button>
  );