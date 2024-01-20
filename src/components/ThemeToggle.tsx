"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import { Button, type buttonVariants } from "~/components/ui/button";
import { type VariantProps } from "class-variance-authority";

export function ThemeToggle({
  className,
  variant = "outline",
}: {
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={className}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
      <span className="ml-2 md:hidden" suppressHydrationWarning>
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
